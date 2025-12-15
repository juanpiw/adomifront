import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientProfileService } from '../../../app/services/client-profile.service';

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  isActive?: boolean;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isSelected?: boolean;
  reason?: 'booked' | 'blocked' | 'unavailable'; // 'booked' = cita existente, 'blocked' = bloqueado por proveedor
}

export interface BookingSummary {
  service: string;
  date: string;
  time: string;
  price: string;
}

export interface BookingPanelData {
  services: Service[];
  timeSlots: TimeSlot[];
  summary: BookingSummary;
  selectedServiceId?: string;
  selectedDate?: string;
  selectedTime?: string;
  allowManualTime?: boolean;
  timeSlotsMessage?: string | null;
}

export interface FutureSlotSuggestion {
  dateLabel: string;
  isoDate: string;
  time: string;
}

@Component({
  selector: 'app-booking-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-panel.component.html',
  styleUrls: ['./booking-panel.component.scss']
})
export class BookingPanelComponent implements OnChanges, OnInit {
  @Input() providerId?: string | number;
  @Input() providerName?: string;
  @Input() data: BookingPanelData = {
    services: [],
    timeSlots: [],
    summary: {
      service: '',
      date: '',
      time: '',
      price: ''
    },
    allowManualTime: false,
    timeSlotsMessage: null
  };

  // Estado de confirmación controlado por el padre (para mostrar loading/errores en el modal)
  @Input() confirming: boolean = false;
  @Input() confirmError: string | null = null;
  @Input() closeConfirmSignal: number = 0; // aumentar para cerrar modal desde el padre
  @Input() alternativeSlots: string[] = [];
  @Input() futureSlots: FutureSlotSuggestion[] = [];
  @Input() loadingSlots: boolean = false;
  @Input() successMessage: string | null = null;

  @Output() serviceSelected = new EventEmitter<string>();
  @Output() dateSelected = new EventEmitter<string>();
  @Output() timeSelected = new EventEmitter<string>();
  @Output() bookingConfirmed = new EventEmitter<BookingSummary>();
  @Output() futureSlotSelected = new EventEmitter<FutureSlotSuggestion>();

  // Modal de confirmación
  isConfirmOpen = false;
  isGeoInfoOpen = false;
  paymentPref: 'card' | 'cash' | null = null;
  loadingPaymentPref = false;

  // Errores de validación simples
  errorService = '';
  errorDate = '';
  errorTime = '';

  constructor(private clientProfile: ClientProfileService) {}

  private readonly fallbackStartMinutes = 8 * 60; // 08:00
  private readonly fallbackEndMinutes = 21 * 60;  // 21:00
  private readonly slotIntervalMinutes = 30;

