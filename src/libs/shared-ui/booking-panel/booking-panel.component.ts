import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
}

@Component({
  selector: 'app-booking-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-panel.component.html',
  styleUrls: ['./booking-panel.component.scss']
})
export class BookingPanelComponent implements OnChanges {
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
    }
  };

  // Estado de confirmación controlado por el padre (para mostrar loading/errores en el modal)
  @Input() confirming: boolean = false;
  @Input() confirmError: string | null = null;
  @Input() closeConfirmSignal: number = 0; // aumentar para cerrar modal desde el padre

  @Output() serviceSelected = new EventEmitter<string>();
  @Output() dateSelected = new EventEmitter<string>();
  @Output() timeSelected = new EventEmitter<string>();
  @Output() bookingConfirmed = new EventEmitter<BookingSummary>();
  @Output() messageClicked = new EventEmitter<void>();

  // Modal de confirmación
  isConfirmOpen = false;

  // Errores de validación simples
  errorService = '';
  errorDate = '';
  errorTime = '';

  constructor(private router: Router) {}

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
    this.serviceSelected.emit(serviceId);
  }

  onDateChange(date: string) {
    this.data.summary.date = date;
    this.errorDate = '';
    // Reset selección de hora al cambiar fecha
    this.data.timeSlots = (this.data.timeSlots || []).map(slot => ({ ...slot, isSelected: false }));
    this.data.summary.time = '';
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

    // Abrir modal de confirmación
    this.isConfirmOpen = true;
  }

  onSendMessage() {
    console.log('Enviar mensaje - providerId:', this.providerId, 'providerName:', this.providerName);
    this.router.navigate(['/client/conversaciones'], {
      queryParams: this.providerId ? { providerId: this.providerId, providerName: this.providerName } : undefined
    });
    this.messageClicked.emit();
  }

  // Confirmación
  closeConfirm() {
    this.isConfirmOpen = false;
  }

  confirmBookingNow() {
    // No cerrar aún; el padre manejará confirming y cierre cuando termine
    this.bookingConfirmed.emit(this.data.summary);
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
}
