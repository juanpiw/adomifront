import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-seguimiento-citas-no-show-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento-citas-no-show-modal.component.html',
  styleUrls: ['./seguimiento-citas-no-show-modal.component.scss']
})
export class SeguimientoCitasNoShowModalComponent {
  @Input() visible = false;
  @Input() providerName = '';

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
