import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export type ProviderInviteStatus = 'issued' | 'registered' | 'verified' | 'expired' | 'revoked';

export interface ProviderInvite {
  id: number;
  invite_code: string;
  invitee_email?: string | null;
  invitee_phone?: string | null;
  invitee_name?: string | null;
  status: ProviderInviteStatus;
  invitee_provider_id?: number | null;
  registered_at?: string | null;
  verified_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  share_url: string;
}

export interface ProviderInviteSummaryCounts {
  issued: number;
  registered: number;
  verified: number;
  expired: number;
  revoked: number;
}

export interface ProviderInviteSummary {
  quota: number;
  used: number;
  pioneer_unlocked_at: string | null;
  counts: ProviderInviteSummaryCounts;
}

export interface ProviderInviteListResponse {
  success: boolean;
  summary: ProviderInviteSummary;
  invites: ProviderInvite[];
}

export interface ProviderInviteCreateResponse {
  success: boolean;
  invite: ProviderInvite;
}

export interface ProviderInviteCreatePayload {
  email?: string;
  phone?: string;
  name?: string;
}

export interface ProviderInviteAcceptPayload {
  inviteCode: string;
  name?: string;
  email?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class ProviderInviteService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiBaseUrl;

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  list(): Observable<ProviderInviteListResponse> {
    return this.http.get<ProviderInviteListResponse>(`${this.apiUrl}/provider/invites`, {
      headers: this.headers()
    });
  }

  create(payload: ProviderInviteCreatePayload): Observable<ProviderInviteCreateResponse> {
    return this.http.post<ProviderInviteCreateResponse>(`${this.apiUrl}/provider/invites`, payload, {
      headers: this.headers()
    });
  }

  accept(payload: ProviderInviteAcceptPayload): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/provider/invites/accept`, payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }
}

