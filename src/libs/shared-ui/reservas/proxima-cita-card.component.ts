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
  appointmentId?: number;
  successHighlight?: boolean;
  verification_code?: string;
  canRefund?: boolean;
  refundRequested?: boolean;
  paymentPreference?: 'card'|'cash'|null;
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
  @Output() reprogramar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() pagar = new EventEmitter<number>();
  @Output() pedirDevolucion = new EventEmitter<{ appointmentId: number; reason: string }>();

  showRefundArea = false;
  refundReason = '';

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

  onContactarClick(): void {
    try { console.log('[PROXIMA_CITA_CARD] CONTACTAR click', { appointmentId: this.data?.appointmentId }); } catch {}
    this.contactar.emit();
  }

  onReprogramarClick(): void {
    try { console.log('[PROXIMA_CITA_CARD] REPROGRAMAR click', { appointmentId: this.data?.appointmentId }); } catch {}
    this.reprogramar.emit();
  }

  onCancelarClick(): void {
    try { console.log('[PROXIMA_CITA_CARD] CANCELAR click', { appointmentId: this.data?.appointmentId }); } catch {}
    this.cancelar.emit();
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
}







