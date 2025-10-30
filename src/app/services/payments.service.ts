import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = environment.apiBaseUrl;
  private cashSummarySubject = new BehaviorSubject<any | null>(null);

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  get cashSummary$(): Observable<any | null> {
    return this.cashSummarySubject.asObservable();
  }

  refreshCashSummary(): Observable<{ success: boolean; summary: any }> {
    return this.http.get<{ success: boolean; summary: any }>(
      `${this.base}/provider/cash/summary`,
      { headers: this.headers() }
    ).pipe(
      tap((resp) => {
        if (resp?.success) {
          this.cashSummarySubject.next(resp.summary || null);
        }
      })
    );
  }

  createCheckoutSession(appointmentId: number): Observable<{ success: boolean; url: string }>{
    console.log('[PAYMENTS_SERVICE] createCheckoutSession ->', { appointmentId });
    return this.http.post<{ success: boolean; url: string }>(
      `${this.base}/payments/appointments/${appointmentId}/checkout-session`,
      {},
      { headers: this.headers() }
    );
  }

  // TBK Mall: crear transacción
  tbkCreateMallTransaction(params: {
    appointment_id: number;
    client_reference?: string;
  }): Observable<{ success: boolean; token?: string; url?: string; buy_order?: string }>{
    console.log('[PAYMENTS_SERVICE] tbkCreateMallTransaction ->', params);
    return this.http.post<{ success: boolean; token?: string; url?: string; buy_order?: string }>(
      `${this.base}/tbk/mall/transactions`,
      params,
      { headers: this.headers() }
    );
  }

  // TBK Mall: commit
  tbkCommit(token: string): Observable<{ success: boolean; commit: any }>{
    console.log('[PAYMENTS_SERVICE] tbkCommit ->', { token });
    return this.http.post<{ success: boolean; commit: any }>(
      `${this.base}/tbk/mall/commit`,
      { token },
      { headers: this.headers() }
    );
  }

  getPaymentStatus(appointmentId: number): Observable<{ success: boolean; payment: { status: string; paid_at?: string; amount?: number } }>{
    console.log('[PAYMENTS_SERVICE] getPaymentStatus ->', { appointmentId });
    return this.http.get<{ success: boolean; payment: { status: string; paid_at?: string; amount?: number } }>(
      `${this.base}/payments/appointments/${appointmentId}/status`,
      { headers: this.headers() }
    );
  }

  confirmAppointmentPayment(appointmentId: number, sessionId: string): Observable<{ success: boolean; confirmed: boolean; payment?: any }>{
    console.log('[PAYMENTS_SERVICE] confirmAppointmentPayment ->', { appointmentId, sessionId });
    return this.http.get<{ success: boolean; confirmed: boolean; payment?: any }>(
      `${this.base}/payments/appointments/${appointmentId}/confirm`,
      { headers: this.headers(), params: { session_id: sessionId } as any }
    );
  }

  // Provider earnings summary
  getProviderEarningsSummary(month?: string): Observable<{ success: boolean; summary: { month: string; releasable: number; pending: number; released: number; paidCount: number } }>{
    const params: any = {};
    if (month) params.month = month;
    console.log('[PAYMENTS_SERVICE] getProviderEarningsSummary ->', params);
    return this.http.get<{ success: boolean; summary: { month: string; releasable: number; pending: number; released: number; paidCount: number } }>(
      `${this.base}/provider/earnings/summary`,
      { headers: this.headers(), params }
    );
  }

  // Refund request
  requestRefund(appointmentId: number, reason: string): Observable<{ success: boolean; request_id: number }>{
    const body = { reason } as any;
    return this.http.post<{ success: boolean; request_id: number }>(
      `${this.base}/payments/appointments/${appointmentId}/refund-request`,
      body,
      { headers: this.headers() }
    );
  }

  // Cash collect (provider)
  collectCash(appointmentId: number): Observable<{ success: boolean; payment_id: number }>{
    return this.http.post<{ success: boolean; payment_id: number }>(
      `${this.base}/appointments/${appointmentId}/cash/collect`,
      {},
      { headers: this.headers() }
    );
  }

  // Cash select (client/provider) → marca payment_method='cash' y retorna código
  selectCash(appointmentId: number): Observable<{ success: boolean; code?: string }>{
    return this.http.post<{ success: boolean; code?: string }>(
      `${this.base}/appointments/${appointmentId}/cash/select`,
      {},
      { headers: this.headers() }
    );
  }
}


