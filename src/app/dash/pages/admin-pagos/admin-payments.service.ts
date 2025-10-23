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

  list(secret: string, token: string | null, start?: string | null, end?: string | null) {
    const params: string[] = ['limit=100'];
    if (start && end) { params.push(`start=${encodeURIComponent(start)}`); params.push(`end=${encodeURIComponent(end)}`); }
    return this.http.get<any>(`${this.baseUrl}/admin/payments?${params.join('&')}`, { headers: this.headers(secret, token) });
  }

  summary(secret: string, token: string | null, start?: string | null, end?: string | null) {
    const params: string[] = [];
    if (start && end) { params.push(`start=${encodeURIComponent(start)}`); params.push(`end=${encodeURIComponent(end)}`); }
    const qs = params.length ? ('?' + params.join('&')) : '';
    return this.http.get<any>(`${this.baseUrl}/admin/payments/summary${qs}`, { headers: this.headers(secret, token) });
  }
}


