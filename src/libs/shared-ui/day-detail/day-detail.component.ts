import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalAgendarCitaComponent, NuevaCitaData, BloqueoData, ProviderServiceOption } from '../calendar-mensual/modal-agendar-cita/modal-agendar-cita.component';
import { ProviderLocationCheckinButtonComponent } from '../provider-location-checkin-button/provider-location-checkin-button.component';

export interface DayAppointment {
  id: string;
  title: string;
  time: string;
  date?: string;
  start_time?: string;
  end_time?: string;
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

type QuoteFocusHintInput = {
  appointmentId?: string | number | null;
  time?: string | null;
  clientName?: string | null;
  serviceName?: string | null;
  message?: string | null;
};

type QuoteDraftInput = {
  serviceName?: string | null;
  clientName?: string | null;
  date?: string | null;
  time?: string | null;
  message?: string | null;
  serviceId?: number | null;
  quoteId?: number | null;
  clientId?: number | null;
};

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [CommonModule, ModalAgendarCitaComponent, ProviderLocationCheckinButtonComponent],
  templateUrl: './day-detail.component.html',
  styleUrls: ['./day-detail.component.scss']
})
export class DayDetailComponent implements OnChanges {
  @Input() selectedDate: Date | null = null;
  @Input() appointments: DayAppointment[] = [];
  @Input() professionalName: string = 'Nombre (Título)';
  @Input() loading: boolean = false;
  @Input() quoteFocusHint: QuoteFocusHintInput | null = null;
  @Input() quoteDraft: QuoteDraftInput | null = null;
  /**
   * Enfoque desde notificación / deep-link (sin banner).
   * Permite resaltar y scrollear a la cita en la lista del día.
   */
  @Input() focusAppointmentId: string | number | null = null;
  @Input() focusTime: string | null = null;
  @Input() services: ProviderServiceOption[] = [];
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
  @Output() quoteFocusHandled = new EventEmitter<void>();
  @Output() quoteDraftHandled = new EventEmitter<void>();

  isModalOpen: boolean = false;
  quoteFocusBanner: QuoteFocusHintInput | null = null;
  private highlightedAppointmentId: string | null = null;
  private highlightedTime: string | null = null;
  modalMode: 'cita' | 'bloqueo' = 'bloqueo';
  modalPresetData: Partial<NuevaCitaData> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quoteFocusHint']) {
      this.applyQuoteFocusHint(changes['quoteFocusHint'].currentValue as QuoteFocusHintInput | null);
    }
    if (changes['quoteDraft'] && changes['quoteDraft'].currentValue) {
      this.openQuoteDraft(changes['quoteDraft'].currentValue as QuoteDraftInput);
    }
    if (changes['focusAppointmentId'] || changes['focusTime']) {
      this.applyFocusHint(this.focusAppointmentId, this.focusTime);
    }
    if (changes['appointments']) {
      // Si ya tenemos un foco activo, intentar scrollear cuando llega la lista.
      this.scrollToHighlighted();
    }
  }

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

  private applyQuoteFocusHint(hint: QuoteFocusHintInput | null): void {
    if (!hint) {
      this.quoteFocusBanner = null;
      this.highlightedAppointmentId = null;
      this.highlightedTime = null;
      return;
    }
    this.quoteFocusBanner = hint;
    this.highlightedAppointmentId = hint.appointmentId !== undefined && hint.appointmentId !== null
      ? String(hint.appointmentId)
      : null;
    this.highlightedTime = hint.time || null;
    this.quoteFocusHandled.emit();
  }

  private applyFocusHint(appointmentId: string | number | null, time: string | null): void {
    // No mostrar banner; solo resaltar.
    if (appointmentId !== undefined && appointmentId !== null && String(appointmentId).trim().length) {
      this.highlightedAppointmentId = String(appointmentId);
      this.highlightedTime = null;
      this.scrollToHighlighted();
      return;
    }
    if (time && time.trim().length) {
      this.highlightedTime = time.trim();
      this.highlightedAppointmentId = null;
      this.scrollToHighlighted();
      return;
    }
  }

  private scrollToHighlighted(): void {
    // Esperar al render del *ngFor.
    setTimeout(() => {
      if (this.highlightedAppointmentId) {
        const el = document.getElementById(`day-appt-${this.highlightedAppointmentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (this.highlightedTime) {
        const target = document.querySelector('.day-detail__appointment--highlight') as HTMLElement | null;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 50);
  }

  dismissQuoteFocus(): void {
    this.quoteFocusBanner = null;
    this.highlightedAppointmentId = null;
    this.highlightedTime = null;
  }

  isHighlighted(appointment: DayAppointment): boolean {
    if (this.highlightedAppointmentId) {
      return String(appointment.id) === this.highlightedAppointmentId;
    }
    if (this.highlightedTime) {
      return appointment.time?.startsWith(this.highlightedTime);
    }
    return false;
  }

  private openQuoteDraft(draft: QuoteDraftInput): void {
    this.modalMode = 'cita';
    const dateInput = draft.date || (this.selectedDate ? this.formatDateForInput(this.selectedDate) : '');
    const startTime = draft.time || '';
    const matchedServiceId = draft.serviceId ?? this.matchServiceIdByName(draft.serviceName);
    this.modalPresetData = {
      title: draft.serviceName || 'Nueva cita',
      client: draft.clientName || '',
      date: dateInput,
      startTime,
      endTime: startTime ? this.addMinutesToTime(startTime, 60) : '',
      notes: draft.message || '',
      serviceId: matchedServiceId ?? undefined
    };
    this.isModalOpen = true;
    this.quoteDraftHandled.emit();
  }

  private addMinutesToTime(time: string, minutesToAdd: number): string {
    const [hours, minutes] = time.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return '';
    const date = new Date();
    date.setHours(hours, minutes + minutesToAdd, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private matchServiceIdByName(name?: string | null): number | null {
    if (!this.services?.length) {
      return null;
    }
    if (!name) {
      return this.services[0]?.id ?? null;
    }
    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return this.services[0]?.id ?? null;
    }
    const exact = this.services.find((svc) => svc.name?.trim().toLowerCase() === normalized);
    if (exact) {
      return exact.id;
    }
    const partial = this.services.find((svc) => normalized.includes((svc.name || '').trim().toLowerCase()));
    return partial ? partial.id : this.services[0]?.id ?? null;
  }

  onNewAppointment() {
    this.isModalOpen = true;
    this.modalMode = 'bloqueo';
    this.modalPresetData = null;
    if (this.selectedDate) {
      this.newAppointment.emit(this.selectedDate);
    }
  }

  onCloseModal() {
    this.isModalOpen = false;
    this.modalPresetData = null;
    this.modalMode = 'bloqueo';
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
