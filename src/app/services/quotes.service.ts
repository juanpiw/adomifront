import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QuoteStatus, QuotesTabId as SharedQuotesTabId } from '../../libs/shared-ui/quotes/quotes.models';

export type QuotesTabId = SharedQuotesTabId;

export interface ProviderQuoteDto {
  id: number;
  status: QuoteStatus | 'draft';
  serviceName: string;
  requestedAt: string;
  client: {
    id: number;
    name: string;
    avatarUrl?: string | null;
    memberSince?: string | null;
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

export interface ProviderQuotesResponse {
  success: boolean;
  quotes: ProviderQuoteDto[];
  counters: Record<QuotesTabId, number>;
}

export interface ProviderQuoteDetailResponse {
  success: boolean;
  quote: ProviderQuoteDto & {
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
  };
}

export interface QuoteProposalPayload {
  amount: number;
  details: string;
  validity: string;
  submit?: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getProviderQuotes(status: QuotesTabId): Observable<ProviderQuotesResponse> {
    return this.http.get<ProviderQuotesResponse>(`${this.base}/provider/quotes`, {
      params: { status }
    });
  }

  getProviderQuoteDetail(id: number): Observable<ProviderQuoteDetailResponse> {
    return this.http.get<ProviderQuoteDetailResponse>(`${this.base}/provider/quotes/${id}`);
  }

  saveProposal(quoteId: number, payload: QuoteProposalPayload): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/provider/quotes/${quoteId}/proposal`, payload);
  }

  uploadAttachment(
    quoteId: number,
    file: File,
    category: 'client_request' | 'provider_proposal' | 'support' = 'provider_proposal'
  ): Observable<{
    success: boolean;
    attachment: { id: number; name: string; url: string; size?: number; type?: string };
  }> {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    return this.http.post<{
      success: boolean;
      attachment: { id: number; name: string; url: string; size?: number; type?: string };
    }>(`${this.base}/provider/quotes/${quoteId}/attachments`, form);
  }

  deleteAttachment(quoteId: number, attachmentId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/provider/quotes/${quoteId}/attachments/${attachmentId}`);
  }
}


