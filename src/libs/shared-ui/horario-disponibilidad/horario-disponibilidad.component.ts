import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TimeBlock {
  id: string;
  start: string;
  end: string;
}

export interface DaySchedule {
  day: string;
  enabled: boolean;
  timeBlocks: TimeBlock[];
}

export interface WeeklySchedule {
  days: DaySchedule[];
}

@Component({
  selector: 'app-horario-disponibilidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horario-disponibilidad.component.html',
  styleUrls: ['./horario-disponibilidad.component.scss']
})
export class HorarioDisponibilidadComponent {
  @Input() schedule: WeeklySchedule = {
    days: [
      {
        day: 'Lunes',
        enabled: true,
        timeBlocks: [
          { id: '1', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Martes',
        enabled: false,
        timeBlocks: []
      },
      {
        day: 'Miércoles',
        enabled: true,
        timeBlocks: [
          { id: '2', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Jueves',
        enabled: true,
        timeBlocks: [
          { id: '3', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Viernes',
        enabled: true,
        timeBlocks: [
          { id: '4', start: '09:00', end: '18:00' }
        ]
      },
      {
        day: 'Sábado',
        enabled: true,
        timeBlocks: [
          { id: '5', start: '10:00', end: '16:00' }
        ]
      },
      {
        day: 'Domingo',
        enabled: false,
        timeBlocks: []
      }
    ]
  };

  @Output() scheduleChange = new EventEmitter<WeeklySchedule>();
  @Output() addTimeBlock = new EventEmitter<{ day: string; block: TimeBlock }>();
  @Output() removeTimeBlock = new EventEmitter<{ day: string; blockId: string }>();
  @Output() toggleDay = new EventEmitter<{ day: string; enabled: boolean }>();

  onToggleDay(day: DaySchedule) {
    const updatedSchedule = {
      ...this.schedule,
      days: this.schedule.days.map(d => 
        d.day === day.day ? { ...d, enabled: !d.enabled } : d
      )
    };
    this.schedule = updatedSchedule;
    this.scheduleChange.emit(updatedSchedule);
    this.toggleDay.emit({ day: day.day, enabled: !day.enabled });
  }

  onAddTimeBlock(day: DaySchedule) {
    const newBlock: TimeBlock = {
      id: Date.now().toString(),
      start: '09:00',
      end: '17:00'
    };
    
    const updatedSchedule = {
      ...this.schedule,
      days: this.schedule.days.map(d => 
        d.day === day.day 
          ? { ...d, timeBlocks: [...d.timeBlocks, newBlock] }
          : d
      )
    };
    
    this.schedule = updatedSchedule;
    this.scheduleChange.emit(updatedSchedule);
    this.addTimeBlock.emit({ day: day.day, block: newBlock });
  }

  onRemoveTimeBlock(day: DaySchedule, blockId: string) {
    const updatedSchedule = {
      ...this.schedule,
      days: this.schedule.days.map(d => 
        d.day === day.day 
          ? { ...d, timeBlocks: d.timeBlocks.filter(block => block.id !== blockId) }
          : d
      )
    };
    
    this.schedule = updatedSchedule;
    this.scheduleChange.emit(updatedSchedule);
    this.removeTimeBlock.emit({ day: day.day, blockId });
  }

  onTimeBlockChange(day: DaySchedule, blockId: string, field: 'start' | 'end', value: string) {
    const updatedSchedule = {
      ...this.schedule,
      days: this.schedule.days.map(d => 
        d.day === day.day 
          ? { 
              ...d, 
              timeBlocks: d.timeBlocks.map(block => 
                block.id === blockId ? { ...block, [field]: value } : block
              )
            }
          : d
      )
    };
    
    this.schedule = updatedSchedule;
    this.scheduleChange.emit(updatedSchedule);
  }
}








