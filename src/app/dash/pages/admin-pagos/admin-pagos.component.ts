import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../../../auth/services/session.service';
import { FormsModule } from '@angular/forms';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminSummaryCardsComponent } from './admin-summary-cards.component';
import { AdminPaymentsTableComponent } from './admin-payments-table.component';
import { AdminCashReviewPanelComponent } from './components/admin-cash-review-panel/admin-cash-review-panel.component';

@Component({
  selector: 'app-admin-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSummaryCardsComponent, AdminCashReviewPanelComponent, AdminPaymentsTableComponent],
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
  gateway: '' | 'tbk' | 'stripe' | 'cash' = '';
  summary: any = null;
  payRow: any = null;
  payRef: string = '';
  payFile: File | null = null;
  // Estado de pago de devolución
  refundPayRow: any = null;
  refundPayRef: string = '';
  refundPayFile: File | null = null;
  cashSummary: any = null;
  cashDebts: any[] = [];
  cashSummaryLoading = false;
  cashLoading = false;
  cashFilter: 'all'|'pending'|'overdue'|'under_review'|'rejected'|'paid' = 'pending';
  verificationLoading = false;
  verificationError: string | null = null;
  verificationFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  verificationSearch = '';
  verificationLimit = 25;
  verificationOffset = 0;
  verificationPagination: { limit: number; offset: number; returned: number } | null = null;
  verificationRequests: any[] = [];
  verificationNotes: Record<number, string> = {};
  verificationRejectReasons: Record<number, string> = {};
  verificationProcessing: Record<number, boolean> = {};
  verificationDetail: any | null = null;
  verificationDetailLoading = false;
  verificationDetailError: string | null = null;
  founderGenerating = false;
  founderSending = false;
  founderCode: string | null = null;
  founderPromoInfo: { id?: number | null; code?: string; expires_at?: string | null; duration_months?: number | null; max_redemptions?: number | null } | null = null;
  founderSuccess: string | null = null;
  founderErrorMsg: string | null = null;
  founderEmailStatus: 'idle' | 'sent' | 'error' = 'idle';
  founderEmailErrorDetail: string | null = null;
  founderRecipientEmail = '';
  founderRecipientName = '';
  founderCustomMessage = '';
  founderDurationMonths: number | null = null;
  founderExpiryMonths: number | null = 6;
  founderNotes = '';

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
    this.adminApi.list(this.adminSecret, token, this.startISO, this.endISO, undefined, this.gateway).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          this.rows = res.data || [];
          // cargar resumen
          this.adminApi.summary(this.adminSecret, token, this.startISO, this.endISO, this.gateway).subscribe((s: any) => {
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
          if (this.gateway === 'cash') {
            this.loadAdminCashSummary();
            this.loadAdminCashCommissions(this.cashFilter);
          } else {
            this.cashSummary = null;
            this.cashDebts = [];
          }
          this.loadVerificationRequests(this.verificationFilter);
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

  private loadAdminCashSummary() {
    const token = this.session.getAccessToken();
    this.cashSummaryLoading = true;
    this.adminApi.cashSummary(this.adminSecret, token).subscribe({
      next: (res: any) => {
        this.cashSummaryLoading = false;
        this.cashSummary = res?.summary || null;
      },
      error: () => {
        this.cashSummaryLoading = false;
        this.cashSummary = null;
      }
    });
  }

  private loadAdminCashCommissions(filter: 'all'|'pending'|'overdue'|'under_review'|'rejected'|'paid' = this.cashFilter) {
    const token = this.session.getAccessToken();
    this.cashLoading = true;
    this.cashFilter = filter;
    this.adminApi.cashCommissions(this.adminSecret, token, filter).subscribe({
      next: (res: any) => {
        this.cashLoading = false;
        this.cashDebts = res?.data || [];
      },
      error: () => {
        this.cashLoading = false;
        this.cashDebts = [];
      }
    });
  }

  setCashFilterAdmin(filter: 'all'|'pending'|'overdue'|'under_review'|'rejected'|'paid') {
    if (this.cashFilter === filter && !this.cashLoading) return;
    this.loadAdminCashCommissions(filter);
  }

  private loadVerificationRequests(filter: 'all' | 'pending' | 'approved' | 'rejected', offset: number = 0) {
    if (!this.adminSecret) return;
    const token = this.session.getAccessToken();
    this.verificationLoading = true;
    this.verificationError = null;
    this.verificationDetail = null;
    this.verificationDetailError = null;
    this.verificationDetailLoading = false;

    this.verificationOffset = Math.max(0, offset || 0);
    const statusParam = filter === 'all' ? undefined : filter;
    const searchTerm = this.verificationSearch?.trim();

    this.adminApi.listVerifications(this.adminSecret, token, {
      status: statusParam,
      limit: this.verificationLimit,
      offset: this.verificationOffset,
      search: searchTerm ? searchTerm : undefined
    }).subscribe({
      next: (res: any) => {
        this.verificationLoading = false;
        if (res?.success) {
          this.verificationRequests = res.data || [];
          this.verificationPagination = res.pagination || { limit: this.verificationLimit, offset: this.verificationOffset, returned: (res.data || []).length };
        } else {
          this.verificationError = res?.error || 'No fue posible cargar las verificaciones.';
          this.verificationPagination = null;
        }
      },
      error: (err: any) => {
        this.verificationLoading = false;
        this.verificationError = err?.error?.error || 'No fue posible cargar las verificaciones.';
        this.verificationPagination = null;
      }
    });
  }

  setVerificationFilter(filter: 'all' | 'pending' | 'approved' | 'rejected') {
    if (this.verificationFilter === filter && !this.verificationLoading) return;
    this.verificationFilter = filter;
    this.verificationOffset = 0;
    this.loadVerificationRequests(filter, 0);
  }

  applyVerificationSearch() {
    if (this.verificationLoading) return;
    this.verificationOffset = 0;
    this.loadVerificationRequests(this.verificationFilter, 0);
  }

  clearVerificationSearch() {
    this.verificationSearch = '';
    this.applyVerificationSearch();
  }

  nextVerificationPage() {
    if (this.verificationLoading) return;
    const nextOffset = this.verificationOffset + this.verificationLimit;
    this.loadVerificationRequests(this.verificationFilter, nextOffset);
  }

  prevVerificationPage() {
    if (this.verificationLoading) return;
    const prevOffset = Math.max(0, this.verificationOffset - this.verificationLimit);
    if (prevOffset === this.verificationOffset) return;
    this.loadVerificationRequests(this.verificationFilter, prevOffset);
  }

  approveVerification(request: any) {
    if (!this.adminSecret) return;
    const token = this.session.getAccessToken();
    const notes = (this.verificationNotes[request.id] || '').trim();
    this.verificationProcessing[request.id] = true;
    this.adminApi.approveVerification(this.adminSecret, token, Number(request.id), notes || undefined).subscribe({
      next: () => {
        delete this.verificationProcessing[request.id];
        this.clearVerificationDetail();
        this.loadVerificationRequests(this.verificationFilter);
      },
      error: (err) => {
        delete this.verificationProcessing[request.id];
        alert(err?.error?.error || 'No se pudo aprobar la verificación.');
      }
    });
  }

  viewVerificationDetail(request: any) {
    if (!this.adminSecret) return;
    const token = this.session.getAccessToken();
    this.verificationDetailLoading = true;
    this.verificationDetailError = null;
    this.verificationDetail = null;

    this.adminApi.getVerificationDetail(this.adminSecret, token, Number(request.id)).subscribe({
      next: (res: any) => {
        this.verificationDetailLoading = false;
        if (res?.success) {
          this.verificationDetail = res.data;
        } else {
          this.verificationDetailError = res?.error || 'No fue posible obtener el detalle de la verificación.';
        }
      },
      error: (err: any) => {
        this.verificationDetailLoading = false;
        this.verificationDetailError = err?.error?.error || 'No fue posible obtener el detalle de la verificación.';
      }
    });
  }

  refreshVerificationDetail() {
    if (!this.verificationDetail?.id) {
      this.verificationDetail = null;
      return;
    }
    this.viewVerificationDetail({ id: this.verificationDetail.id });
  }

  clearVerificationDetail() {
    this.verificationDetail = null;
    this.verificationDetailError = null;
    this.verificationDetailLoading = false;
  }

  rejectVerification(request: any) {
    if (!this.adminSecret) return;
    const token = this.session.getAccessToken();
    const reason = (this.verificationRejectReasons[request.id] || '').trim();
    if (!reason) {
      alert('Debes ingresar un motivo de rechazo.');
      return;
    }
    const notes = (this.verificationNotes[request.id] || '').trim();
    this.verificationProcessing[request.id] = true;
    this.adminApi.rejectVerification(this.adminSecret, token, Number(request.id), reason, notes || undefined).subscribe({
      next: () => {
        delete this.verificationProcessing[request.id];
        this.clearVerificationDetail();
        this.loadVerificationRequests(this.verificationFilter);
      },
      error: (err) => {
        delete this.verificationProcessing[request.id];
        alert(err?.error?.error || 'No se pudo rechazar la verificación.');
      }
    });
  }

  refreshAdminCash() {
    this.loadAdminCashSummary();
    this.loadAdminCashCommissions(this.cashFilter);
  }

  private resetFounderMessages() {
    this.founderSuccess = null;
    this.founderErrorMsg = null;
    this.founderEmailStatus = 'idle';
    this.founderEmailErrorDetail = null;
  }

  resetFounderForm() {
    this.founderCode = null;
    this.founderPromoInfo = null;
    this.founderRecipientEmail = '';
    this.founderRecipientName = '';
    this.founderCustomMessage = '';
    this.founderDurationMonths = null;
    this.founderExpiryMonths = 6;
    this.founderNotes = '';
    this.resetFounderMessages();
  }

  generateFounderCode() {
    this.resetFounderMessages();
    if (!this.adminSecret) {
      this.founderErrorMsg = 'Primero debes ingresar el ADMIN_PANEL_SECRET.';
      return;
    }

    this.founderGenerating = true;
    const token = this.session.getAccessToken();
    const payload: any = {};

    if (this.founderDurationMonths && this.founderDurationMonths > 0) {
      payload.durationMonths = this.founderDurationMonths;
    }
    if (this.founderExpiryMonths && this.founderExpiryMonths > 0) {
      payload.expiryMonths = this.founderExpiryMonths;
    }
    if (this.founderNotes && this.founderNotes.trim().length) {
      payload.notes = this.founderNotes.trim();
    }
    if (this.founderRecipientEmail && this.founderRecipientEmail.trim().length) {
      payload.recipientEmail = this.founderRecipientEmail.trim().toLowerCase();
    }

    this.adminApi.generateFounderCode(this.adminSecret, token, payload).subscribe({
      next: (res) => {
        this.founderGenerating = false;
        if (res?.ok && res?.promo?.code) {
          this.founderCode = res.promo.code;
          this.founderPromoInfo = res.promo;
          this.founderSuccess = 'Código Fundador generado correctamente.';
          this.founderEmailStatus = 'idle';
        } else {
          this.founderErrorMsg = res?.error || 'No fue posible generar el código.';
        }
      },
      error: (err) => {
        this.founderGenerating = false;
        this.founderErrorMsg = err?.error?.error || 'No fue posible generar el código.';
      }
    });
  }

  async copyFounderCode() {
    if (!this.founderCode) return;
    this.resetFounderMessages();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(this.founderCode);
        this.founderSuccess = 'Código copiado al portapapeles.';
      } else {
        this.founderErrorMsg = 'El portapapeles no está disponible.';
      }
    } catch (error) {
      this.founderErrorMsg = 'No se pudo copiar el código.';
    }
  }

  sendFounderCode() {
    this.resetFounderMessages();
    if (!this.founderCode) {
      this.founderErrorMsg = 'Genera un código antes de enviar el correo.';
      return;
    }

    const email = this.founderRecipientEmail?.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.founderErrorMsg = 'Ingresa un correo electrónico válido.';
      return;
    }

    this.founderSending = true;
    const token = this.session.getAccessToken();
    const payload = {
      code: this.founderCode,
      recipientEmail: email,
      recipientName: this.founderRecipientName?.trim() || null,
      message: this.founderCustomMessage?.trim() || null
    };

    this.adminApi.sendFounderCode(this.adminSecret, token, payload).subscribe({
      next: (res) => {
        this.founderSending = false;
        if (res?.ok) {
          if (res.emailSent) {
            this.founderSuccess = 'Correo enviado correctamente.';
            this.founderEmailStatus = 'sent';
            this.founderEmailErrorDetail = null;
          } else {
            this.founderEmailStatus = 'error';
            this.founderEmailErrorDetail = res?.emailError || 'No fue posible enviar el correo. Verifica la configuración SMTP.';
            this.founderErrorMsg = this.founderEmailErrorDetail;
          }
        } else {
          this.founderEmailStatus = 'error';
          this.founderEmailErrorDetail = res?.error || 'No fue posible enviar el correo.';
          this.founderErrorMsg = this.founderEmailErrorDetail;
        }
      },
      error: (err) => {
        this.founderSending = false;
        this.founderEmailStatus = 'error';
        this.founderEmailErrorDetail = err?.error?.error || 'No fue posible enviar el correo.';
        this.founderErrorMsg = this.founderEmailErrorDetail;
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

  setGateway(gw: any) {
    const g = String(gw).toLowerCase();
    if (g === 'tbk' || g === 'stripe' || g === 'cash' || g === '') {
      this.gateway = g as any;
      if (this.gateway !== 'cash') {
        this.cashSummary = null;
        this.cashDebts = [];
      }
      this.load();
    }
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


