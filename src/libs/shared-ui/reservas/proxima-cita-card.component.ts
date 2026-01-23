import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificacionCodeCardComponent } from '../verificacion-code-card/verificacion-code-card.component';

export interface ProximaCitaData {
  titulo: string;
  subtitulo: string;
  fecha: string;
  hora: string;
  // Valores ISO crudos para validaciones (no dependen del formato humanizado)
  appointmentDate?: string | null; // YYYY-MM-DD
  appointmentTime?: string | null; // HH:mm or HH:mm:ss
  diasRestantes: number;
  mostrarPagar?: boolean;
  clientConfirmed?: boolean;
  appointmentId?: number;
  successHighlight?: boolean;
  verification_code?: string;
  canRefund?: boolean;
  refundRequested?: boolean;
  paymentPreference?: 'card'|'cash'|null;
  precio?: number;
  cashCap?: number;
  cashCapLabel?: string;
  allowReprogram?: boolean;
  reprogramDisabledReason?: string;
  serviceCompletionState?: 'none'|'client_confirmed'|'auto_completed'|'dispute_pending'|'completed_refunded'|null;
  disputePending?: boolean;
  canFinalize?: boolean;
  canConfirmService?: boolean;
  canReport?: boolean;
  paymentStatus?: 'pending' | 'paid' | 'refunded' | null;
  paymentStatusLabel?: string;
}

@Component({
  selector: 'ui-proxima-cita-card',
  standalone: true,
  imports: [CommonModule, FormsModule, VerificacionCodeCardComponent],
  templateUrl: './proxima-cita-card.component.html',
  styleUrls: ['./proxima-cita-card.component.scss']
})
export class ProximaCitaCardComponent implements OnInit, OnChanges {
  @Input() data!: ProximaCitaData;
  @Output() contactar = new EventEmitter<void>();
  @Output() reprogramar = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<number>();
  @Output() pagar = new EventEmitter<number>();
  @Output() pagarTarjeta = new EventEmitter<number>();
  @Output() pagarEfectivo = new EventEmitter<number>();
  @Output() cambiarMetodo = new EventEmitter<number>();
  @Output() pedirDevolucion = new EventEmitter<{ appointmentId: number; reason: string }>();
  @Output() finalizarServicio = new EventEmitter<number>();
  @Output() reportarProblema = new EventEmitter<number>();

  showRefundArea = false;
  refundReason = '';
  selectedMethod: 'card' | 'cash' = 'card';
  primaryCtaLabel = 'Confirmar servicio';

  // Modal: bloquear acciones antes de la fecha/hora agendada
  tooEarlyModalOpen = false;
  tooEarlyModalTitle = 'Aún no puedes confirmar el servicio';
  tooEarlyModalMessage = '';
  expanded = true;

  ngOnInit(): void {
    this.selectedMethod = (this.data?.paymentPreference || 'card') as 'card' | 'cash';
    this.updatePrimaryLabel();
    this.expanded = !this.isPaid; // citas pagadas inician colapsadas
  }

  ngOnChanges(changes: SimpleChanges): void {
    const dataChange = changes['data'];
    const prevId = dataChange?.previousValue?.appointmentId;
    const currId = dataChange?.currentValue?.appointmentId;
    const appointmentChanged = prevId !== currId;
    const prefInput = this.data?.paymentPreference as ('card' | 'cash' | null | undefined);

    if (appointmentChanged || prefInput) {
      this.selectedMethod = (prefInput || 'card') as 'card' | 'cash';
      this.updatePrimaryLabel();
    }
    if (this.isPaid) {
      this.expanded = false; // al pasar a pagada, colapsar
    }
  }

  onPagarClick(): void {
    this.pagar.emit(this.data?.appointmentId || 0);
  }

  onPagarTarjetaClick(): void {
    this.selectedMethod = 'card';
    this.pagarTarjeta.emit(this.data?.appointmentId || 0);
  }

  onPagarEfectivoClick(): void {
    this.selectedMethod = 'cash';
    this.pagarEfectivo.emit(this.data?.appointmentId || 0);
  }

