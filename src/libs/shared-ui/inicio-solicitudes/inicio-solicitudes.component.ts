import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AcceptReservaModalComponent, 
  RejectReservaModalComponent,
  ReservaData,
  AcceptReservaResult,
  RejectReservaResult
} from './modals';

// Mantener compatibilidad con la interfaz anterior
export interface SolicitudData {
  id: string;
  clientName: string;
  clientAvatar: string;
  service: string;
  when: string;
  time: string;
  date?: string;
  location?: string;
  estimatedIncome?: number;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
}

@Component({
  selector: 'app-inicio-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    AcceptReservaModalComponent,
    RejectReservaModalComponent
  ],
  templateUrl: './inicio-solicitudes.component.html',
  styleUrls: ['./inicio-solicitudes.component.scss']
})
export class InicioSolicitudesComponent {
  @Input() data: SolicitudData[] = [];

  @Output() acceptClick = new EventEmitter<SolicitudData>();
  @Output() declineClick = new EventEmitter<SolicitudData>();
  @Output() reservaAccepted = new EventEmitter<AcceptReservaResult>();
  @Output() reservaRejected = new EventEmitter<RejectReservaResult>();

  // Estados de los modales
  showAcceptModal = false;
  showRejectModal = false;
  loading = false;
  selectedSolicitud: SolicitudData | null = null;

  @ViewChild('scroller') private scrollerRef?: ElementRef<HTMLDivElement>;

  onAcceptClick(solicitud: SolicitudData) {
    this.selectedSolicitud = solicitud;
    this.showAcceptModal = true;
    this.acceptClick.emit(solicitud);
  }

  onDeclineClick(solicitud: SolicitudData) {
    this.selectedSolicitud = solicitud;
    this.showRejectModal = true;
    this.declineClick.emit(solicitud);
  }

  onAcceptModalClose() {
    this.showAcceptModal = false;
    this.selectedSolicitud = null;
  }

  onRejectModalClose() {
    this.showRejectModal = false;
    this.selectedSolicitud = null;
  }

  onAcceptConfirm(result: AcceptReservaResult) {
    this.reservaAccepted.emit(result);
    this.showAcceptModal = false;
  }

  onRejectConfirm(result: RejectReservaResult) {
    this.loading = true;
    this.reservaRejected.emit(result);
    
    // Simular delay de API
    setTimeout(() => {
      this.loading = false;
      this.showRejectModal = false;
    }, 1000);
  }

  scrollLeft() {
    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    const amount = Math.max(300, el.clientWidth * 0.8);
    el.scrollBy({ left: -amount, behavior: 'smooth' });
  }

  scrollRight() {
    const el = this.scrollerRef?.nativeElement;
    if (!el) return;
    const amount = Math.max(300, el.clientWidth * 0.8);
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }
}
