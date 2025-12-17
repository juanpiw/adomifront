import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PendienteData {
  titulo: string;
  fecha: string;
  hora: string;
  appointmentId?: number | null;
}

@Component({
  selector: 'ui-pendiente-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pendiente-card.component.html',
  styleUrls: ['./pendiente-card.component.scss']
})
export class PendienteCardComponent {
  @Input() data!: PendienteData;
  expanded: boolean = false;

  toggle() { this.expanded = !this.expanded; }
}








