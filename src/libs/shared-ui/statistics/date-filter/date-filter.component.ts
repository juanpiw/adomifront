import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DateRange {
  startDate: string; // yyyy-mm-dd
  endDate?: string;  // yyyy-mm-dd
}

@Component({
  selector: 'ui-date-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent {
  @Input() range: DateRange = { startDate: '', endDate: '' };
  @Output() rangeChange = new EventEmitter<DateRange>();

  selectedPeriod = '6-months';

  onPeriodChange(value: string) {
    this.selectedPeriod = value;
    // Calcular fechas basado en el período seleccionado
    const now = new Date();
    let startDate = new Date();
    
    switch (value) {
      case '3-months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6-months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    this.range = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  }

  onApplyFilter() {
    this.rangeChange.emit(this.range);
  }
}


