import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface KpiSummary {
  currency: string;
  totalIncome: number;
  completedAppointments: number;
  averageRating: number;
  reviewsCount: number;
  totalClients: number;
  recurringClients: number;
  recurringRate: number;
}

@Component({
  selector: 'ui-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.scss']
})
export class KpiCardsComponent {
  @Input() summary: KpiSummary | null = null;
  @Input() rangeLabel = '';
  @Input() loading = false;

  formatCurrency(amount: number | undefined | null): string {
    if (amount === undefined || amount === null) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  }

  formatPercent(value: number | undefined | null): string {
    if (value === undefined || value === null) return '0%';
    return `${Number(value).toFixed(1)}%`;
  }
}


