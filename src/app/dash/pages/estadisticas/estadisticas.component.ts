import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  StatisticsHeaderComponent, 
  DateFilterComponent, 
  KpiCardsComponent, 
  RevenueChartComponent,
  ServicesChartComponent,
  ReviewsTableComponent
} from '../../../../libs/shared-ui/statistics';
import { DateRange } from '../../../../libs/shared-ui/statistics/date-filter/date-filter.component';
import { ProviderAnalyticsService, ProviderAnalyticsSummary, ProviderAnalyticsSeries, ProviderServiceRank, ProviderReviewItem, AnalyticsRange } from '../../../services/provider-analytics.service';
import { SessionService } from '../../../auth/services/session.service';
import { finalize } from 'rxjs/operators';

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
export class DashEstadisticasComponent implements OnInit {
  dateRange: DateRange = this.buildDefaultRange();
  rangeLabel = 'Últimos 6 Meses';

  summary: ProviderAnalyticsSummary | null = null;
  timeseries: ProviderAnalyticsSeries[] = [];
  timeseriesGroup: 'month' | 'week' = 'month';
  services: ProviderServiceRank[] = [];
  reviews: ProviderReviewItem[] = [];

  loading = false;
  error: string | null = null;

  private analytics = inject(ProviderAnalyticsService);
  private session = inject(SessionService);
  private providerId: number | null = null;

  ngOnInit(): void {
    const user = this.session.getUser();
    this.providerId = user?.id || null;
    if (!this.providerId) {
      this.error = 'No se pudo determinar el proveedor autenticado.';
      return;
    }
    this.fetchAnalytics(this.dateRange);
  }

  onDateRangeChange(range: DateRange) {
    this.dateRange = {
      startDate: range.startDate,
      endDate: range.endDate || this.todayIso()
    };
    this.rangeLabel = this.computeRangeLabel(this.dateRange);
    this.fetchAnalytics(this.dateRange);
  }

  private fetchAnalytics(range: DateRange) {
    if (!this.providerId) return;

    const normalized: AnalyticsRange = {
      from: range.startDate,
      to: range.endDate || this.todayIso()
    };

    this.loading = true;
    this.error = null;

    this.analytics.getDashboardSnapshot(this.providerId, normalized)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (result) => {
          if (result.summary?.success) {
            this.summary = result.summary.summary;
          } else {
            this.summary = null;
          }

          if (result.timeseries?.success) {
            this.timeseries = result.timeseries.series || [];
            this.timeseriesGroup = result.timeseries.group === 'week' ? 'week' : 'month';
          } else {
            this.timeseries = [];
          }

          if (result.services?.success) {
            this.services = (result.services.services || []).slice(0, 5);
          } else {
            this.services = [];
          }

          if (result.reviews?.success) {
            this.reviews = result.reviews.reviews || [];
          } else {
            this.reviews = [];
          }
        },
        error: (err) => {
          this.error = err?.error?.error || err?.message || 'No se pudieron cargar las estadísticas.';
          this.summary = null;
          this.timeseries = [];
          this.services = [];
          this.reviews = [];
        }
      });
  }

  private buildDefaultRange(): DateRange {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  private computeRangeLabel(range: DateRange): string {
    try {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate || this.todayIso());
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

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }
}
