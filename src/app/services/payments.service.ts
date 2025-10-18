import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
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

  createCheckoutSession(appointmentId: number): Observable<{ success: boolean; url: string }>{
    return this.http.post<{ success: boolean; url: string }>(
      `${this.base}/payments/appointments/${appointmentId}/checkout-session`,
      {},
      { headers: this.headers() }
    );
  }

  getPaymentStatus(appointmentId: number): Observable<{ success: boolean; payment: { status: string; paid_at?: string; amount?: number } }>{
    return this.http.get<{ success: boolean; payment: { status: string; paid_at?: string; amount?: number } }>(
      `${this.base}/payments/appointments/${appointmentId}/status`,
      { headers: this.headers() }
    );
  }

  confirmAppointmentPayment(appointmentId: number, sessionId: string): Observable<{ success: boolean; confirmed: boolean; payment?: any }>{
    return this.http.get<{ success: boolean; confirmed: boolean; payment?: any }>(
      `${this.base}/payments/appointments/${appointmentId}/confirm`,
      { headers: this.headers(), params: { session_id: sessionId } as any }
    );
  }
}


