import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ProfileValidationService } from './profile-validation.service';

export interface ClientProfile {
  client_id: number;
  full_name: string;
  phone: string;
  profile_photo_url?: string | null;
  address: string;
  commune: string;
  region: string;
  preferred_language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientProfileResponse {
  success: boolean;
  profile: ClientProfile;
  message?: string;
  error?: string;
}

export interface SaveClientProfilePayload {
  full_name: string;
  phone: string;
  profile_photo_url?: string | null;
  address: string;
  commune: string;
  region: string;
  preferred_language?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientProfileService {
  private http = inject(HttpClient);
  private profileValidation = inject(ProfileValidationService);
  private apiUrl = environment.apiBaseUrl;

  // Emisor para cambios en la foto de perfil
  private profilePhotoSubject = new BehaviorSubject<string | null>(null);
  public profilePhoto$ = this.profilePhotoSubject.asObservable();

  /**
   * Obtener perfil del cliente
   */
  getProfile(): Observable<ClientProfileResponse> {
    const token = this.getAccessToken();
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    
    return this.http.get<ClientProfileResponse>(`${this.apiUrl}/client/profile`, { headers });
  }

  /**
   * Guardar o actualizar perfil del cliente
   */
  saveProfile(payload: SaveClientProfilePayload): Observable<ClientProfileResponse> {
    const token = this.getAccessToken();
    
    console.log('[CLIENT_PROFILE_SERVICE] 💾 Guardando perfil:', payload);
    
    return this.http.post<ClientProfileResponse>(`${this.apiUrl}/client/profile`, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      })
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log('[CLIENT_PROFILE_SERVICE] ✅ Perfil guardado exitosamente');
          // Re-validar el perfil para actualizar el estado
          this.profileValidation.validateProfile().subscribe();
        }
      })
    );
  }

  /**
   * Subir foto de perfil
   */
  uploadProfilePhoto(file: File): Observable<{ success: boolean; photoUrl?: string; thumbnailUrl?: string; message?: string; error?: string }> {
    const token = this.getAccessToken();
    
    console.log('[CLIENT_PROFILE_SERVICE] 📸 Subiendo foto de perfil');
    
    const formData = new FormData();
    formData.append('profile_photo', file);
    
    return this.http.post<{ success: boolean; photoUrl?: string; thumbnailUrl?: string; message?: string; error?: string }>(
      `${this.apiUrl}/client/profile/photo`,
      formData,
      {
        headers: new HttpHeaders({
          ...(token ? { Authorization: `Bearer ${token}` } : {})
          // No incluir Content-Type para que Angular lo establezca automáticamente con boundary
        })
      }
    ).pipe(
      tap(response => {
        if (response.success) {
          console.log('[CLIENT_PROFILE_SERVICE] ✅ Foto subida exitosamente:', response.photoUrl);
          // Re-validar el perfil
          this.profileValidation.validateProfile().subscribe();
          // Notificar cambio de foto
          this.profilePhotoSubject.next(response.photoUrl || null);
        }
      })
    );
  }

  /**
   * Eliminar foto de perfil
   */
  deleteProfilePhoto(): Observable<{ success: boolean; message?: string; error?: string }> {
    const token = this.getAccessToken();
    
    console.log('[CLIENT_PROFILE_SERVICE] 🗑️ Eliminando foto de perfil');
    
    return this.http.delete<{ success: boolean; message?: string; error?: string }>(
      `${this.apiUrl}/client/profile/photo`,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        })
      }
    ).pipe(
      tap(res => {
        if (res.success) {
          this.profilePhotoSubject.next(null);
        }
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

