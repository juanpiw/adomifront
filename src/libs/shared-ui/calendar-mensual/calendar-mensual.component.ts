import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { ModalAgendarCitaComponent, NuevaCitaData } from './modal-agendar-cita/modal-agendar-cita.component';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'appointment' | 'break' | 'blocked';
  color?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid' | 'succeeded' | 'pending' | 'completed';
}

@Component({
  selector: 'app-calendar-mensual',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, ModalAgendarCitaComponent],
  templateUrl: './calendar-mensual.component.html',
  styleUrls: ['./calendar-mensual.component.scss']
})
export class CalendarMensualComponent implements OnInit {
  @Input() events: CalendarEvent[] = [];
  @Input() currentDate: Date = new Date();
  @Input() loading: boolean = false;

  @Output() dateSelected = new EventEmitter<Date>();
  @Output() newAppointment = new EventEmitter<void>();
  @Output() citaCreated = new EventEmitter<NuevaCitaData>();
  @Output() previousMonth = new EventEmitter<void>();
  @Output() nextMonth = new EventEmitter<void>();

  isModalOpen: boolean = false;
  selectedDateForModal?: Date;
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
    const events = this.events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
    
    // Debug logging
    if (events.length > 0) {
      console.log(`[CALENDAR] Found ${events.length} events for ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}:`, events);
    }
    
    return events;
  }

  /**
   * Verifica si un día tiene citas programadas
   */
  hasAppointments(date: Date): boolean {
    return this.getEventsForDate(date).length > 0;
  }

  /**
   * Obtiene el color del indicador para un día con citas
   * El color se basa en el estado predominante de las citas del día
   */
  getDayIndicatorColor(date: Date): string {
    const events = this.getEventsForDate(date);
    
    if (events.length === 0) {
      return '#6b7280'; // Gris por defecto
    }

    // Contar eventos por estado
    let confirmedCount = 0;
    let scheduledCount = 0;
    let cancelledCount = 0;
    let paidCount = 0;

    events.forEach(event => {
      if (event.status === 'cancelled') {
        cancelledCount++;
      } else if (event.status === 'confirmed') {
        const isPaid = event.paymentStatus && ['paid', 'succeeded', 'completed'].includes(event.paymentStatus);
        if (isPaid) {
          paidCount++;
        } else {
          confirmedCount++;
        }
      } else if (event.status === 'scheduled') {
        scheduledCount++;
      }
    });

    // Prioridad: Canceladas > Pagadas > Confirmadas > Programadas
    if (cancelledCount > 0) {
      return '#ef4444'; // Rojo si hay alguna cancelada
    } else if (paidCount > 0 && paidCount === events.length) {
      return '#3b82f6'; // Azul si todas están pagadas
    } else if (confirmedCount > 0) {
      return '#f59e0b'; // Amarillo si hay confirmadas pendientes de pago
    } else if (scheduledCount > 0) {
      return '#10b981'; // Verde si solo hay programadas
    }

    return '#4338ca'; // Azul por defecto
  }

  /**
   * Obtiene el texto del tooltip para el indicador del día
   */
  getDayIndicatorTooltip(date: Date): string {
    const events = this.getEventsForDate(date);
    const count = events.length;
    
    if (count === 0) {
      return 'Sin citas';
    } else if (count === 1) {
      return '1 cita programada';
    } else {
      return `${count} citas programadas`;
    }
  }

  onDateClick(date: Date) {
    if (this.isCurrentMonth(date)) {
      this.dateSelected.emit(date);
      // Abrir modal con la fecha seleccionada
      this.selectedDateForModal = date;
      this.isModalOpen = true;
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
    this.selectedDateForModal = new Date(); // Fecha actual por defecto
    this.isModalOpen = true;
    this.newAppointment.emit();
  }

  onCloseModal() {
    this.isModalOpen = false;
    this.selectedDateForModal = undefined;
  }

  onCitaCreated(citaData: NuevaCitaData) {
    this.citaCreated.emit(citaData);
    console.log('Nueva cita creada:', citaData);
  }

  getEventColor(event: CalendarEvent): string {
    switch (event.type) {
      case 'appointment':
        // Colores basados en estado y payment status
        if (event.status === 'cancelled') {
          console.log(`[CALENDAR] Event ${event.id}: CANCELLED -> RED`);
          return '#ef4444'; // Rojo para canceladas
        }
        
        if (event.status === 'confirmed') {
          // Verificar si está pagada
          const isPaid = event.paymentStatus && ['paid', 'succeeded', 'completed'].includes(event.paymentStatus);
          if (isPaid) {
            console.log(`[CALENDAR] Event ${event.id}: CONFIRMED + PAID -> BLUE`);
            return '#3b82f6'; // Azul para confirmadas y pagadas
          } else {
            console.log(`[CALENDAR] Event ${event.id}: CONFIRMED + UNPAID -> YELLOW`);
            return '#f59e0b'; // Amarillo para confirmadas pero sin pago
          }
        }
        
        if (event.status === 'scheduled') {
          console.log(`[CALENDAR] Event ${event.id}: SCHEDULED -> GREEN`);
          return '#10b981'; // Verde para programadas (esperando confirmación)
        }
        
        if (event.status === 'completed') {
          console.log(`[CALENDAR] Event ${event.id}: COMPLETED -> BLUE`);
          return '#3b82f6'; // Azul para completadas
        }
        
        // Fallback para appointments sin estado específico
        console.log(`[CALENDAR] Event ${event.id}: UNKNOWN STATUS -> DEFAULT BLUE`);
        return '#4338ca'; // Azul por defecto
        
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
