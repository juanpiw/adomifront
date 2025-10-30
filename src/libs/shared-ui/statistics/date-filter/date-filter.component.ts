import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
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
export class DateFilterComponent implements OnInit {
  @Input() range: DateRange = { startDate: '', endDate: '' };
  @Output() rangeChange = new EventEmitter<DateRange>();

  selectedPeriod = '6-months';
  periodLabel = 'Últimos 6 Meses';

  ngOnInit() {
    if (!this.range.startDate) {
      this.onPeriodChange(this.selectedPeriod);
    } else {
      this.periodLabel = this.computeLabel(this.range.startDate, this.range.endDate || this.range.startDate);
    }
  }

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
    this.periodLabel = this.computeLabel(this.range.startDate, this.range.endDate);
  }

  onApplyFilter() {
    this.rangeChange.emit(this.range);
  }

  private computeLabel(from: string, to: string): string {
    try {
      const start = new Date(from);
      const end = new Date(to);
      const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
      if (months <= 3) return 'Últimos 3 Meses';
      if (months <= 6) return 'Últimos 6 Meses';
      if (months >= 11 && months <= 13) return 'Año Actual';
      const formatter = new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric' });
      return `${formatter.format(start)} – ${formatter.format(end)}`;
    } catch {
      return 'Rango personalizado';
    }
  }
}


