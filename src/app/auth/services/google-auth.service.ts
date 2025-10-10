import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, AuthResponse } from './auth.service';

export interface GoogleAuthResponse {
  success: boolean;
  authUrl?: string;
  message?: string;
  error?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiBaseUrl;

  // Subject para manejar el estado de autenticación con Google
  private googleAuthStateSubject = new BehaviorSubject<boolean>(false);
  public googleAuthState$ = this.googleAuthStateSubject.asObservable();

  constructor() {
    // Verificar si hay un token de Google en localStorage al inicializar
    this.checkGoogleAuthState();
  }

  /**
   * Inicializar autenticación con Google
   * @param role Rol del usuario (client o provider)
   * @param mode Modo de autenticación (login o register)
   * @returns Observable con la URL de autorización
   */
  initializeGoogleAuth(role: 'client' | 'provider' = 'client', mode: 'login' | 'register' = 'login'): Observable<GoogleAuthResponse> {
    console.log('[GOOGLE_AUTH] Inicializando autenticación con Google para rol:', role, 'modo:', mode);
    
    return this.http.post<GoogleAuthResponse>(`${this.apiUrl}/auth/google`, { role, mode });
  }

  /**
   * Redirigir a Google para autenticación
   * @param role Rol del usuario
   * @param mode Modo de autenticación (login o register)
   */
  signInWithGoogle(role: 'client' | 'provider' = 'client', mode: 'login' | 'register' = 'login'): void {
    console.log('[GOOGLE_AUTH] Iniciando proceso con Google - Modo:', mode);
    
    this.initializeGoogleAuth(role, mode).subscribe({
      next: (response) => {
        if (response.success && response.authUrl) {
          console.log('[GOOGLE_AUTH] Redirigiendo a Google:', response.authUrl);
          // Redirigir a la URL de autorización de Google
          if (typeof window !== 'undefined') {
            window.location.href = response.authUrl;
          }
        } else {
          console.error('[GOOGLE_AUTH] Error al obtener URL de autorización:', response.error);
          this.handleGoogleError(response.error || 'Error al iniciar autenticación con Google');
        }
      },
      error: (error) => {
        console.error('[GOOGLE_AUTH] Error en la solicitud:', error);
        this.handleGoogleError('Error de conexión al iniciar autenticación con Google');
      }
    });
  }

  /**
   * Manejar el callback de Google (llamado desde la página de callback)
   * @param url URL completa con los parámetros de callback
   */
  handleGoogleCallback(url: string): void {
    console.log('[GOOGLE_AUTH] Procesando callback de Google');
    
    try {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      const refresh = urlObj.searchParams.get('refresh');
      const userParam = urlObj.searchParams.get('user');
      const error = urlObj.searchParams.get('error');

      if (error) {
        console.error('[GOOGLE_AUTH] Error en callback:', error);
        this.handleGoogleError('Error en la autenticación con Google: ' + error);
        return;
      }

      if (token && refresh && userParam) {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('[GOOGLE_AUTH] Usuario autenticado:', user);

        // Guardar tokens y usuario usando el SessionService
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem('adomi_access_token', token);
          localStorage.setItem('adomi_refresh_token', refresh);
          localStorage.setItem('adomi_user', JSON.stringify(user));
        }
        this.googleAuthStateSubject.next(true);

        // Redirigir al dashboard correspondiente
        this.redirectToDashboard(user.role);
      } else {
        console.error('[GOOGLE_AUTH] Parámetros faltantes en callback');
        this.handleGoogleError('Parámetros de autenticación incompletos');
      }
    } catch (error) {
      console.error('[GOOGLE_AUTH] Error al procesar callback:', error);
      this.handleGoogleError('Error al procesar la respuesta de Google');
    }
  }

  /**
   * Verificar token de Google directamente (para uso con Google Identity Services)
   * @param idToken Token de ID de Google
   * @param role Rol del usuario
   * @returns Observable con la respuesta de autenticación
   */
  verifyGoogleToken(idToken: string, role: 'client' | 'provider' = 'client'): Observable<AuthResponse> {
    console.log('[GOOGLE_AUTH] Verificando token de Google');
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/google/verify`, {
      idToken,
      role
    });
  }

  /**
   * Desvincular cuenta de Google
   * @returns Observable con la respuesta
   */
  unlinkGoogleAccount(): Observable<{ success: boolean; message?: string; error?: string }> {
    console.log('[GOOGLE_AUTH] Desvinculando cuenta de Google');
    
    return this.http.post<{ success: boolean; message?: string; error?: string }>(`${this.apiUrl}/auth/google/unlink`, {});
  }

  /**
   * Obtener información del usuario de Google desde el token
   * @param idToken Token de ID de Google
   * @returns Información del usuario
   */
  getGoogleUserInfo(idToken: string): GoogleUser | null {
    try {
      // Decodificar el JWT de Google (solo para obtener información básica)
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } catch (error) {
      console.error('[GOOGLE_AUTH] Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene cuenta vinculada con Google
   * @returns true si está vinculado
   */
  isGoogleAccountLinked(): boolean {
    // Esta información debería venir del backend en el perfil del usuario
    // Por ahora retornamos false, se puede implementar después
    return false;
  }

  /**
   * Redirigir al dashboard correspondiente según el rol
   * @param role Rol del usuario
   */
  private redirectToDashboard(role: string): void {
    console.log('[GOOGLE_AUTH] Redirigiendo al dashboard para rol:', role);
    
    if (typeof window !== 'undefined') {
      if (role === 'provider') {
        window.location.href = '/dash/home';
      } else {
        window.location.href = '/client/reservas';
      }
    }
  }

  /**
   * Manejar errores de Google Auth
   * @param error Mensaje de error
   */
  private handleGoogleError(error: string): void {
    console.error('[GOOGLE_AUTH] Error:', error);
    this.googleAuthStateSubject.next(false);
    
    // Aquí puedes implementar notificaciones de error
    // Por ejemplo, usando un servicio de notificaciones
    alert('Error en autenticación con Google: ' + error);
  }

  /**
   * Verificar el estado de autenticación con Google
   */
  private checkGoogleAuthState(): void {
    // Verificar si hay tokens de Google en localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const googleToken = localStorage.getItem('google_access_token');
      this.googleAuthStateSubject.next(!!googleToken);
    }
  }

  /**
   * Limpiar estado de autenticación con Google
   */
  clearGoogleAuthState(): void {
    console.log('[GOOGLE_AUTH] Limpiando estado de autenticación');
    this.googleAuthStateSubject.next(false);
    
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_refresh_token');
    }
  }

  /**
   * Obtener URL de callback de Google
   * @returns URL de callback
   */
  getCallbackUrl(): string {
    return environment.googleRedirectUri;
  }

  /**
   * Verificar si Google Auth está disponible
   * @returns true si está disponible
   */
  isGoogleAuthAvailable(): boolean {
    return !!(environment.googleClientId && environment.googleRedirectUri);
  }
}
