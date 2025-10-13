import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CanceladaProfesionalData {
  avatarUrl: string;
  titulo: string;
  fecha: string;
  pillText?: string; // Reembolso completado
}

@Component({
  selector: 'ui-cancelada-profesional-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancelada-profesional-card.component.html',
  styleUrls: ['./cancelada-profesional-card.component.scss']
})
export class CanceladaProfesionalCardComponent {
  @Input() data!: CanceladaProfesionalData;
  @Output() findSimilar = new EventEmitter<void>();
}





