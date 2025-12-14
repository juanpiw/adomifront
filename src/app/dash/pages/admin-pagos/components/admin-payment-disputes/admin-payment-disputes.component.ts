import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../../../auth/services/session.service';
import { AdminPaymentsService } from '../../admin-payments.service';

type DisputeStatus = 'open' | 'need_evidence' | 'represented' | 'won' | 'lost' | 'cancelled';
type RefundScope = 'proveedor' | 'plataforma' | 'total';

@Component({
  selector: 'app-admin-payment-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-payment-disputes.component.html',
  styleUrls: ['./admin-payment-disputes.component.scss']
})
export class AdminPaymentDisputesComponent implements OnInit {
  private session = inject(SessionService);
  private api = inject(AdminPaymentsService);

  @Input() adminSecret = '';

  loading = false;
  error: string | null = null;

  statusFilter: '' | DisputeStatus = '';
  qPaymentId = '';
  qAppointmentId = '';

  disputes: any[] = [];

  // Modal
  selected: any | null = null;
  modalTab: 'actions' | 'evidence' | 'tbk' | 'geo' = 'actions';
  evidenceText = '';
  evidenceHash: string | null = null;
  actionLoading = false;
  actionError: string | null = null;

  refundScope: RefundScope = 'total';
  refundLoading = false;
  refundResult: any | null = null;

  tbkStatusLoading = false;
  tbkStatus: any | null = null;

  geoLoading = false;
  geoEvents: any[] = [];
  geoError: string | null = null;

  ngOnInit(): void {
    // Cargar si ya hay secret
    if (this.adminSecret) {
      this.load();
    }
  }

  private token(): string | null {
    return this.session.getAccessToken();
  }

  load(): void {
    if (!this.adminSecret) return;
    this.loading = true;
    this.error = null;
    const token = this.token();
    const payment_id = Number(this.qPaymentId || 0) || undefined;
    const appointment_id = Number(this.qAppointmentId || 0) || undefined;
    const status = this.statusFilter || undefined;
    this.api.listPaymentDisputes(this.adminSecret, token, { status, payment_id, appointment_id, limit: 100, offset: 0 }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.disputes = res?.data || [];
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.error || err?.message || 'No fue posible cargar disputas.';
        this.disputes = [];
      }
    });
  }

  open(dispute: any): void {
    this.selected = dispute;
    this.modalTab = 'actions';
    this.evidenceText = '';
    this.evidenceHash = dispute?.evidence_hash || null;
    this.actionError = null;
    this.refundResult = null;
    this.tbkStatus = null;
    this.geoEvents = [];
    this.geoError = null;
    this.geoLoading = false;
  }

  loadGeo(): void {
    if (!this.selected || !this.adminSecret) return;
    const appointmentId = Number(this.selected?.appointment_id || 0);
    if (!appointmentId) {
      this.geoError = 'Sin appointment_id en disputa.';
      return;
    }
    this.geoLoading = true;
    this.geoError = null;
    const token = this.token();
    this.api.getAppointmentLocationEvents(this.adminSecret, token, appointmentId).subscribe({
      next: (res: any) => {
        this.geoLoading = false;
        this.geoEvents = res?.data || [];
      },
      error: (err: any) => {
        this.geoLoading = false;
        this.geoError = err?.error?.error || err?.error?.message || 'No fue posible cargar eventos de ubicación.';
        this.geoEvents = [];
      }
    });
  }

  close(): void {
    this.selected = null;
  }

  badgeClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'open' || s === 'need_evidence') return 'badge badge--warn';
    if (s === 'represented') return 'badge badge--info';
    if (s === 'won') return 'badge badge--good';
    if (s === 'lost') return 'badge badge--bad';
    if (s === 'cancelled') return 'badge badge--muted';
    return 'badge';
  }

  updateStatus(next: DisputeStatus): void {
    if (!this.selected || !this.adminSecret) return;
    this.actionLoading = true;
    this.actionError = null;
    const token = this.token();
    this.api.updatePaymentDispute(this.adminSecret, token, Number(this.selected.id), { status: next }).subscribe({
      next: () => {
        this.actionLoading = false;
        // refrescar lista y selected
        const prevId = this.selected?.id;
        this.load();
        this.selected = { ...this.selected, status: next };
        // mantener abierto
        if (prevId) this.selected.id = prevId;
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError = err?.error?.error || 'No fue posible actualizar el estado.';
      }
    });
  }

  lockEvidence(): void {
    if (!this.selected || !this.adminSecret) return;
    const txt = (this.evidenceText || '').trim();
    if (txt.length < 5) {
      this.actionError = 'Pega una evidencia o descripción (mínimo 5 caracteres).';
      return;
    }
    this.actionLoading = true;
    this.actionError = null;
    const token = this.token();
    const payload = {
      evidence: {
        text: txt,
        added_by: this.session.getUser()?.email || null,
        added_at: new Date().toISOString()
      }
    };
    this.api.lockPaymentDisputeEvidence(this.adminSecret, token, Number(this.selected.id), payload).subscribe({
      next: (resp: any) => {
        this.actionLoading = false;
        this.evidenceHash = resp?.evidence_hash || this.evidenceHash;
        this.selected = { ...this.selected, evidence_locked_at: this.selected?.evidence_locked_at || new Date().toISOString(), evidence_hash: this.evidenceHash };
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.actionError = err?.error?.error || 'No fue posible bloquear evidencia.';
      }
    });
  }

  fetchTbkStatus(): void {
    if (!this.selected || !this.adminSecret) return;
    const paymentId = Number(this.selected.payment_id || 0);
    if (!paymentId) return;
    this.tbkStatusLoading = true;
    this.tbkStatus = null;
    const token = this.token();
    this.api.tbkOneclickStatus(this.adminSecret, token, paymentId).subscribe({
      next: (resp: any) => {
        this.tbkStatusLoading = false;
        this.tbkStatus = resp;
      },
      error: (err: any) => {
        this.tbkStatusLoading = false;
        this.tbkStatus = { success: false, error: err?.error?.error || 'No fue posible consultar estado TBK.' };
      }
    });
  }

  refund(): void {
    if (!this.selected || !this.adminSecret) return;
    const paymentId = Number(this.selected.payment_id || 0);
    if (!paymentId) return;
    this.refundLoading = true;
    this.refundResult = null;
    const token = this.token();
    this.api.tbkOneclickRefund(this.adminSecret, token, paymentId, this.refundScope).subscribe({
      next: (resp: any) => {
        this.refundLoading = false;
        this.refundResult = resp;
        // refrescar lista
        this.load();
      },
      error: (err: any) => {
        this.refundLoading = false;
        this.refundResult = { success: false, error: err?.error?.error || 'Refund falló', details: err?.error || null };
      }
    });
  }
}


