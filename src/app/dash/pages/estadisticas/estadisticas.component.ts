import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { finalize, filter, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthUser } from '../../../auth/services/auth.service';

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
export class DashEstadisticasComponent implements OnInit, OnDestroy {
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
  private userSubscription?: Subscription;
  private readonly sessionUser$ = toObservable(this.session.user);

  ngOnInit(): void {
    const user = this.session.getUser();
    if (this.initializeProvider(user)) {
      this.fetchAnalytics(this.dateRange);
      return;
    }

    this.userSubscription = this.sessionUser$
      .pipe(
        filter((u): u is AuthUser => !!u && Number.isFinite(u.id)),
        take(1)
      )
      .subscribe((u) => {
        if (this.initializeProvider(u)) {
          this.fetchAnalytics(this.dateRange);
        }
      });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
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

  private initializeProvider(user: AuthUser | null): boolean {
    if (!user) {
      return false;
    }
    if (user.role !== 'provider') {
      this.error = 'Esta sección está disponible solo para cuentas de profesional.';
      return false;
    }
    const providerId = Number(user.id);
    if (!Number.isFinite(providerId)) {
      return false;
    }
    this.providerId = providerId;
    this.error = null;
    return true;
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
