import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-seguimiento-citas-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento-citas-history-modal.component.html',
  styleUrls: ['./seguimiento-citas-history-modal.component.scss']
})
export class SeguimientoCitasHistoryModalComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
}
