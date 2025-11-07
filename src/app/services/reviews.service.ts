import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = environment.apiBaseUrl;

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  createReview(payload: {
    appointment_id: number;
    provider_id: number;
    rating: number; // 1..5
    comment?: string;
  }): Observable<{ success: boolean; review?: any; error?: string }>{
    console.log('[REVIEWS] createReview ->', payload);
    return this.http.post<{ success: boolean; review?: any; error?: string }>(
      `${this.base}/reviews`,
      payload,
      { headers: this.headers() }
    );
  }

  listProviderReviews(providerId: number): Observable<{ success: boolean; reviews: any[] }>{
    return this.http.get<{ success: boolean; reviews: any[] }>(
      `${this.base}/providers/${providerId}/reviews`,
      { headers: this.headers() }
    );
  }
}







