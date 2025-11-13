import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalAgendarCitaComponent, NuevaCitaData, BloqueoData } from '../calendar-mensual/modal-agendar-cita/modal-agendar-cita.component';

export interface DayAppointment {
  id: string;
  title: string;
  time: string;
  duration: number;
  clientId: string;
  clientName: string;
  clientAvatarUrl?: string | null;
  clientPhone?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
  type: 'appointment' | 'break' | 'blocked';
  notes?: string;
  paymentStatus?: 'unpaid' | 'paid';
  paymentMethod?: 'card' | 'cash' | null;
  closureState?: 'none' | 'pending_close' | 'resolved' | 'in_review';
  closureDueAt?: string | null;
  closureProviderAction?: 'none' | 'code_entered' | 'no_show' | 'issue';
  closureClientAction?: 'none' | 'ok' | 'no_show' | 'issue';
  cancelledBy?: 'client' | 'provider' | 'system' | null;
  cancellationReason?: string | null;
  locationLabel?: string;
  clientAddress?: string | null;
  clientCommune?: string | null;
  clientRegion?: string | null;
  clientReviewId?: number | null;
  canReviewClient?: boolean;
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
  readonly fallbackAvatar = 'assets/default-avatar.png';

  @Output() appointmentClick = new EventEmitter<DayAppointment>();
  @Output() newAppointment = new EventEmitter<Date>();
  @Output() citaCreated = new EventEmitter<NuevaCitaData>();
  @Output() espacioBloqueado = new EventEmitter<BloqueoData>();
  @Output() confirmAppointment = new EventEmitter<string>();
  @Output() deleteAppointment = new EventEmitter<string>();
  @Output() cobrarEnEfectivo = new EventEmitter<string>();
  @Output() closureAction = new EventEmitter<{ id: string; action: 'no_show'|'issue' }>();
  @Output() verifyClosure = new EventEmitter<string>();
  @Output() updateLocation = new EventEmitter<DayAppointment>();
  @Output() viewClientProfile = new EventEmitter<DayAppointment>();
  @Output() reviewClient = new EventEmitter<DayAppointment>();

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

  onDeleteClick(event: Event, appointment: DayAppointment) {
    event.stopPropagation();
    this.deleteAppointment.emit(appointment.id);
  }

  onClosureAction(event: Event, appointment: DayAppointment, action: 'no_show'|'issue') {
    event.stopPropagation();
    this.closureAction.emit({ id: appointment.id, action });
  }

  onVerifyClosure(event: Event, appointment: DayAppointment) {
    event.stopPropagation();
    this.verifyClosure.emit(appointment.id);
  }

  onEditLocation(event: Event, appointment: DayAppointment) {
    event.stopPropagation();
    this.updateLocation.emit(appointment);
  }

  onClientClick(event: Event, appointment: DayAppointment) {
    event.stopPropagation();
    this.viewClientProfile.emit(appointment);
  }

  onClientAvatarError(event: Event, appointment: DayAppointment) {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    const currentSrc = img.getAttribute('src');
    if (currentSrc === this.fallbackAvatar) return;

    console.warn('[DayDetail] Avatar de cliente no disponible, usando fallback.', {
      appointmentId: appointment.id,
      previousSrc: currentSrc
    });

    img.src = this.fallbackAvatar;
    const container = img.closest('.day-detail__client-avatar');
    if (container) {
      container.classList.add('day-detail__client-avatar--fallback');
      const initials = container.querySelector('.day-detail__client-initials') as HTMLElement | null;
      if (initials) {
        initials.style.display = 'inline';
      }
    } else {
      img.classList.add('day-detail__client-avatar--fallback');
    }
  }

  onClientReviewClick(event: Event, appointment: DayAppointment) {
    event.stopPropagation();
    this.reviewClient.emit(appointment);
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
  
  onEspacioBloqueado(bloqueoData: BloqueoData) {
    this.espacioBloqueado.emit(bloqueoData);
    console.log('🔒 Espacio bloqueado desde day-detail:', bloqueoData);
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
      case 'expired':
        return '#9ca3af';
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
      case 'expired':
        return 'Expirada';
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

  getClosureProviderActionLabel(action?: string | null): string {
    switch (action) {
      case 'code_entered':
        return 'Código ingresado';
      case 'no_show':
        return 'Cliente no asistió';
      case 'issue':
        return 'Problema reportado';
      default:
        return 'Sin acción';
    }
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

  getClientInitials(name?: string | null): string {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'C';
    if (parts.length === 1) return (parts[0][0] || 'C').toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    const initials = `${first}${last}`.trim();
    return initials ? initials.toUpperCase() : 'C';
  }
}
