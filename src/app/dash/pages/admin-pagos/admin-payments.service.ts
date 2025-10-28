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

  pendingCount(secret: string, token: string | null) {
    return this.http.get<any>(`${this.baseUrl}/admin/payments/pending-count`, { headers: this.headers(secret, token) });
  }

  listRefunds(secret: string, token: string | null) {
    return this.http.get<any>(`${this.baseUrl}/admin/refunds`, { headers: this.headers(secret, token) });
  }

  decideRefund(secret: string, token: string | null, id: number, decision: 'approved'|'denied'|'cancelled', notes?: string) {
    return this.http.post<any>(`${this.baseUrl}/admin/refunds/${id}/decision`, { decision, notes }, { headers: this.headers(secret, token) });
  }
}


