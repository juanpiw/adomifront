import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProximaCitaData {
  titulo: string;
  subtitulo: string;
  fecha: string;
  hora: string;
  diasRestantes: number;
}

@Component({
  selector: 'ui-proxima-cita-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proxima-cita-card.component.html',
  styleUrls: ['./proxima-cita-card.component.scss']
})
export class ProximaCitaCardComponent {
  @Input() data!: ProximaCitaData;
  @Output() contactar = new EventEmitter<void>();
  @Output() reprogramar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}

