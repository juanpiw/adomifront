import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() data: SolicitudData = {
    id: '1',
    clientName: 'Marcos Reyes',
    clientAvatar: 'https://placehold.co/48x48/FDE68A/4B5563?text=MR',
    service: 'Maquillaje Profesional',
    when: 'Mañana',
    time: '18:00 PM',
    date: '2025-10-11',
    location: 'Av. Providencia 123, Depto 45, Santiago',
    estimatedIncome: 45000
  };

  @Output() acceptClick = new EventEmitter<SolicitudData>();
  @Output() declineClick = new EventEmitter<SolicitudData>();
  @Output() reservaAccepted = new EventEmitter<AcceptReservaResult>();
  @Output() reservaRejected = new EventEmitter<RejectReservaResult>();

  // Estados de los modales
  showAcceptModal = false;
  showRejectModal = false;
  loading = false;

  onAcceptClick() {
    this.showAcceptModal = true;
    this.acceptClick.emit(this.data);
  }

  onDeclineClick() {
    this.showRejectModal = true;
    this.declineClick.emit(this.data);
  }

  onAcceptModalClose() {
    this.showAcceptModal = false;
  }

  onRejectModalClose() {
    this.showRejectModal = false;
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
}
