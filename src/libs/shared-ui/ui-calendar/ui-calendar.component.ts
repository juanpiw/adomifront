import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'ui-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './ui-calendar.component.html',
  styleUrls: ['./ui-calendar.component.scss']
})
export class UiCalendarComponent {
  today = new Date();
  getMonthMatrix(date = this.today) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const days = [] as Date[];
    for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
    return { year: y, month: m, days };
  }
}
