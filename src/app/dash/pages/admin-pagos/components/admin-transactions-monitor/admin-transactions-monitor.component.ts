import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TxStatus = 'captured_hold' | 'released' | 'disputed_lock' | 'refunded';

@Component({
  selector: 'app-admin-transactions-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-transactions-monitor.component.html',
  styleUrls: ['./admin-transactions-monitor.component.scss']
})
export class AdminTransactionsMonitorComponent {
  @Input() rows: any[] = [];

  statusFilter: '' | TxStatus = '';
  q = '';

  deriveTxStatus(r: any): TxStatus {
    const paymentStatus = String(r?.status || '').toLowerCase();
    const releaseStatus = String(r?.release_status || r?.settlement_status || '').toLowerCase();
    const apptStatus = String(r?.appointment_status || '').toLowerCase();
    const hasInApp = Number(r?.has_in_app_dispute || 0) === 1;
    const hasCb = Number(r?.has_active_chargeback || 0) === 1;

    if (paymentStatus === 'refunded') return 'refunded';
    if (apptStatus === 'dispute_pending' || hasInApp || hasCb) return 'disputed_lock';
    if (releaseStatus === 'completed') return 'released';
    return 'captured_hold';
  }

  filteredRows(): any[] {
    const q = (this.q || '').trim().toLowerCase();
    return (this.rows || [])
      .map((r) => ({ ...r, tx_status: this.deriveTxStatus(r) }))
      .filter((r: any) => {
        if (this.statusFilter && r.tx_status !== this.statusFilter) return false;
        if (!q) return true;
        const hay = [
          r.id,
          r.appointment_id,
          r.client_email,
          r.client_name,
          r.provider_email,
          r.provider_name,
          r.gateway,
          r.status,
          r.release_status
        ]
          .map((v) => (v == null ? '' : String(v)))
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
  }

  sumAmount(predicate: (r: any) => boolean, field: 'amount' | 'provider_amount' = 'amount'): number {
    return this.filteredRows()
      .filter(predicate)
      .reduce((sum: number, r: any) => sum + Number(r?.[field] || 0), 0);
  }

  totalVolume(): number {
    return this.sumAmount(() => true, 'amount');
  }
  heldVolume(): number {
    return this.sumAmount((r) => r.tx_status === 'captured_hold' || r.tx_status === 'disputed_lock', 'provider_amount');
  }
  releasedVolume(): number {
    return this.sumAmount((r) => r.tx_status === 'released', 'provider_amount');
  }
  refundedVolume(): number {
    return this.sumAmount((r) => r.tx_status === 'refunded', 'amount');
  }

  badgeClass(txStatus: TxStatus): string {
    if (txStatus === 'captured_hold') return 'chip chip--hold';
    if (txStatus === 'released') return 'chip chip--released';
    if (txStatus === 'disputed_lock') return 'chip chip--dispute';
    return 'chip chip--refunded';
  }
}





