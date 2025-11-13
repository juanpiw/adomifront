import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

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

    const options: { headers?: HttpHeaders } = {};
    const token = this.auth.getAccessToken();
    if (token) {
      options.headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
    }

    return this.http.post<QuoteRequestResponse>(`${this.baseUrl}/client/quotes`, form, options);
  }
}

