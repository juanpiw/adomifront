import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface NotificationPreferencesResponse {
  success: boolean;
  preferences: {
    pushNotifications: boolean;
    promotionalEmails: boolean;
  };
  error?: string;
}

export interface UpdateNotificationPreferencesResponse extends NotificationPreferencesResponse {}

@Injectable({ providedIn: 'root' })
export class ClientSettingsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = environment.apiBaseUrl;

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getNotificationPreferences(): Observable<NotificationPreferencesResponse> {
    return this.http
      .get<NotificationPreferencesResponse>(`${this.baseUrl}/client/notification-preferences`, {
        headers: this.headers()
      })
      .pipe(catchError(error => this.handleError(error)));
  }

  updateNotificationPreferences(payload: {
    pushNotifications?: boolean;
    promotionalEmails?: boolean;
  }): Observable<UpdateNotificationPreferencesResponse> {
    return this.http
      .put<UpdateNotificationPreferencesResponse>(`${this.baseUrl}/client/notification-preferences`, payload, {
        headers: this.headers()
      })
      .pipe(catchError(error => this.handleError(error)));
  }

  private handleError(error: any) {
    const message =
      error?.error?.error ||
      error?.error?.message ||
      error?.message ||
      'Error inesperado al comunicarse con el servidor';
    return throwError(() => ({ ...error, message }));
  }
}





