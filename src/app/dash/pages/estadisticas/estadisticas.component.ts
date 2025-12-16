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
import { ProviderAnalyticsService, ProviderAnalyticsSummary, ProviderAnalyticsSeries, ProviderServiceRank, ProviderReviewItem, AnalyticsRange, ProviderAnalyticsSummaryResponse, ProviderAnalyticsTimeseriesResponse, ProviderAnalyticsServicesResponse, ProviderAnalyticsReviewsResponse } from '../../../services/provider-analytics.service';
import { SessionService } from '../../../auth/services/session.service';
import { finalize, filter, take, switchMap, catchError } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subscription, forkJoin, of } from 'rxjs';
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
  analyticsAccess = {
    tier: 'basic' as 'basic' | 'advanced',
    summaryLimited: false,
    timeseriesLimited: false,
    servicesLimited: false,
    reviewsLimited: false
  };

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

    this.analytics.getSummary(this.providerId, normalized)
      .pipe(
        switchMap((summaryResponse) => {
          this.handleSummaryResponse(summaryResponse);

          const summaryLimited = !!summaryResponse.meta?.limited;
          if (this.shouldSkipAdvancedAnalytics(summaryLimited)) {
            this.markAdvancedLimitedState();
            return of(null);
          }

          return forkJoin({
            timeseries: this.analytics.getTimeseries(this.providerId!, normalized, this.timeseriesGroup)
              .pipe(catchError(() => of<ProviderAnalyticsTimeseriesResponse | null>(null))),
            services: this.analytics.getTopServices(this.providerId!, normalized, 5)
              .pipe(catchError(() => of<ProviderAnalyticsServicesResponse | null>(null))),
            reviews: this.analytics.getRecentReviews(this.providerId!, 5)
              .pipe(catchError(() => of<ProviderAnalyticsReviewsResponse | null>(null)))
          });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            return;
          }
          this.handleTimeseriesResponse(result.timeseries);
          this.handleServicesResponse(result.services);
          this.handleReviewsResponse(result.reviews);
        },
        error: (err) => {
          if (err?.status === 403) {
            this.error = 'No autorizado para ver estas estadísticas.';
          } else if (err?.status === 400) {
            this.error = err?.error?.error || err?.error?.message || 'Error obteniendo resumen';
          } else {
            this.error = err?.error?.error || err?.error?.message || err?.message || 'No se pudieron cargar las estadísticas.';
          }
          this.resetAnalyticsState();
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
      // Importante: usar fecha LOCAL (no UTC) para no “correr” el día en Chile.
      startDate: this.toLocalIsoDate(start),
      endDate: this.toLocalIsoDate(end)
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
    // Importante: usar fecha LOCAL (no UTC) para evitar rangos que terminen “mañana” en Chile.
    return this.toLocalIsoDate(new Date());
  }

  private toLocalIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get showUpgradeBanner(): boolean {
    return this.analyticsAccess.timeseriesLimited || this.analyticsAccess.servicesLimited || this.analyticsAccess.reviewsLimited;
  }

  private handleSummaryResponse(response: ProviderAnalyticsSummaryResponse) {
    if (!response?.success) {
      throw new Error(response?.meta?.reason || 'Resumen no disponible');
    }
    this.summary = response.summary;
    const tier = response.planFeatures?.analyticsTier === 'advanced' ? 'advanced' : 'basic';
    this.analyticsAccess.tier = tier;
    this.analyticsAccess.summaryLimited = !!response.meta?.limited;
    this.error = null;
  }

  private handleTimeseriesResponse(response: ProviderAnalyticsTimeseriesResponse | null) {
    if (response?.success) {
      this.timeseries = response.series || [];
      this.timeseriesGroup = response.group === 'week' ? 'week' : 'month';
      this.analyticsAccess.timeseriesLimited = !!response.meta?.limited;
      return;
    }
    this.timeseries = [];
    this.analyticsAccess.timeseriesLimited = false;
  }

  private handleServicesResponse(response: ProviderAnalyticsServicesResponse | null) {
    if (response?.success) {
      this.services = (response.services || []).slice(0, 5);
      this.analyticsAccess.servicesLimited = !!response.meta?.limited;
      return;
    }
    this.services = [];
    this.analyticsAccess.servicesLimited = false;
  }

  private handleReviewsResponse(response: ProviderAnalyticsReviewsResponse | null) {
    if (response?.success) {
      this.reviews = response.reviews || [];
      this.analyticsAccess.reviewsLimited = !!response.meta?.limited;
      return;
    }
    this.reviews = [];
    this.analyticsAccess.reviewsLimited = false;
  }

  private markAdvancedLimitedState() {
    this.timeseries = [];
    this.services = [];
    this.reviews = [];
    this.analyticsAccess.timeseriesLimited = true;
    this.analyticsAccess.servicesLimited = true;
    this.analyticsAccess.reviewsLimited = true;
  }

  private shouldSkipAdvancedAnalytics(summaryLimited: boolean): boolean {
    if (summaryLimited) {
      return true;
    }
    const subscriptionStatus = this.session.getSubscriptionStatus();
    return subscriptionStatus === 'founder';
  }

  private resetAnalyticsState() {
    this.summary = null;
    this.timeseries = [];
    this.services = [];
    this.reviews = [];
    this.analyticsAccess = {
      tier: 'basic',
      summaryLimited: false,
      timeseriesLimited: false,
      servicesLimited: false,
      reviewsLimited: false
    };
  }
}
