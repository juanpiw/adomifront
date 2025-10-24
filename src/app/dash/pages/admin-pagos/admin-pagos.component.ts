import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../../../auth/services/session.service';
import { FormsModule } from '@angular/forms';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminSummaryCardsComponent } from './admin-summary-cards.component';
import { AdminPaymentsTableComponent } from './admin-payments-table.component';

@Component({
  selector: 'app-admin-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSummaryCardsComponent, AdminPaymentsTableComponent],
  templateUrl: './admin-pagos.component.html',
  styleUrls: ['./admin-pagos.component.scss']
})
export class AdminPagosComponent implements OnInit {
  private http = inject(HttpClient);
  private session = inject(SessionService);
  private adminApi = inject(AdminPaymentsService);
  baseUrl = environment.apiBaseUrl;
  loading = false;
  error: string | null = null;
  rows: any[] = [];
  refunds: any[] = [];
  adminSecret = '';
  startISO: string | null = null;
  endISO: string | null = null;
  summary: any = null;
  payRow: any = null;
  payRef: string = '';
  payFile: File | null = null;
  // Estado de pago de devolución
  refundPayRow: any = null;
  refundPayRef: string = '';
  refundPayFile: File | null = null;

  ngOnInit() {
    const email = this.session.getUser()?.email?.toLowerCase();
    if (email !== 'juanpablojpw@gmail.com') {
      this.error = 'Acceso restringido';
      return;
    }
    const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin:secret') : null;
    if (saved) this.adminSecret = saved;
    if (this.adminSecret) this.load();
  }

  setSecretAndLoad() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('admin:secret', this.adminSecret);
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    const token = this.session.getAccessToken();
    this.adminApi.list(this.adminSecret, token, this.startISO, this.endISO).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          this.rows = res.data || [];
          // cargar resumen
          this.adminApi.summary(this.adminSecret, token, this.startISO, this.endISO).subscribe((s: any) => {
            const sum = s?.summary || {};
            // Normalizar a números
            const toNum = (v: any) => Number(v || 0);
            this.summary = {
              total_gross: toNum(sum.total_gross),
              total_tax: toNum(sum.total_tax),
              total_commission: toNum(sum.total_commission),
              total_provider: toNum(sum.total_provider),
              pending_total_provider: toNum(sum.pending_total_provider),
              eligible_total_provider: toNum(sum.eligible_total_provider),
              completed_total_provider: toNum(sum.completed_total_provider)
            };
          });
          // cargar devoluciones
          this.adminApi.listRefunds(this.adminSecret, token).subscribe((r: any) => {
            this.refunds = r?.data || [];
          });
        } else {
          this.error = 'Respuesta inválida';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.error || 'Error cargando pagos';
      }
    });
  }

  exportCsv() {
    const token = this.session.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': this.adminSecret
    });
    const params: string[] = [];
    if (this.startISO && this.endISO) {
      params.push(`start=${encodeURIComponent(this.startISO)}`);
      params.push(`end=${encodeURIComponent(this.endISO)}`);
    }
    const url = `${this.baseUrl}/admin/payments/export.csv${params.length ? ('?' + params.join('&')) : ''}`;
    this.http.get(url, { headers, responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'payments.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  applyRange(range: any) {
    const r = String(range) as 'day' | 'week' | 'month' | 'all';
    const now = new Date();
    const start = new Date(now);
    if (r === 'day') {
      start.setHours(0,0,0,0);
    } else if (r === 'week') {
      const day = now.getDay();
      const diff = (day === 0 ? 6 : day - 1); // lunes como inicio
      start.setDate(now.getDate() - diff);
      start.setHours(0,0,0,0);
    } else if (r === 'month') {
      start.setDate(1);
      start.setHours(0,0,0,0);
    }
    if (r === 'all') {
      this.startISO = null;
      this.endISO = null;
    } else {
      this.startISO = start.toISOString().slice(0,19).replace('T',' ');
      const end = new Date(now);
      this.endISO = end.toISOString().slice(0,19).replace('T',' ');
    }
    this.load();
  }

  computeSettlementDate(paidAt: string | Date | null): Date | null {
    if (!paidAt) return null;
    const d = new Date(paidAt);
    // T+3 hábiles (simplificado: salta sábados y domingos)
    let added = 0;
    while (added < 3) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return d;
  }

  mask(value: string | null | undefined): string {
    if (!value) return '-';
    const v = String(value).replace(/\s+/g, '');
    if (v.length <= 4) return '••••';
    return '•••• ' + v.slice(-4);
  }

  onMarkReleased(row: any) {
    const token = this.session.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': this.adminSecret
    });
    const ref = prompt('Referencia de transferencia (opcional):') || '';
    this.http.post(`${this.baseUrl}/admin/payments/${row.id}/mark-released`, { reference: ref }, { headers }).subscribe({
      next: () => this.load(),
      error: () => alert('No se pudo marcar como pagado')
    });
  }

  onTableAction(evt: { type: 'pay'; row: any }) {
    if (!evt) return;
    if (evt.type === 'pay') {
      this.payRow = evt.row;
      this.payRef = '';
      this.payFile = null;
    }
  }

  onVoucherSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input?.files;
    this.payFile = files && files.length ? files[0] : null;
  }

  openRefundPay(r: any) {
    this.refundPayRow = r;
    this.refundPayRef = '';
    this.refundPayFile = null;
  }

  onRefundVoucherSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input?.files;
    this.refundPayFile = files && files.length ? files[0] : null;
  }

  async confirmRefundPay(r: any) {
    const token = this.session.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': this.adminSecret
    });
    try {
      if (this.refundPayFile) {
        const fd = new FormData();
        fd.append('voucher', this.refundPayFile);
        await this.http.post(`${this.baseUrl}/admin/refunds/${r.id}/upload-voucher`, fd, { headers }).toPromise();
      }
      await this.http.post(`${this.baseUrl}/admin/refunds/${r.id}/mark-paid`, { reference: this.refundPayRef }, { headers }).toPromise();
      this.refundPayRow = null;
      this.load();
    } catch {
      alert('No se pudo marcar la devolución como pagada');
    }
  }

  async confirmPay() {
    if (!this.payRow) return;
    const token = this.session.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': this.adminSecret
    });
    try {
      // subir voucher si existe
      if (this.payFile) {
        const fd = new FormData();
        fd.append('voucher', this.payFile);
        await this.http.post(`${this.baseUrl}/admin/payments/${this.payRow.id}/upload-voucher`, fd, { headers }).toPromise();
      }
      // marcar pagado con referencia
      await this.http.post(`${this.baseUrl}/admin/payments/${this.payRow.id}/mark-released`, { reference: this.payRef }, { headers }).toPromise();
      this.payRow = null;
      this.load();
    } catch {
      alert('No se pudo confirmar el pago');
    }
  }

  decideRefund(r: any, decision: 'approved'|'denied'|'cancelled') {
    const token = this.session.getAccessToken();
    const notes = '';
    this.adminApi.decideRefund(this.adminSecret, token, Number(r.id), decision, notes).subscribe({
      next: () => this.load(),
      error: () => alert('No se pudo registrar la decisión')
    });
  }
}


