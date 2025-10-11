import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ProviderProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  provider_id: number;
  full_name: string;
  professional_title?: string;
  main_commune?: string;
  main_region?: string;
  years_experience?: number;
  bio?: string;
  profile_photo_url?: string | null;
  cover_photo_url?: string | null;
  profile_completion?: number;
  is_verified?: boolean;
  verification_status?: string;
  profile_views?: number;
  rating_average?: number;
  review_count?: number;
  completed_appointments?: number;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderProfileResponse {
  success: boolean;
  profile: ProviderProfile;
}

export interface UpdateProfilePayload {
  full_name?: string;
  professional_title?: string;
  main_commune?: string;
  main_region?: string;
  years_experience?: number;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  /**
   * Obtener perfil del provider autenticado
   */
  getProfile(): Observable<ProviderProfileResponse> {
    console.log('[PROVIDER_PROFILE] Obteniendo perfil...');
    const token = this.getAccessToken();
    
    return this.http.get<ProviderProfileResponse>(`${this.apiUrl}/provider/profile`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(response => {
        console.log('[PROVIDER_PROFILE] Perfil obtenido:', response);
      }),
      catchError(error => {
        console.error('[PROVIDER_PROFILE] Error obteniendo perfil:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar perfil del provider
   */
  updateProfile(data: UpdateProfilePayload): Observable<ProviderProfileResponse> {
    console.log('[PROVIDER_PROFILE] Actualizando perfil:', data);
    const token = this.getAccessToken();
    
    return this.http.put<ProviderProfileResponse>(`${this.apiUrl}/provider/profile`, data, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(response => {
        console.log('[PROVIDER_PROFILE] Perfil actualizado:', response);
      }),
      catchError(error => {
        console.error('[PROVIDER_PROFILE] Error actualizando perfil:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el token de acceso
   */
  private getAccessToken(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('adomi_access_token');
  }
}

