import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import {
  ProviderClientReview,
  ProviderClientReviewSummary
} from './provider-client.service';

export interface ProviderClientReviewsResponse {
  success: boolean;
  summary: ProviderClientReviewSummary;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  reviews: ProviderClientReview[];
  error?: string;
}

export interface ProviderClientReviewCreateResponse {
  success: boolean;
  review: {
    id: number | null;
    appointment_id: number;
    client_id: number;
    provider_id: number;
    rating: number;
    comment: string | null;
  };
  summary: ProviderClientReviewSummary;
  error?: string;
}

export interface ProviderClientReviewableAppointment {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  service_name: string | null;
}

export interface ProviderClientReviewableAppointmentsResponse {
  success: boolean;
  appointments: ProviderClientReviewableAppointment[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ProviderClientReviewsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiBaseUrl;

  listReviews(
    clientId: number | string,
    options?: { limit?: number; offset?: number }
  ): Observable<ProviderClientReviewsResponse> {
    let params = new HttpParams();
    if (options?.limit) {
      params = params.set('limit', options.limit.toString());
    }
    if (options?.offset) {
      params = params.set('offset', options.offset.toString());
    }

    return this.http.get<ProviderClientReviewsResponse>(
      `${this.apiUrl}/provider/clients/${clientId}/reviews`,
      { headers: this.buildHeaders(), params }
    );
  }

  createReview(
    clientId: number | string,
    payload: { appointment_id: number; rating: number; comment?: string | null }
  ): Observable<ProviderClientReviewCreateResponse> {
    return this.http.post<ProviderClientReviewCreateResponse>(
      `${this.apiUrl}/provider/clients/${clientId}/reviews`,
      payload,
      { headers: this.buildHeaders() }
    );
  }

  listReviewableAppointments(
    clientId: number | string
  ): Observable<ProviderClientReviewableAppointmentsResponse> {
    return this.http.get<ProviderClientReviewableAppointmentsResponse>(
      `${this.apiUrl}/provider/clients/${clientId}/reviewable-appointments`,
      { headers: this.buildHeaders() }
    );
  }

  private buildHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }
}

