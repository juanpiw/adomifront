import { Component, Input, Output, EventEmitter } from '@angular/core';
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
export class BookingPanelComponent {
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

  @Output() serviceSelected = new EventEmitter<string>();
  @Output() dateSelected = new EventEmitter<string>();
  @Output() timeSelected = new EventEmitter<string>();
  @Output() bookingConfirmed = new EventEmitter<BookingSummary>();
  @Output() messageClicked = new EventEmitter<void>();

  constructor(private router: Router) {}

  onServiceClick(serviceId: string) {
    this.serviceSelected.emit(serviceId);
  }

  onDateChange(date: string) {
    this.dateSelected.emit(date);
  }

  onTimeClick(time: string) {
    this.timeSelected.emit(time);
  }

  onConfirmBooking() {
    this.bookingConfirmed.emit(this.data.summary);
  }

  onSendMessage() {
    console.log('Enviar mensaje - providerId:', this.providerId, 'providerName:', this.providerName);
    this.router.navigate(['/client/conversaciones'], {
      queryParams: this.providerId ? { providerId: this.providerId, providerName: this.providerName } : undefined
    });
    this.messageClicked.emit();
  }
}
