import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  StatisticsHeaderComponent, 
  DateFilterComponent, 
  KpiCardsComponent, 
  RevenueChartComponent,
  ServicesChartComponent,
  ReviewsTableComponent
} from '../../../../libs/shared-ui/statistics';

@Component({
  selector: 'app-d-estadisticas',
  standalone: true,
  imports: [
    CommonModule, 
    StatisticsHeaderComponent, 
    DateFilterComponent, 
    KpiCardsComponent,
    RevenueChartComponent,
    ServicesChartComponent,
    ReviewsTableComponent
  ],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class DashEstadisticasComponent {
  dateRange = { startDate: '', endDate: '' };

  onDateRangeChange(range: { startDate: string; endDate?: string }) {
    this.dateRange = {
      startDate: range.startDate,
      endDate: range.endDate || ''
    };
    // Futuro: recargar KPIs y gráficos con el nuevo rango
  }
}
