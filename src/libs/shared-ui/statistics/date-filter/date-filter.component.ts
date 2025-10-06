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

  onStartChange(value: string) {
    this.range = { ...this.range, startDate: value };
    this.rangeChange.emit(this.range);
  }

  onEndChange(value: string) {
    this.range = { ...this.range, endDate: value };
    this.rangeChange.emit(this.range);
  }
}


