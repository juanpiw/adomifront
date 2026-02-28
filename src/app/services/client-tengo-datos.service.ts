import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface ClientTengoDatoApplicationApi {
  id: number;
  messageText: string;
  createdAt: string;
  profile: {
    providerId: number | null;
    name: string;
    professionalTitle: string | null;
    commune: string | null;
    avatarUrl: string | null;
  };
}

export interface ClientTengoDatoMatchApi {
  providerId: number;
  name: string;
  professionalTitle: string | null;
  commune: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  rankPosition: number;
}

export interface ClientTengoDatoItemApi {
  id: number;
  leadId: number;
  status?: string;
  category: string;
  commune: string | null;
  region: string | null;
  publicText: string;
  createdAt: string;
  stats: {
    likesCount: number;
    commentsCount: number;
    applicationsCount: number;
  };
  applications: ClientTengoDatoApplicationApi[];
  matches: ClientTengoDatoMatchApi[];
}

export interface ClientTengoDatosPublishedResponse {
  success: boolean;
  data: {
    items: ClientTengoDatoItemApi[];
  };
}

export interface TengoDatoFeedActivityItemApi {
  id: number;
  lead_id?: number | null;
  status?: string;
  category: string;
  commune: string | null;
  region: string | null;
  public_text: string;
  reactions_count: number;
  comments_count: number;
  applications_count: number;
  created_at: string;
}

export interface TengoDatoFeedActivityResponse {
  success: boolean;
  data: TengoDatoFeedActivityItemApi[];
}

@Injectable({ providedIn: 'root' })
export class ClientTengoDatosService {
  private apiUrl = environment.apiBaseUrl;
  private readonly tengoDatoTokenKey = 'adomiapp_tengo_dato_token';

  constructor(private http: HttpClient, private auth: AuthService) {}

  listPublished(limit = 12): Observable<ClientTengoDatosPublishedResponse> {
    const token = String(
      this.auth.getAccessToken() ||
      localStorage.getItem('adomi_access_token') ||
      sessionStorage.getItem('adomi_access_token') ||
      ''
    ).trim();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<ClientTengoDatosPublishedResponse>(
      `${this.apiUrl}/client/tengo-datos/published`,
      { headers, params }
    );
  }

  listFromFeedActivity(limit = 30): Observable<TengoDatoFeedActivityResponse> {
    const params = new HttpParams().set('limit', String(limit));
    const tengoDatoToken = localStorage.getItem(this.tengoDatoTokenKey) || '';
    const options = tengoDatoToken
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${tengoDatoToken}` }), params }
      : { params };

    return this.http.get<TengoDatoFeedActivityResponse>(
      `${this.apiUrl}/v1/feed/activity`,
      options
    );
  }

  applyToFeedEvent(feedEventId: number, message: string): Observable<{ success: boolean; data?: any; error?: string }> {
    const eventId = Number(feedEventId || 0);
    const text = String(message || '').trim();
    const tengoDatoToken = localStorage.getItem(this.tengoDatoTokenKey) || '';
    const adomiToken = String(
      this.auth.getAccessToken() ||
      localStorage.getItem('adomi_access_token') ||
      sessionStorage.getItem('adomi_access_token') ||
      ''
    ).trim();
    // Prioridad: token de AdomiApp (provider login real).
    // Fallback: token de Tengo Dato landing, si existe.
    const authToken = String(adomiToken || tengoDatoToken || '').trim();

    if (!eventId || !text || !authToken) {
      throw new Error('missing_application_requirements');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<{ success: boolean; data?: any; error?: string }>(
      `${this.apiUrl}/v1/feed/${eventId}/applications`,
      { message: text },
      { headers }
    );
  }

  closePublishedFeedEvent(feedEventId: number): Observable<{ success: boolean; data?: any; error?: string }> {
    const eventId = Number(feedEventId || 0);
    const token = String(
      this.auth.getAccessToken() ||
      localStorage.getItem('adomi_access_token') ||
      sessionStorage.getItem('adomi_access_token') ||
      ''
    ).trim();

    if (!eventId || !token) {
      throw new Error('missing_close_requirements');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<{ success: boolean; data?: any; error?: string }>(
      `${this.apiUrl}/client/tengo-datos/${eventId}/close`,
      {},
      { headers }
    );
  }
}

