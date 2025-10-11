import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ProfileValidationResponse {
  success: boolean;
  isComplete: boolean;
  missingFields: string[];
  userType: 'client' | 'provider';
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileValidationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Subject para rastrear el estado del perfil
  private profileCompleteSubject = new BehaviorSubject<boolean | null>(null);
  public profileComplete$ = this.profileCompleteSubject.asObservable();

  /**
   * Valida si el perfil del usuario está completo
   */
  validateProfile(): Observable<ProfileValidationResponse> {
    console.log('[PROFILE_VALIDATION] validateProfile llamado');
    const token = this.getAccessToken();
    console.log('[PROFILE_VALIDATION] Token disponible:', token ? 'sí' : 'no');
    
    console.log('[PROFILE_VALIDATION] Haciendo GET a /profile/validate...');
    return this.http.get<ProfileValidationResponse>(`${this.apiUrl}/profile/validate`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(response => {
        console.log('[PROFILE_VALIDATION] Respuesta del backend:', response);
        this.profileCompleteSubject.next(response.isComplete);
      }),
      catchError(error => {
        console.error('[PROFILE_VALIDATION] Error:', error);
        this.profileCompleteSubject.next(false);
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

  /**
   * Marca el perfil como completo (después de guardar)
   */
  markProfileAsComplete(): void {
    this.profileCompleteSubject.next(true);
  }

  /**
   * Verifica si el perfil está completo (desde el subject)
   */
  isProfileComplete(): boolean | null {
    return this.profileCompleteSubject.value;
  }
}

