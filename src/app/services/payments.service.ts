import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface ProviderEarningsSummaryPoint {
  bucket: string;
  total: number;
}

export interface ProviderEarningsSummary {
  scope: 'month' | 'day';
  month: string;
  day?: string | null;
  range: { start: string; end: string };
  releasable: number;
  pending: number;
  released: number;
  paidCount: number;
  series?: ProviderEarningsSummaryPoint[];
}

export interface ProviderFinanceTransaction {
  id: number;
  paid_at: string;
  amount: number;
  commission_amount: number;
  provider_amount: number;
  currency: string;
  appointment_id: number;
  date: string;
  start_time: string;
  service_id: number;
  service_name?: string | null;
  client_name?: string | null;
}

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
        console.log('[TRACE][PAYMENTS_SERVICE] refreshCashSummary response', resp);
        if (resp?.success) {
          this.cashSummarySubject.next(resp.summary || null);
        }
      })
    );
  }

  signManualCashPaymentReceipt(payload: { contentType: string; sizeBytes: number; fileName?: string }): Observable<any> {
    return this.http.post(
      `${this.base}/provider/cash/manual-payments/sign`,
      {
        contentType: payload.contentType,
        sizeBytes: payload.sizeBytes,
        fileName: payload.fileName || null
      },
      { headers: this.headers() }
    );
  }

  submitManualCashPayment(payload: {
    amount: number;
    currency?: string;
    key: string;
    bucket?: string | null;
    reference?: string | null;
    notes?: string | null;
    fileName?: string | null;
  }): Observable<any> {
    return this.http.post(
      `${this.base}/provider/cash/manual-payments`,
      {
        amount: payload.amount,
        currency: payload.currency,
        key: payload.key,
        bucket: payload.bucket,
        reference: payload.reference,
        notes: payload.notes,
        fileName: payload.fileName
      },
      { headers: this.headers() }
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

  // Oneclick (cliente)
  ocProfile(): Observable<{ success: boolean; tbk_user?: string | null; username?: string | null }>{
    return this.http.get<{ success: boolean; tbk_user?: string | null; username?: string | null }>(
      `${this.base}/client/tbk/oneclick/profile`,
      { headers: this.headers() }
    );
  }

  ocStartInscription(appointmentId: number, responseUrl?: string, email?: string): Observable<{ success: boolean; token: string; url_webpay: string; userName: string }>{
    return this.http.post<{ success: boolean; token: string; url_webpay: string; userName: string }>(
      `${this.base}/client/tbk/oneclick/inscriptions`,
      { appointmentId, responseUrl, email },
      { headers: this.headers() }
    );
  }

  ocFinishInscription(token: string, appointmentId?: number, username?: string): Observable<{ success: boolean; inscription: any }>{
    return this.http.put<{ success: boolean; inscription: any }>(
      `${this.base}/client/tbk/oneclick/inscriptions/${token}`,
      { appointmentId, username },
      { headers: this.headers() }
    );
  }

  ocAuthorize(appointmentId: number, tbk_user?: string, username?: string): Observable<{ success: boolean; transaction: any }>{
    return this.http.post<{ success: boolean; transaction: any }>(
      `${this.base}/client/tbk/oneclick/transactions`,
      { appointment_id: appointmentId, tbk_user, username },
      { headers: this.headers() }
    );
  }

  getTbkSecondaryInfo(providerId: number, appointmentId?: number): Observable<{ success: boolean; tbk: { code: string | null; status: string; email: string | null } }>{
    return this.http.get<{ success: boolean; tbk: { code: string | null; status: string; email: string | null } }>(
      `${this.base}/providers/${providerId}/tbk/secondary/info`,
      { headers: this.headers(), params: appointmentId ? { appointmentId } as any : undefined }
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
  getProviderEarningsSummary(filters?: { month?: string; day?: string }): Observable<{ success: boolean; summary: ProviderEarningsSummary }>{
    const params: Record<string, string> = {};
    if (filters?.month) params['month'] = filters.month;
    if (filters?.day) params['day'] = filters.day;
    console.log('[PAYMENTS_SERVICE] getProviderEarningsSummary ->', params);
    return this.http.get<{ success: boolean; summary: ProviderEarningsSummary }>(
      `${this.base}/provider/earnings/summary`,
      { headers: this.headers(), params }
    );
  }

  // Provider finance transactions (payments) for a date range
  getProviderFinanceTransactions(filters: { from: string; to: string; limit?: number; offset?: number }): Observable<{ success: boolean; transactions: ProviderFinanceTransaction[]; total: number; error?: string }>{
    const params: Record<string, string> = {
      from: filters.from,
      to: filters.to
    };
    if (typeof filters.limit === 'number') params['limit'] = String(filters.limit);
    if (typeof filters.offset === 'number') params['offset'] = String(filters.offset);
    return this.http.get<{ success: boolean; transactions: ProviderFinanceTransaction[]; total: number; error?: string }>(
      `${this.base}/provider/finances/transactions`,
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


