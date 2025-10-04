import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface TimeBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

@Component({
  selector: 'app-horarios-config',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent],
  templateUrl: './horarios-config.component.html',
  styleUrls: ['./horarios-config.component.scss']
})
export class HorariosConfigComponent {
  @Input() timeBlocks: TimeBlock[] = [];
  @Input() loading: boolean = false;

  @Output() addTimeBlock = new EventEmitter<Omit<TimeBlock, 'id'>>();
  @Output() removeTimeBlock = new EventEmitter<string>();
  @Output() updateTimeBlock = new EventEmitter<TimeBlock>();

  // Formulario para nuevo bloque
  newTimeBlock = {
    day: 'Lunes',
    startTime: '09:00',
    endTime: '17:00'
  };

  days = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 
    'Viernes', 'Sábado', 'Domingo'
  ];

  get groupedTimeBlocks(): { [key: string]: TimeBlock[] } {
    const grouped: { [key: string]: TimeBlock[] } = {};
    
    this.days.forEach(day => {
      grouped[day] = this.timeBlocks
        .filter(block => block.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return grouped;
  }

  onAddTimeBlock() {
    if (this.newTimeBlock.day && this.newTimeBlock.startTime && this.newTimeBlock.endTime) {
      // Validar que la hora de inicio sea menor que la de fin
      if (this.newTimeBlock.startTime >= this.newTimeBlock.endTime) {
        alert('La hora de inicio debe ser menor que la hora de fin');
        return;
      }

      // Verificar que no haya solapamiento
      const existingBlocks = this.timeBlocks.filter(block => block.day === this.newTimeBlock.day);
      const hasOverlap = existingBlocks.some(block => 
        (this.newTimeBlock.startTime < block.endTime && this.newTimeBlock.endTime > block.startTime)
      );

      if (hasOverlap) {
        alert('Este horario se solapa con un bloque existente');
        return;
      }

      this.addTimeBlock.emit({
        day: this.newTimeBlock.day,
        startTime: this.newTimeBlock.startTime,
        endTime: this.newTimeBlock.endTime,
        enabled: true
      });

      // Resetear formulario
      this.newTimeBlock = {
        day: 'Lunes',
        startTime: '09:00',
        endTime: '17:00'
      };
    }
  }

  onRemoveTimeBlock(blockId: string) {
    this.removeTimeBlock.emit(blockId);
  }

  onToggleTimeBlock(block: TimeBlock) {
    const updatedBlock = { ...block, enabled: !block.enabled };
    this.updateTimeBlock.emit(updatedBlock);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  getTimeBlockColor(block: TimeBlock): string {
    return block.enabled ? '#10b981' : '#6b7280';
  }

  getTimeBlockStatus(block: TimeBlock): string {
    return block.enabled ? 'Activo' : 'Inactivo';
  }

  trackByTimeBlockId(index: number, block: TimeBlock): string {
    return block.id;
  }

  trackByDay(index: number, day: string): string {
    return day;
  }
}
