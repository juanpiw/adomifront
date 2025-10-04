import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TimeBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending';
}

export interface GestionDisponibilidadData {
  timeBlocks: TimeBlock[];
}

@Component({
  selector: 'app-inicio-gestion-disponibilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inicio-gestion-disponibilidad.component.html',
  styleUrls: ['./inicio-gestion-disponibilidad.component.scss']
})
export class InicioGestionDisponibilidadComponent {
  @Input() data: GestionDisponibilidadData = {
    timeBlocks: [
      { id: '1', day: 'Lunes y Jueves', startTime: '15:00', endTime: '16:30', status: 'confirmed' },
      { id: '2', day: 'Miércoles', startTime: '09:00', endTime: '11:00', status: 'confirmed' }
    ]
  };

  @Output() addTimeBlock = new EventEmitter<{ day: string; startTime: string; endTime: string }>();
  @Output() removeTimeBlock = new EventEmitter<string>();

  newTimeBlock = {
    day: '',
    startTime: '',
    endTime: ''
  };

  feedback = '';

  days = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  onAddTimeBlock() {
    if (!this.newTimeBlock.day || !this.newTimeBlock.startTime || !this.newTimeBlock.endTime) {
      this.feedback = 'Por favor completa todos los campos';
      return;
    }

    this.addTimeBlock.emit({
      day: this.newTimeBlock.day,
      startTime: this.newTimeBlock.startTime,
      endTime: this.newTimeBlock.endTime
    });

    this.feedback = 'Bloque agregado exitosamente';
    this.newTimeBlock = { day: '', startTime: '', endTime: '' };

    // Limpiar feedback después de 3 segundos
    setTimeout(() => {
      this.feedback = '';
    }, 3000);
  }

  onRemoveTimeBlock(blockId: string) {
    this.removeTimeBlock.emit(blockId);
  }

  getStatusClass(status: string): string {
    return status === 'confirmed' ? 'inicio-gestion__item--green' : 'inicio-gestion__item--yellow';
  }
}
