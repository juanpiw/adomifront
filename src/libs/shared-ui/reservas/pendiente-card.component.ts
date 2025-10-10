import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PendienteData {
  titulo: string;
  fecha: string;
  hora: string;
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
}




