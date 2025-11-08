import { Component, EventEmitter, Input, Output, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCashPaymentsService, ManualCashPaymentsFilter } from '../../services/admin-cash-payments.service';
import { AdminManualCashPayment, AdminManualCashPaymentDetail } from '../../models/admin-cash-payment.model';

@Component({
  selector: 'app-admin-cash-review-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cash-review-panel.component.html',
  styleUrls: ['./admin-cash-review-panel.component.scss']
})
export class AdminCashReviewPanelComponent {
  private cashPayments = inject(AdminCashPaymentsService);

  private adminSecretSig = signal<string>('');

  @Input() set adminSecret(value: string) {
    this.adminSecretSig.set((value || '').trim());
  }

  get adminSecret(): string {
    return this.adminSecretSig();
  }

  @Output() refreshRequested = new EventEmitter<void>();

  // Signals
  state = this.cashPayments.state;
  detailReference = signal<string>('');
  detailNotes = signal<string>('');
  detailRejectReason = signal<string>('');
  resubmissionReason = signal<string>('');
  resubmissionNotes = signal<string>('');
  actionMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  filters: { value: ManualCashPaymentsFilter; label: string }[] = [
    { value: 'under_review', label: 'En revisión' },
    { value: 'paid', label: 'Aprobados' },
    { value: 'rejected', label: 'Rechazados' },
    { value: 'all', label: 'Todos' }
  ];

  constructor() {
    effect(() => {
      const secret = this.adminSecretSig();
      this.cashPayments.setSecret(secret);
    });

    effect(() => {
      const detail = this.state().detail;
      if (detail) {
        this.syncDetailForm(detail);
      } else {
        this.resetDetailForm();
      }
    });
  }

  trackByPaymentId(_: number, payment: AdminManualCashPayment) {
    return payment.id;
  }

  onRefreshList() {
    void this.cashPayments.refreshList();
  }

  onFilterChange(filter: ManualCashPaymentsFilter) {
    this.cashPayments.setFilter(filter);
  }

  onSelectPayment(payment: AdminManualCashPayment) {
    void this.cashPayments.openDetail(payment.id);
  }

  onCloseDetail() {
    this.cashPayments.clearDetail();
  }

  async onApprove(detail: AdminManualCashPaymentDetail) {
    const response = await this.cashPayments.approve(detail.id, {
      reference: this.detailReference().trim() || null,
      notes: this.detailNotes().trim() || null
    });
    this.handleActionResponse(response, 'Pago manual aprobado.');
  }

  async onReject(detail: AdminManualCashPaymentDetail) {
    const response = await this.cashPayments.reject(detail.id, {
      reason: this.detailRejectReason().trim(),
      notes: this.detailNotes().trim() || null
    });
    this.handleActionResponse(response, 'Comprobante rechazado.');
  }

  async onRequestResubmission(detail: AdminManualCashPaymentDetail) {
    const response = await this.cashPayments.requestResubmission(detail.id, {
      reason: this.resubmissionReason().trim(),
      notes: this.resubmissionNotes().trim() || null
    });
    this.handleActionResponse(response, 'Se solicitó reenvío del comprobante.');
  }

  onClearMessages() {
    this.actionMessage.set(null);
  }

  private handleActionResponse(
    response: { success: boolean; error?: string },
    successMessage: string
  ) {
    if (response.success) {
      this.actionMessage.set({ type: 'success', text: successMessage });
      this.refreshRequested.emit();
      this.resubmissionReason.set('');
      this.resubmissionNotes.set('');
    } else if (response.error) {
      this.actionMessage.set({ type: 'error', text: response.error });
    }
  }

  private syncDetailForm(detail: AdminManualCashPaymentDetail) {
    this.detailReference.set(detail.reference || '');
    this.detailNotes.set(detail.review_notes || '');
    const rejectionReason = detail.metadata?.rejection_reason || '';
    this.detailRejectReason.set(typeof rejectionReason === 'string' ? rejectionReason : '');
    this.actionMessage.set(null);
  }

  private resetDetailForm() {
    this.detailReference.set('');
    this.detailNotes.set('');
    this.detailRejectReason.set('');
    this.resubmissionReason.set('');
    this.resubmissionNotes.set('');
    this.actionMessage.set(null);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'submitted':
        return 'Comprobante enviado';
      case 'under_review':
        return 'En revisión';
      case 'paid':
        return 'Pagado';
      case 'rejected':
        return 'Rechazado';
      case 'reopened':
        return 'Reabierto';
      case 'notes_updated':
        return 'Notas actualizadas';
      case 'approved':
        return 'Aprobado';
      default:
        return status;
    }
  }
}


