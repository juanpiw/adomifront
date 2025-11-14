import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export type ClientQuoteTabId = 'new' | 'sent' | 'accepted' | 'history';

export interface QuoteRequestPayload {
  providerId: number;
  serviceSummary?: string;
  message: string;
  preferredDate?: string | null;
  preferredTimeRange?: string | null;
  attachments?: File[];
}

export interface QuoteRequestResponse {
  success: boolean;
  quoteId?: number;
  error?: string;
}

export interface ClientQuoteSummary {
  id: number;
  status: 'new' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'draft';
  serviceName: string;
  requestedAt: string;
  provider: {
    id: number;
    name: string;
    avatarUrl?: string | null;
    memberSince?: string | null;
    city?: string | null;
    country?: string | null;
  };
  message?: string | null;
  amount?: number | null;
  currency?: string | null;
  validUntil?: string | null;
  appointment?: {
    appointmentId: number;
    date: string | null;
    time: string | null;
  } | null;
}

export interface ClientQuotesResponse {
  success: boolean;
  quotes: ClientQuoteSummary[];
  counters: Record<ClientQuoteTabId, number>;
}

export interface ClientQuoteDetailResponse {
  success: boolean;
  quote: ClientQuoteSummary & {
    proposal?: {
      amount?: number | null;
      currency?: string | null;
      details?: string | null;
      validUntil?: string | null;
    };
    items: Array<{
      id: number;
      title: string;
      description?: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    attachments: Array<{
      id: number;
      name: string;
      url: string;
      size?: number | null;
      type?: string | null;
      category?: string | null;
    }>;
    events: Array<{
      id: number;
      event_type: string;
      created_at: string;
      metadata?: unknown;
    }>;
    messages: Array<{
      id: number;
      sender_id: number;
      sender_role: 'client' | 'provider';
      message: string;
      created_at: string;
      read_at?: string | null;
    }>;
  };
}

@Injectable({ providedIn: 'root' })
export class QuotesClientService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = environment.apiBaseUrl;

  createRequest(payload: QuoteRequestPayload): Observable<QuoteRequestResponse> {
    const form = new FormData();

    form.append('providerId', String(payload.providerId));
    if (payload.serviceSummary) {
      form.append('service', payload.serviceSummary);
    }
    form.append('message', payload.message.trim());

    if (payload.preferredDate) {
      form.append('preferredDate', payload.preferredDate);
    }
    if (payload.preferredTimeRange) {
      form.append('preferredTimeRange', payload.preferredTimeRange);
    }

    (payload.attachments || []).slice(0, 5).forEach((file) => {
      if (file) {
        form.append('attachments', file, file.name);
      }
    });

    return this.http.post<QuoteRequestResponse>(`${this.baseUrl}/client/quotes`, form, {
      headers: this.authHeaders()
    });
  }

  getQuotes(status: ClientQuoteTabId = 'new', limit?: number, offset?: number): Observable<ClientQuotesResponse> {
    const params: Record<string, string> = { status };
    if (typeof limit === 'number') params['limit'] = String(limit);
    if (typeof offset === 'number') params['offset'] = String(offset);
    return this.http.get<ClientQuotesResponse>(`${this.baseUrl}/client/quotes`, {
      headers: this.authHeaders(),
      params
    });
  }

  getQuoteDetail(id: number): Observable<ClientQuoteDetailResponse> {
    return this.http.get<ClientQuoteDetailResponse>(`${this.baseUrl}/client/quotes/${id}`, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders | undefined {
    const token = this.auth.getAccessToken();
    if (!token) return undefined;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}
