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

  // ==========================
  // Payment Disputes (chargebacks)
  // ==========================

  listPaymentDisputes(
    secret: string,
    token: string | null,
    options: { status?: string; payment_id?: number; appointment_id?: number; limit?: number; offset?: number } = {}
  ) {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.payment_id) params.set('payment_id', String(options.payment_id));
    if (options.appointment_id) params.set('appointment_id', String(options.appointment_id));
    if (typeof options.limit === 'number') params.set('limit', String(options.limit));
    if (typeof options.offset === 'number') params.set('offset', String(options.offset));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/payment-disputes${qs}`, { headers: this.headers(secret, token) });
  }

  createPaymentDispute(
    secret: string,
    token: string | null,
    payload: { payment_id?: number; appointment_id?: number; source?: string | null; deadline_at?: string | null; notes?: string | null; metadata?: any }
  ) {
    return this.http.post<any>(`${this.baseUrl}/admin/payment-disputes`, payload || {}, { headers: this.headers(secret, token) });
  }

  updatePaymentDispute(
    secret: string,
    token: string | null,
    id: number,
    payload: { status?: string; deadline_at?: string | null; notes?: string | null; metadata?: any }
  ) {
    return this.http.patch<any>(`${this.baseUrl}/admin/payment-disputes/${id}`, payload || {}, { headers: this.headers(secret, token) });
  }

  lockPaymentDisputeEvidence(
    secret: string,
    token: string | null,
    id: number,
    payload: { evidence?: any; evidence_hash?: string | null }
  ) {
    return this.http.post<any>(`${this.baseUrl}/admin/payment-disputes/${id}/evidence/lock`, payload || {}, { headers: this.headers(secret, token) });
  }

  // ==========================
  // TBK Oneclick Admin helpers
  // ==========================

  tbkOneclickStatus(secret: string, token: string | null, paymentId: number) {
    return this.http.get<any>(`${this.baseUrl}/admin/payments/${paymentId}/tbk/oneclick/status`, { headers: this.headers(secret, token) });
  }

  tbkOneclickRefund(secret: string, token: string | null, paymentId: number, scope: 'proveedor'|'plataforma'|'total' = 'total') {
    return this.http.post<any>(
      `${this.baseUrl}/admin/payments/${paymentId}/tbk/oneclick/refund`,
      { scope },
      { headers: this.headers(secret, token) }
    );
  }

  // ==========================
  // Provider geo evidence (appointments)
  // ==========================

  getAppointmentLocationEvents(secret: string, token: string | null, appointmentId: number) {
    return this.http.get<any>(
      `${this.baseUrl}/admin/appointments/${appointmentId}/location-events`,
      { headers: this.headers(secret, token) }
    );
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

  listFounderCodes(secret: string, token: string | null) {
    return this.http.get<any>(`${this.baseUrl}/founder-codes`, { headers: this.headers(secret, token) });
  }

  exportFounderCodes(secret: string, token: string | null) {
    return this.http.get(`${this.baseUrl}/founder-codes/export.csv`, {
      headers: this.headers(secret, token),
      responseType: 'text'
    });
  }

  analyticsTopTerms(secret: string, token: string | null, params: { from?: string | null; to?: string | null; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/search/top-terms${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsExternalTopTerms(secret: string, token: string | null, params: { from?: string | null; to?: string | null; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/search/external-top-terms${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsMostVisitedProviders(secret: string, token: string | null, params: { from?: string | null; to?: string | null; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/providers/most-visited${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsIncompleteProfiles(secret: string, token: string | null, params: { limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/providers/incomplete-profiles${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsSearchTrends(secret: string, token: string | null, params: { from?: string | null; to?: string | null; group?: 'day' | 'week' } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.group) searchParams.set('group', params.group);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/search/trends${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsWhoSearchesWhom(secret: string, token: string | null, params: { from?: string | null; to?: string | null; term?: string; providerId?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.term) searchParams.set('term', params.term);
    if (params.providerId) searchParams.set('providerId', String(params.providerId));
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/search/who-searches-whom${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsConversionFunnel(secret: string, token: string | null, params: { from?: string | null; to?: string | null; group?: 'day' | 'week' } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.group) searchParams.set('group', params.group);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/conversion/funnel${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsConversionByTerm(secret: string, token: string | null, params: { from?: string | null; to?: string | null; limit?: number; min_searches?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.min_searches) searchParams.set('min_searches', String(params.min_searches));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/conversion/by-term${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsConversionByProvider(secret: string, token: string | null, params: { from?: string | null; to?: string | null; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/conversion/by-provider${qs}`, { headers: this.headers(secret, token) });
  }

  analyticsAttributionQuality(secret: string, token: string | null, params: { from?: string | null; to?: string | null } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.http.get<any>(`${this.baseUrl}/admin/analytics/conversion/attribution-quality${qs}`, { headers: this.headers(secret, token) });
  }
}


