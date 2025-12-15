import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificacionCodeCardComponent } from '../verificacion-code-card/verificacion-code-card.component';

export interface ProximaCitaData {
  titulo: string;
  subtitulo: string;
  fecha: string;
  hora: string;
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
  @Output() pedirDevolucion = new EventEmitter<{ appointmentId: number; reason: string }>();
  @Output() finalizarServicio = new EventEmitter<number>();
  @Output() reportarProblema = new EventEmitter<number>();

  showRefundArea = false;
  refundReason = '';
  selectedMethod: 'card' | 'cash' = 'card';

  ngOnInit(): void {
    try {
      console.log('[PROXIMA_CITA_CARD] Init', {
        appointmentId: this.data?.appointmentId,
        titulo: this.data?.titulo,
        fecha: this.data?.fecha,
        hora: this.data?.hora,
        diasRestantes: this.data?.diasRestantes,
        mostrarPagar: this.data?.mostrarPagar,
        successHighlight: this.data?.successHighlight,
        verification_code: this.data?.verification_code
      });
    } catch {}
  }

  ngOnChanges(changes: SimpleChanges): void {
    try {
      const paid = !!this.data?.verification_code;
      console.log('[PROXIMA_CITA_CARD] Changes', {
        appointmentId: this.data?.appointmentId,
        hasVerificationCode: paid,
        mostrarPagar: this.data?.mostrarPagar,
        successHighlight: this.data?.successHighlight
      });
      const pref = (this.data?.paymentPreference || 'card') as 'card'|'cash';
      this.selectedMethod = pref;
    } catch {}
  }

  onPagarClick(): void {
    try {
      console.log('[PROXIMA_CITA_CARD] PAGAR click', {
        appointmentId: this.data?.appointmentId,
        titulo: this.data?.titulo,
        fecha: this.data?.fecha,
        hora: this.data?.hora,
        mostrarPagar: this.data?.mostrarPagar,
        successHighlight: this.data?.successHighlight,
        verification_code: this.data?.verification_code
      });
    } catch {}
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
  }

  onContactarClick(): void {
    try { console.log('[PROXIMA_CITA_CARD] CONTACTAR click', { appointmentId: this.data?.appointmentId }); } catch {}
    this.contactar.emit();
  }

  onReprogramarClick(): void {
    try {
      console.log('[PROXIMA_CITA_CARD] REPROGRAMAR click', {
        appointmentId: this.data?.appointmentId,
        allowReprogram: this.data?.allowReprogram
      });
    } catch {}
    if (this.data?.allowReprogram === false) {
      return;
    }
    this.reprogramar.emit(this.data?.appointmentId || 0);
  }

  onCancelarClick(): void {
    try { console.log('[PROXIMA_CITA_CARD] CANCELAR click', { appointmentId: this.data?.appointmentId }); } catch {}
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
    this.finalizarServicio.emit(this.data.appointmentId);
  }

  onReportarClick(): void {
    if (!this.data?.appointmentId) return;
    this.reportarProblema.emit(this.data.appointmentId);
  }
}







