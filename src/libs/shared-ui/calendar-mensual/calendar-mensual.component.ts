import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'appointment' | 'break' | 'blocked';
  color?: string;
}

@Component({
  selector: 'app-calendar-mensual',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './calendar-mensual.component.html',
  styleUrls: ['./calendar-mensual.component.scss']
})
export class CalendarMensualComponent implements OnInit {
  @Input() events: CalendarEvent[] = [];
  @Input() currentDate: Date = new Date();
  @Input() loading: boolean = false;

  @Output() dateSelected = new EventEmitter<Date>();
  @Output() newAppointment = new EventEmitter<void>();
  @Output() previousMonth = new EventEmitter<void>();
  @Output() nextMonth = new EventEmitter<void>();

  currentMonth: Date = new Date();
  calendarDays: Date[] = [];
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  ngOnInit() {
    this.currentMonth = new Date(this.currentDate);
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Día de la semana del primer día (0 = domingo)
    const firstDayWeek = firstDay.getDay();
    
    // Generar días del mes anterior para completar la primera semana
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    this.calendarDays = [];
    
    // Días del mes anterior
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      this.calendarDays.push(new Date(year, month - 1, daysInPrevMonth - i));
    }
    
    // Días del mes actual
    const daysInMonth = lastDay.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      this.calendarDays.push(new Date(year, month, day));
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - this.calendarDays.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      this.calendarDays.push(new Date(year, month + 1, day));
    }
  }

  getMonthYearDisplay(): string {
    return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth() && 
           date.getFullYear() === this.currentMonth.getFullYear();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    return this.events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  }

  onDateClick(date: Date) {
    if (this.isCurrentMonth(date)) {
      this.dateSelected.emit(date);
    }
  }

  onPreviousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
    this.previousMonth.emit();
  }

  onNextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
    this.nextMonth.emit();
  }

  onNewAppointment() {
    this.newAppointment.emit();
  }

  getEventColor(event: CalendarEvent): string {
    switch (event.type) {
      case 'appointment':
        return '#4338ca';
      case 'break':
        return '#f59e0b';
      case 'blocked':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  trackByDate(index: number, date: Date): number {
    return date.getTime();
  }

  trackByEventId(index: number, event: CalendarEvent): string {
    return event.id;
  }
}
