import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../icon/icon.component';

export interface TimeFilterOption {
  value: string;
  label: string;
  icon: IconName;
}

export interface TimeFilterChange {
  period: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'ui-time-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './time-filter.component.html',
  styleUrls: ['./time-filter.component.scss']
})
export class TimeFilterComponent implements OnInit {
  @Input() selectedPeriod: string = 'month';
  @Input() customStartDate?: Date;
  @Input() customEndDate?: Date;
  
  @Output() filterChanged = new EventEmitter<TimeFilterChange>();

  timeOptions: TimeFilterOption[] = [
    { value: 'day', label: 'Hoy', icon: 'calendar' },
    { value: 'week', label: 'Esta Semana', icon: 'chart' },
    { value: 'month', label: 'Este Mes', icon: 'trending-up' },
    { value: 'quarter', label: 'Este Trimestre', icon: 'target' },
    { value: 'year', label: 'Este Año', icon: 'briefcase' },
    { value: 'custom', label: 'Personalizado', icon: 'settings' }
  ];

  showCustomDatePicker = false;
  customStart: string = '';
  customEnd: string = '';

  ngOnInit() {
    this.initializeCustomDates();
    this.emitFilterChange();
  }

  onPeriodChange(period: string) {
    this.selectedPeriod = period;
    this.showCustomDatePicker = period === 'custom';
    
    if (period !== 'custom') {
      this.emitFilterChange();
    }
  }

  onCustomDateChange() {
    if (this.customStart && this.customEnd) {
      this.emitFilterChange();
    }
  }

  private initializeCustomDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.customStart = this.formatDateForInput(firstDayOfMonth);
    this.customEnd = this.formatDateForInput(lastDayOfMonth);
  }

  private emitFilterChange() {
    const { startDate, endDate } = this.calculateDateRange();
    
    this.filterChanged.emit({
      period: this.selectedPeriod,
      startDate,
      endDate
    });
  }

  private calculateDateRange(): { startDate: Date; endDate: Date } {
    const today = new Date();
    
    switch (this.selectedPeriod) {
      case 'day':
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
        };
      
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59);
        return { startDate: startOfWeek, endDate: endOfWeek };
      
      case 'month':
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1),
          endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
        };
      
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        return {
          startDate: new Date(today.getFullYear(), quarter * 3, 1),
          endDate: new Date(today.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59)
        };
      
      case 'year':
        return {
          startDate: new Date(today.getFullYear(), 0, 1),
          endDate: new Date(today.getFullYear(), 11, 31, 23, 59, 59)
        };
      
      case 'custom':
        return {
          startDate: new Date(this.customStart + 'T00:00:00'),
          endDate: new Date(this.customEnd + 'T23:59:59')
        };
      
      default:
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1),
          endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
        };
    }
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getSelectedOption(): TimeFilterOption {
    return this.timeOptions.find(option => option.value === this.selectedPeriod) || this.timeOptions[2];
  }
}
