import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface ProviderClientProfile {
  client_id: number;
  full_name: string;
  display_name: string;
  email: string;
  phone: string;
  address: string;
  commune: string;
  region: string;
  preferred_language: string;
  notes: string;
  verification_status: 'none' | 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  rating_average: number;
  review_count: number;
  profile_photo_url: string | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;
  user_created_at: string | null;
}

export interface ProviderClientReview {
  id: number;
  appointment_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  provider_name: string | null;
}

export interface ProviderClientReviewSummary {
  count: number;
  average: number;
}

export interface ProviderClientProfileReviews {
  summary: ProviderClientReviewSummary;
  recent: ProviderClientReview[];
}

export interface ProviderClientProfileResponse {
  success: boolean;
  client: ProviderClientProfile;
  reviews: ProviderClientProfileReviews;
  error?: string;
  details?: string;
}

@Injectable({ providedIn: 'root' })
export class ProviderClientService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiBaseUrl;

  getClientProfile(clientId: number | string): Observable<ProviderClientProfileResponse> {
    const headers = this.buildHeaders();
    return this.http.get<ProviderClientProfileResponse>(
      `${this.apiUrl}/provider/clients/${clientId}/profile`,
      { headers }
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