  readonly today = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    // Precargar preferencia para mostrarla sin esperar a abrir el modal
    if (!this.paymentPref && !this.loadingPaymentPref) {
      this.loadingPaymentPref = true;
      this.clientProfile.getPaymentPreference().subscribe({
        next: (res) => {
          this.paymentPref = (res && (res as any).success) ? ((res as any).preference as any) : null;
          this.loadingPaymentPref = false;
        },
        error: () => { this.loadingPaymentPref = false; }
      });
    }
  }

  get displayedTimeSlots(): TimeSlot[] {
    const slots = Array.isArray(this.data?.timeSlots) ? this.data.timeSlots : [];
    if (slots.length) {
      return slots;
    }
    return this.generateFallbackSlots();
  }

  private generateFallbackSlots(): TimeSlot[] {
    const fallback: TimeSlot[] = [];
    for (let minutes = this.fallbackStartMinutes; minutes <= this.fallbackEndMinutes; minutes += this.slotIntervalMinutes) {
      fallback.push({
        time: this.minutesToLabel(minutes),
        isAvailable: false,
        isSelected: false,
        reason: 'unavailable'
      });
    }
    return fallback;
  }

  private minutesToLabel(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  onServiceClick(serviceId: string) {
    // Actualizar selección local para feedback inmediato
    this.data.services = this.data.services.map(s => ({ ...s, isActive: s.id === serviceId }));
    const active = this.data.services.find(s => s.id === serviceId);
    if (active) {
      this.data.summary.service = active.name;
      this.data.summary.price = active.price;
    }
    this.errorService = '';
    // Reset selección de hora al cambiar servicio
    this.data.timeSlots = (this.data.timeSlots || []).map(slot => ({ ...slot, isSelected: false }));
    this.data.summary.time = '';
    this.data.allowManualTime = false;
    this.data.timeSlotsMessage = null;
    this.serviceSelected.emit(serviceId);
  }

  onDateChange(date: string) {
    this.data.summary.date = date;
    this.errorDate = '';
    // Reset selección de hora al cambiar fecha
    this.data.timeSlots = (this.data.timeSlots || []).map(slot => ({ ...slot, isSelected: false }));
    this.data.summary.time = '';
    this.data.allowManualTime = false;
    this.data.timeSlotsMessage = null;
    this.dateSelected.emit(date);
  }

  onTimeClick(time: string) {
    this.data.summary.time = time;
    this.errorTime = '';
    // Marcar slot seleccionado
    this.data.timeSlots = (this.data.timeSlots || []).map(slot => ({
      ...slot,
      isSelected: slot.time === time
    }));
    this.timeSelected.emit(time);
  }

  onTimeChange(time: string) {
    if (!this.data.allowManualTime) {
      return;
    }
    // Para entrada manual cuando no hay slots
    this.data.summary.time = time;
    this.errorTime = '';
    // Limpiar selección de slots si es manual
    this.data.timeSlots = (this.data.timeSlots || []).map(slot => ({ ...slot, isSelected: false }));
    this.timeSelected.emit(time);
  }

  onConfirmBooking() {
    // Validaciones básicas
    const hasService = !!(this.data.services.find(s => s.isActive) || this.data.summary.service);
    const hasDate = !!this.data.summary.date;
    const hasTime = !!this.data.summary.time;

    this.errorService = hasService ? '' : 'Selecciona un servicio.';
    this.errorDate = hasDate ? '' : 'Selecciona una fecha.';
    this.errorTime = hasTime ? '' : 'Selecciona una hora.';

    if (!hasService || !hasDate || !hasTime) return;

    // Cargar preferencia de pago antes de abrir modal (si no está cargada)
    if (!this.paymentPref && !this.loadingPaymentPref) {
      this.loadingPaymentPref = true;
      this.clientProfile.getPaymentPreference().subscribe({
        next: (res) => {
          this.paymentPref = (res && res.success) ? (res.preference as any) : null;
          this.loadingPaymentPref = false;
        },
        error: () => { this.loadingPaymentPref = false; }
      });
    }
    // Abrir modal de confirmación
    this.isConfirmOpen = true;
  }

  // Confirmación
  closeConfirm() {
    this.isConfirmOpen = false;
  }

  toggleGeoInfo(): void {
    this.isGeoInfoOpen = !this.isGeoInfoOpen;
  }

  closeGeoInfo(): void {
    this.isGeoInfoOpen = false;
  }

  confirmBookingNow() {
    // No cerrar aún; el padre manejará confirming y cierre cuando termine
    // Backup: si aún no cargó la preferencia, intentar una vez más sin bloquear UX
    if (!this.paymentPref && !this.loadingPaymentPref) {
      this.loadingPaymentPref = true;
      this.clientProfile.getPaymentPreference().subscribe({
        next: (res) => { this.paymentPref = (res && res.success) ? (res.preference as any) : null; this.loadingPaymentPref = false; },
        error: () => { this.loadingPaymentPref = false; }
      });
    }
    this.bookingConfirmed.emit(this.data.summary);
  }

  paymentMethodText(): string {
    if (this.loadingPaymentPref) return 'cargando…';
    return this.paymentPref === 'cash' ? 'Efectivo' : 'Tarjeta';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['closeConfirmSignal'] && !changes['closeConfirmSignal'].firstChange) {
      // cerrar modal cuando el padre indique
      this.isConfirmOpen = false;
    }
    // Mostrar errores en el modal si llegan
    if (changes['confirmError'] && this.isConfirmOpen && this.confirmError) {
      // keep open to show error
    }
  }
  
  /**
   * Obtener tooltip para el slot según su estado
   */
  getSlotTooltip(slot: TimeSlot): string {
    if (slot.reason === 'blocked') {
      return '🔒 Bloqueado por el profesional';
    } else if (slot.reason === 'booked') {
      return '❌ Ya está ocupado';
    } else if (slot.reason === 'unavailable') {
      return '⛔ No disponible en esta fecha';
    } else if (slot.isAvailable) {
      return '✅ Disponible';
    }
    return 'No disponible';
  }

  onAlternativeSlotClick(slot: string) {
    this.onTimeClick(slot);
  }

  onFutureSlotSuggestionClick(suggestion: FutureSlotSuggestion) {
    this.futureSlotSelected.emit(suggestion);
  }
}
