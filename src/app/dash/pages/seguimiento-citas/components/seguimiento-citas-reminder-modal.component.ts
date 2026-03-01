import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-seguimiento-citas-reminder-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento-citas-reminder-modal.component.html',
  styleUrls: ['./seguimiento-citas-reminder-modal.component.scss']
})
export class SeguimientoCitasReminderModalComponent {
  @Input() visible = false;
  @Input() target = '';
  @Input() channel: 'WhatsApp' | 'Correo' = 'WhatsApp';

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
