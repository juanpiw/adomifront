import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SeguimientoParty {
  name: string;
  roleLabel: string;
  avatarEmoji?: string;
  photoUrl?: string;
  whatsappCount: number;
  emailCount: number;
}

export interface SeguimientoAppointment {
  client: SeguimientoParty;
  provider: SeguimientoParty;
  service: string;
  schedule: string;
  closureMessage: string;
}

@Component({
  selector: 'app-seguimiento-citas-appointment-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento-citas-appointment-card.component.html',
  styleUrls: ['./seguimiento-citas-appointment-card.component.scss']
})
export class SeguimientoCitasAppointmentCardComponent {
  @Input({ required: true }) appointment!: SeguimientoAppointment;

  @Output() reminder = new EventEmitter<{ target: string; channel: 'WhatsApp' | 'Correo' }>();
  @Output() noShow = new EventEmitter<string>();
  @Output() resendAlerts = new EventEmitter<void>();
  @Output() openLog = new EventEmitter<void>();
  @Output() validatePayment = new EventEmitter<void>();
}
