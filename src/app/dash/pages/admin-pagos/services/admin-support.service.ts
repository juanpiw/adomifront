import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export type AdminSupportStatus = 'abierto' | 'en_proceso' | 'cerrado';

export interface AdminSupportTicket {
  id: number;
  profile: 'client' | 'provider';
  user_id: number;
  user_email?: string | null;
  user_name?: string | null;
  subject: string;
  category: string;
  status: AdminSupportStatus;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSupportMessage {
  id: number;
  ticket_id: number;
  author_type: 'client' | 'provider' | 'admin';
  author_id: number | null;
  message: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AdminSupportService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private headers(secret: string, token: string | null) {
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': secret
    });
  }

  list(
    secret: string,
    token: string | null,
    options: { status?: AdminSupportStatus | 'all'; category?: string; search?: string; limit?: number; offset?: number } = {}
  ) {
    const params = new URLSearchParams();
    if (options.status && options.status !== 'all') params.set('status', options.status);
    if (options.category) params.set('category', options.category);
    if (options.search) params.set('search', options.search);
    if (typeof options.limit === 'number') params.set('limit', String(options.limit));
    if (typeof options.offset === 'number') params.set('offset', String(options.offset));
    // perfil fijo client para admin-pagos
    params.set('profile', 'client');
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<{ success: boolean; tickets: AdminSupportTicket[]; total: number }>(
      `${this.baseUrl}/admin/support/tickets${qs}`,
      { headers: this.headers(secret, token) }
    );
  }

  get(secret: string, token: string | null, id: number) {
    return this.http.get<{ success: boolean; ticket: AdminSupportTicket }>(
      `${this.baseUrl}/admin/support/tickets/${id}`,
      { headers: this.headers(secret, token) }
    );
  }

  updateStatus(secret: string, token: string | null, id: number, status: AdminSupportStatus) {
    return this.http.patch<{ success: boolean; ticket: AdminSupportTicket }>(
      `${this.baseUrl}/admin/support/tickets/${id}/status`,
      { status },
      { headers: this.headers(secret, token) }
    );
  }

  listMessages(secret: string, token: string | null, id: number) {
    return this.http.get<{ success: boolean; messages: AdminSupportMessage[] }>(
      `${this.baseUrl}/admin/support/tickets/${id}/messages`,
      { headers: this.headers(secret, token) }
    );
  }

  reply(secret: string, token: string | null, id: number, message: string) {
    return this.http.post<{ success: boolean; message: AdminSupportMessage }>(
      `${this.baseUrl}/admin/support/tickets/${id}/messages`,
      { message },
      { headers: this.headers(secret, token) }
    );
  }
}

