import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminPaymentsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private headers(secret: string, token: string | null) {
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': secret
    });
  }

  list(secret: string, token: string | null, start?: string | null, end?: string | null, releaseStatus?: string, gateway?: string) {
    const params: string[] = ['limit=100'];
    if (start && end) { params.push(`start=${encodeURIComponent(start)}`); params.push(`end=${encodeURIComponent(end)}`); }
    if (releaseStatus) { params.push(`release_status=${encodeURIComponent(releaseStatus)}`); }
    if (gateway) { params.push(`gateway=${encodeURIComponent(gateway)}`); }
    return this.http.get<any>(`${this.baseUrl}/admin/payments?${params.join('&')}`, { headers: this.headers(secret, token) });
  }

  summary(secret: string, token: string | null, start?: string | null, end?: string | null, gateway?: string) {
    const params: string[] = [];
    if (start && end) { params.push(`start=${encodeURIComponent(start)}`); params.push(`end=${encodeURIComponent(end)}`); }
    if (gateway) { params.push(`gateway=${encodeURIComponent(gateway)}`); }
    const qs = params.length ? ('?' + params.join('&')) : '';
    return this.http.get<any>(`${this.baseUrl}/admin/payments/summary${qs}`, { headers: this.headers(secret, token) });
  }

  cashSummary(secret: string, token: string | null) {
    return this.http.get<any>(`${this.baseUrl}/admin/cash/summary`, { headers: this.headers(secret, token) });
  }

  cashCommissions(secret: string, token: string | null, status: 'all'|'pending'|'overdue'|'under_review'|'rejected'|'paid' = 'pending') {
    const params: string[] = [];
    if (status && status !== 'all') {
      params.push(`status=${encodeURIComponent(status)}`);
    }
    const qs = params.length ? ('?' + params.join('&')) : '';
    return this.http.get<any>(`${this.baseUrl}/admin/cash/commissions${qs}`, { headers: this.headers(secret, token) });
  }

  listManualCashPayments(secret: string, token: string | null, options: { status?: 'under_review'|'paid'|'rejected'; limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (typeof options.limit === 'number') params.set('limit', String(options.limit));
    if (typeof options.offset === 'number') params.set('offset', String(options.offset));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/cash/manual-payments${qs}`, { headers: this.headers(secret, token) });
  }

  getManualCashPayment(secret: string, token: string | null, id: number) {
    return this.http.get<any>(`${this.baseUrl}/admin/cash/manual-payments/${id}`, { headers: this.headers(secret, token) });
  }

  approveManualCashPayment(secret: string, token: string | null, id: number, payload: { reference?: string; notes?: string }) {
    return this.http.post<any>(`${this.baseUrl}/admin/cash/manual-payments/${id}/approve`, payload || {}, { headers: this.headers(secret, token) });
  }

  rejectManualCashPayment(secret: string, token: string | null, id: number, reason: string, notes?: string) {
    return this.http.post<any>(`${this.baseUrl}/admin/cash/manual-payments/${id}/reject`, { reason, notes }, { headers: this.headers(secret, token) });
  }

  requestManualCashResubmission(
    secret: string,
    token: string | null,
    id: number,
    payload: { reason: string; notes?: string | null }
  ) {
    return this.http.post<any>(
      `${this.baseUrl}/admin/cash/manual-payments/${id}/request-resubmission`,
      payload,
      { headers: this.headers(secret, token) }
    );
  }

  pendingCount(secret: string, token: string | null) {
    return this.http.get<any>(`${this.baseUrl}/admin/payments/pending-count`, { headers: this.headers(secret, token) });
  }

  listRefunds(secret: string, token: string | null) {
    return this.http.get<any>(`${this.baseUrl}/admin/refunds`, { headers: this.headers(secret, token) });
  }

  decideRefund(secret: string, token: string | null, id: number, decision: 'approved'|'denied'|'cancelled', notes?: string) {
    return this.http.post<any>(`${this.baseUrl}/admin/refunds/${id}/decision`, { decision, notes }, { headers: this.headers(secret, token) });
  }

  generateFounderCode(secret: string, token: string | null, payload: {
    durationMonths?: number | null;
    expiryMonths?: number | null;
    expiresAt?: string | null;
    maxRedemptions?: number | null;
    notes?: string | null;
    recipientEmail?: string | null;
    code?: string | null;
  }) {
    const body = {
      action: 'generate',
      ...payload
    };
    return this.http.post<any>(`${this.baseUrl}/subscriptions/admin/founder-code`, body, { headers: this.headers(secret, token) });
  }

  sendFounderCode(secret: string, token: string | null, payload: {
    code: string;
    recipientEmail: string;
    recipientName?: string | null;
    message?: string | null;
  }) {
    const body = {
      action: 'send',
      ...payload
    };
    return this.http.post<any>(`${this.baseUrl}/subscriptions/admin/founder-code`, body, { headers: this.headers(secret, token) });
  }

  listVerifications(
    secret: string,
    token: string | null,
    options: { status?: string; limit?: number; offset?: number; search?: string; from?: string; to?: string; type?: 'provider' | 'client' } = {}
  ) {
    const params = new URLSearchParams();
    if (options.status && options.status !== 'all') {
      params.set('status', options.status);
    }
    if (typeof options.limit === 'number') {
      params.set('limit', String(options.limit));
    }
    if (typeof options.offset === 'number') {
      params.set('offset', String(options.offset));
    }
    if (options.search) {
      params.set('q', options.search);
    }
    if (options.from) {
      params.set('from', options.from);
    }
    if (options.to) {
      params.set('to', options.to);
    }
    if (options.type) {
      params.set('type', options.type);
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/verification/requests${qs}`, { headers: this.headers(secret, token) });
  }

  getVerificationDetail(secret: string, token: string | null, id: number, type: 'provider' | 'client' = 'provider') {
    const qs = type ? `?type=${type}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/verification/requests/${id}${qs}`, { headers: this.headers(secret, token) });
  }

  approveVerification(secret: string, token: string | null, id: number, notes?: string, type: 'provider' | 'client' = 'provider') {
    const qs = type ? `?type=${type}` : '';
    return this.http.post<any>(`${this.baseUrl}/admin/verification/requests/${id}/approve${qs}`, { notes, type }, { headers: this.headers(secret, token) });
  }

  rejectVerification(secret: string, token: string | null, id: number, reason: string, notes?: string, type: 'provider' | 'client' = 'provider') {
    const qs = type ? `?type=${type}` : '';
    return this.http.post<any>(`${this.baseUrl}/admin/verification/requests/${id}/reject${qs}`, { reason, notes, type }, { headers: this.headers(secret, token) });
  }
}


