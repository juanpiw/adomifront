import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ReservaPasadaData {
  avatarUrl: string;
  titulo: string;
  fecha: string;
  precio: string;
  estado?: string; // Completado, etc.
}

@Component({
  selector: 'ui-reserva-pasada-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reserva-pasada-card.component.html',
  styleUrls: ['./reserva-pasada-card.component.scss']
})
export class ReservaPasadaCardComponent {
  @Input() data!: ReservaPasadaData;
  @Output() onReview = new EventEmitter<void>();
  @Output() onReschedule = new EventEmitter<void>();
}