  onSelectMethod(method: 'card' | 'cash'): void {
    this.selectedMethod = method;
    // Mantener preferencia en data localmente para que no se pierda en el template
    if (this.data) {
      this.data.paymentPreference = method;
    }
    this.updatePrimaryLabel();
  }

  onPrimaryAction(): void {
    if (this.isBeforeAppointmentTime()) {
      this.openTooEarlyModal();
      return;
    }
    if (!this.data?.clientConfirmed) {
      this.onFinalizarClick();
      return;
    }
    if (this.selectedMethod === 'card') {
      this.onPagarTarjetaClick();
    } else {
      this.onPagarEfectivoClick();
    }
  }

  onContactarClick(): void {
    this.contactar.emit();
  }

  onReprogramarClick(): void {
    if (this.data?.allowReprogram === false) {
      return;
    }
    this.reprogramar.emit(this.data?.appointmentId || 0);
  }

  onCancelarClick(): void {
    if (this.data?.appointmentId) {
      this.cancelar.emit(this.data.appointmentId);
    } else {
      this.cancelar.emit(0);
    }
  }

  onRefundClick(): void {
    this.showRefundArea = !this.showRefundArea;
  }

  submitRefund(): void {
    const appointmentId = this.data?.appointmentId || 0;
    if (!appointmentId || !this.refundReason || this.refundReason.trim().length < 10) {
      return;
    }
    this.pedirDevolucion.emit({ appointmentId, reason: this.refundReason.trim() });
  }

  onFinalizarClick(): void {
    if (!this.data?.appointmentId) return;
    if (this.isBeforeAppointmentTime()) {
      this.openTooEarlyModal();
      return;
    }
    this.finalizarServicio.emit(this.data.appointmentId);
  }

  onReportarClick(): void {
    if (!this.data?.appointmentId) return;
    this.reportarProblema.emit(this.data.appointmentId);
  }

  get isPaid(): boolean {
    return !!(
      this.data?.successHighlight ||
      this.data?.verification_code ||
      this.data?.paymentStatus === 'paid'
    );
  }

  toggleContent(): void {
    if (!this.isPaid) {
      this.expanded = true;
      return;
    }
    this.expanded = !this.expanded;
  }

  private updatePrimaryLabel(): void {
    if (!this.data) {
      this.primaryCtaLabel = 'Procesando...';
      return;
    }
    if (!this.data.clientConfirmed) {
      this.primaryCtaLabel = 'Confirmar servicio';
      return;
    }
    if (this.selectedMethod === 'card') {
      this.primaryCtaLabel = this.data.precio ? `Pagar $${(this.data.precio as number).toLocaleString('es-CL')}` : 'Pagar con tarjeta';
    } else {
      this.primaryCtaLabel = 'Confirmar pago en efectivo';
    }
  }

  private isBeforeAppointmentTime(): boolean {
    const dateRaw = String(this.data?.appointmentDate || '').trim();
    const timeRaw = String(this.data?.appointmentTime || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return false;
    const hhmm = (timeRaw || '').slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return false;

    const [y, m, d] = dateRaw.split('-').map(Number);
    const [hh, mm] = hhmm.split(':').map(Number);
    const appt = new Date(y, (m - 1), d, hh, mm, 0, 0);
    const now = new Date();
    return now.getTime() < appt.getTime();
  }

  private openTooEarlyModal(): void {
    const when = `${this.data?.fecha || ''}${this.data?.hora ? ' · ' + this.data.hora : ''}`.trim();
    this.tooEarlyModalTitle = this.data?.clientConfirmed
      ? 'Aún no puedes pagar esta cita'
      : 'Aún no puedes confirmar el servicio';
    this.tooEarlyModalMessage = this.data?.clientConfirmed
      ? `El pago solo se habilita cuando llegue la fecha y hora agendada (${when}).`
      : `Aún no puedes confirmar el servicio hasta que llegue la fecha y la hora agendada (${when}).`;
    this.tooEarlyModalOpen = true;
  }

  closeTooEarlyModal(): void {
    this.tooEarlyModalOpen = false;
  }
}







