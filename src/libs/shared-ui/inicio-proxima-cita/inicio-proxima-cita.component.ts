import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DetallesCitaModalComponent,
  CitaDetalleData,
  CitaDetalleResult,
  CancelCitaResult
} from './modals';

export interface ProximaCitaData {
  id: string;
  time: string;
  meridiem: string;
  service: string;
  clientName: string;
  date?: string;
  duration?: string;
  amount?: number;
  clientAvatar?: string;
  location?: string;
  mapUrl?: string;
  notes?: string;
}

@Component({
  selector: 'app-inicio-proxima-cita',
  standalone: true,
  imports: [CommonModule, DetallesCitaModalComponent],
  templateUrl: './inicio-proxima-cita.component.html',
  styleUrls: ['./inicio-proxima-cita.component.scss']
})
export class InicioProximaCitaComponent {
  @Input() data: ProximaCitaData = {
    id: '1',
    time: '10:00',
    meridiem: 'AM',
    service: 'Corte de Pelo',
    clientName: 'Carlos Rojas',
    date: '2025-10-10',
    duration: '45 minutos',
    amount: 15000,
    clientAvatar: 'https://placehold.co/40x40/E0E7FF/4338CA?text=CR',
    location: 'Av. Providencia 123, Depto 45, Santiago',
    mapUrl: 'https://maps.google.com/?q=Av.+Providencia+123,+Santiago'
  };

  @Output() viewDetailsClick = new EventEmitter<ProximaCitaData>();
  @Output() citaAction = new EventEmitter<CitaDetalleResult>();
  @Output() citaCancel = new EventEmitter<CancelCitaResult>();

  // Estados del modal
  showDetailsModal = false;
  loading = false;

  get isPast(): boolean {
    const dateStr = this.data.date || '';
    const timeStr = this.data.time || '';
    if (!dateStr) return false;

    // Construir Date a partir de fecha (ISO) y hora + meridiem
    const time24 = this.to24h(timeStr, this.data.meridiem);
    const dt = new Date(time24 ? `${dateStr}T${time24}` : dateStr);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
  }

  onViewDetailsClick() {
    this.showDetailsModal = true;
    this.viewDetailsClick.emit(this.data);
  }

  onModalClose() {
    this.showDetailsModal = false;
  }

  onCitaAction(result: CitaDetalleResult) {
    this.citaAction.emit(result);
    // Cerrar modal después de la acción
    this.showDetailsModal = false;
  }

  onCitaCancel(result: CancelCitaResult) {
    this.citaCancel.emit(result);
    // Cerrar modal después de cancelar
    this.showDetailsModal = false;
  }

  // Convertir ProximaCitaData a CitaDetalleData para el modal
  get citaDetalleData(): CitaDetalleData {
    return {
      id: this.data.id,
      service: this.data.service,
      date: this.data.date || new Date().toISOString(),
      time: `${this.data.time} ${this.data.meridiem}`,
      duration: this.data.duration || '45 minutos',
      paymentStatus: 'paid',
      amount: this.data.amount || 15000,
      client: {
        name: this.data.clientName,
        avatar: this.data.clientAvatar || 'https://placehold.co/40x40/E0E7FF/4338CA?text=CR'
      },
      location: {
        address: this.data.location || 'Ubicación no especificada',
        mapUrl: this.data.mapUrl
      },
      notes: this.data.notes
    };
  }

  private to24h(time: string, meridiem: string): string | null {
    if (!time) return null;
    const m = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    let hour = Number(m[1]);
    const minute = m[2];
    const mer = (meridiem || '').toUpperCase();
    if (mer === 'PM' && hour < 12) hour += 12;
    if (mer === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }
}
