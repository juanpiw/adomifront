import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsHeaderComponent, DateFilterComponent, KpiCardsComponent, KpiItem } from '../../../../libs/shared-ui/statistics';

@Component({
  selector: 'app-d-estadisticas',
  standalone: true,
  imports: [CommonModule, StatisticsHeaderComponent, DateFilterComponent, KpiCardsComponent],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class DashEstadisticasComponent {
  dateRange = { startDate: '', endDate: '' };
  kpis: KpiItem[] = [
    { title: 'Ingresos (30d)', value: '$1.250.000', trend: 'up', percentChange: 12 },
    { title: 'Reservas', value: '87', trend: 'up', percentChange: 5 },
    { title: 'Tasa de Conversión', value: '8.2%', trend: 'flat', percentChange: 0 },
    { title: 'Reseñas (⭐)', value: '4.7', trend: 'down', percentChange: 2 }
  ];

  onDateRangeChange(range: { startDate: string; endDate?: string }) {
    this.dateRange = {
      startDate: range.startDate,
      endDate: range.endDate || ''
    };
    // Futuro: recargar KPIs y gráficos con el nuevo rango
  }
}
