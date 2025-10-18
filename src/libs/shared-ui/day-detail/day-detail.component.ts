import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalAgendarCitaComponent, NuevaCitaData } from '../calendar-mensual/modal-agendar-cita/modal-agendar-cita.component';

export interface DayAppointment {
  id: string;
  title: string;
  time: string;
  duration: number;
  clientName: string;
  clientPhone?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  type: 'appointment' | 'break' | 'blocked';
  notes?: string;
  paymentStatus?: 'unpaid' | 'paid';
}

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [CommonModule, ModalAgendarCitaComponent],
  templateUrl: './day-detail.component.html',
  styleUrls: ['./day-detail.component.scss']
})
export class DayDetailComponent {
  @Input() selectedDate: Date | null = null;
  @Input() appointments: DayAppointment[] = [];
  @Input() professionalName: string = 'Nombre (Título)';
  @Input() loading: boolean = false;

  @Output() appointmentClick = new EventEmitter<DayAppointment>();
  @Output() newAppointment = new EventEmitter<Date>();
  @Output() citaCreated = new EventEmitter<NuevaCitaData>();
  @Output() confirmAppointment = new EventEmitter<string>();

  isModalOpen: boolean = false;

  get hasAppointments(): boolean {
    return this.appointments.length > 0;
  }

  get selectedDateFormatted(): string {
    if (!this.selectedDate) return 'Cargando...';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return this.selectedDate.toLocaleDateString('es-ES', options);
  }

  get selectedDateSlug(): string {
    if (!this.selectedDate) return '----';
    
    const day = this.selectedDate.getDate();
    const month = this.selectedDate.getMonth() + 1;
    const year = this.selectedDate.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  get selectedDayNumber(): string {
    if (!this.selectedDate) return '--';
    return this.selectedDate.getDate().toString();
  }

  get sortedAppointments(): DayAppointment[] {
    return [...this.appointments].sort((a, b) => {
      const timeA = this.parseTime(a.time);
      const timeB = this.parseTime(b.time);
      return timeA - timeB;
    });
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  onAppointmentClick(appointment: DayAppointment) {
    this.appointmentClick.emit(appointment);
  }

  onConfirmClick(event: Event, appointment: DayAppointment) {
    event.stopPropagation();
    this.confirmAppointment.emit(appointment.id);
  }

  onNewAppointment() {
    this.isModalOpen = true;
    if (this.selectedDate) {
      this.newAppointment.emit(this.selectedDate);
    }
  }

  onCloseModal() {
    this.isModalOpen = false;
  }

  onCitaCreated(citaData: NuevaCitaData) {
    this.citaCreated.emit(citaData);
    console.log('Nueva cita creada desde day-detail:', citaData);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled':
        return '#f59e0b';
      case 'confirmed':
        return '#10b981';
      case 'completed':
        return '#6b7280';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'Programada';
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  }

  getPaymentStatusText(payment?: string): string {
    if (payment === 'paid') return 'Pagada';
    return 'Esperando pago';
  }

  getPaymentStatusColor(payment?: string): string {
    if (payment === 'paid') return '#10b981';
    return '#f59e0b';
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'break':
        return '☕';
      case 'blocked':
        return '🚫';
      default:
        return '📅';
    }
  }

  trackByAppointmentId(index: number, appointment: DayAppointment): string {
    return appointment.id;
  }
}
