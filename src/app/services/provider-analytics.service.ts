import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface ProviderAnalyticsSummary {
  currency: string;
  totalIncome: number;
  completedAppointments: number;
  averageRating: number;
  reviewsCount: number;
  totalClients: number;
  recurringClients: number;
  recurringRate: number;
}

export interface ProviderAnalyticsSeries {
  period: string;
  income: number;
  payments: number;
  appointments: number;
}

export interface ProviderServiceRank {
  serviceId: number;
  name: string;
  bookings: number;
  income: number;
}

export interface ProviderReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  clientName: string;
  serviceName: string | null;
}

export interface AnalyticsRange {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class ProviderAnalyticsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = environment.apiBaseUrl;

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  private buildParams(range: AnalyticsRange, extra?: Record<string, any>): HttpParams {
    let params = new HttpParams()
      .set('from', range.from)
      .set('to', range.to);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return params;
  }

  getSummary(providerId: number, range: AnalyticsRange): Observable<{ success: boolean; summary: ProviderAnalyticsSummary; period: { from: string; to: string } }> {
    return this.http.get<{ success: boolean; summary: ProviderAnalyticsSummary; period: { from: string; to: string } }>(
      `${this.baseUrl}/providers/${providerId}/analytics/summary`,
      { headers: this.headers(), params: this.buildParams(range) }
    );
  }

  getTimeseries(providerId: number, range: AnalyticsRange, group: 'month' | 'week' = 'month'): Observable<{ success: boolean; series: ProviderAnalyticsSeries[]; group: string; period: { from: string; to: string } }> {
    return this.http.get<{ success: boolean; series: ProviderAnalyticsSeries[]; group: string; period: { from: string; to: string } }>(
      `${this.baseUrl}/providers/${providerId}/analytics/revenue-timeseries`,
      { headers: this.headers(), params: this.buildParams(range, { group }) }
    );
  }

  getTopServices(providerId: number, range: AnalyticsRange, limit = 5): Observable<{ success: boolean; services: ProviderServiceRank[]; period: { from: string; to: string } }> {
    return this.http.get<{ success: boolean; services: ProviderServiceRank[]; period: { from: string; to: string } }>(
      `${this.baseUrl}/providers/${providerId}/analytics/services-top`,
      { headers: this.headers(), params: this.buildParams(range, { limit }) }
    );
  }

  getRecentReviews(providerId: number, limit = 5): Observable<{ success: boolean; reviews: ProviderReviewItem[] }> {
    return this.http.get<{ success: boolean; reviews: ProviderReviewItem[] }>(
      `${this.baseUrl}/providers/${providerId}/analytics/reviews`,
      { headers: this.headers(), params: new HttpParams().set('limit', String(limit)) }
    );
  }

  getDashboardSnapshot(providerId: number, range: AnalyticsRange) {
    return forkJoin({
      summary: this.getSummary(providerId, range),
      timeseries: this.getTimeseries(providerId, range),
      services: this.getTopServices(providerId, range),
      reviews: this.getRecentReviews(providerId)
    });
  }
}




