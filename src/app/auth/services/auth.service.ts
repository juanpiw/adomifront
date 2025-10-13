import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

// Interfaces actualizadas para JWT
export interface RegisterPayload { 
  email: string; 
  password: string; 
  role?: 'client'|'provider'; 
  name?: string 
}

export interface LoginPayload { 
  email: string; 
  password: string 
}

export interface AuthUser {
  id: number;
  email: string;
  role: 'client' | 'provider';
  name: string | null;
  active_plan_id?: number;
  profile_photo_url?: string | null;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiBaseUrl;
  
  // Subject para manejar el estado de autenticación
  private authStateSubject = new BehaviorSubject<AuthUser | null>(null);
  public authState$ = this.authStateSubject.asObservable();
  
  // Subject para manejar el estado de loading
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    // Cargar usuario desde localStorage al inicializar
    this.loadUserFromStorage();
  }

  // Obtener headers con token de autorización
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // Obtener token de acceso desde localStorage
  getAccessToken(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('adomi_access_token');
  }

  // Obtener refresh token desde localStorage
  getRefreshToken(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('adomi_refresh_token');
  }

  // Guardar tokens en localStorage
  private saveTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('adomi_access_token', accessToken);
      localStorage.setItem('adomi_refresh_token', refreshToken);
    }
  }

  // Limpiar tokens del localStorage
  private clearTokens(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('adomi_access_token');
      localStorage.removeItem('adomi_refresh_token');
    }
  }

  // Cargar usuario desde localStorage
  private loadUserFromStorage(): void {
    console.log('[AUTH] 🔄 loadUserFromStorage iniciado');
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('[AUTH] ⚠️ No estamos en el navegador, saltando carga');
      return;
    }
    
    const userStr = localStorage.getItem('adomi_user');
    console.log('[AUTH] 📦 Usuario en localStorage:', userStr);
    
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        const user = JSON.parse(userStr);
        console.log('[AUTH] ✅ Usuario parseado correctamente:', user);
        this.authStateSubject.next(user);
        console.log('[AUTH] ✅ Estado de autenticación actualizado');
        return;
      } catch (error) {
        console.error('[AUTH] ❌ Error parsing user from localStorage:', error);
        // No eliminar tokens; solo limpiar el usuario y rehidratar desde /auth/me si hay token
        localStorage.removeItem('adomi_user');
      }
    } else {
      console.log('[AUTH] ⚠️ No hay usuario válido en localStorage');
    }

    // Si no hay usuario pero sí token, intentar rehidratar desde el backend
    const token = this.getAccessToken();
    console.log('[AUTH] 🔑 Token disponible para rehidratación:', token ? 'sí' : 'no');
    if (token) {
      console.log('[AUTH] 🔄 Rehidratando usuario desde backend...');
      this.getCurrentUserInfo().subscribe({
        next: (response) => {
          console.log('[AUTH] ✅ Usuario rehidratado desde backend:', response);
        },
        error: (error) => {
          console.error('[AUTH] ❌ Error rehidratando usuario:', error);
        }
      });
    }
  }

  // Limpiar todos los datos del usuario
  private clearUserData(): void {
    this.clearTokens();
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('adomi_user');
      localStorage.removeItem('adomi_user_avatar');
    }
    this.authStateSubject.next(null);
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.authStateSubject.value;
    return !!(token && user);
  }

  // Obtener usuario actual
  getCurrentUser(): AuthUser | null {
    const user = this.authStateSubject.value;
    console.log('[AUTH] 👤 getCurrentUser llamado, usuario actual:', user);
    return user;
  }

  // Registro de usuario
  register(payload: RegisterPayload): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload)
      .pipe(
        tap(response => {
          if (response.success && response.user && response.accessToken && response.refreshToken) {
            // Guardar usuario y tokens
            this.authStateSubject.next(response.user);
            this.saveTokens(response.accessToken, response.refreshToken);
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
              localStorage.setItem('adomi_user', JSON.stringify(response.user));
            }
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  // Login de usuario
  login(payload: LoginPayload): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, payload)
      .pipe(
        tap(response => {
          if (response.success && response.user && response.accessToken && response.refreshToken) {
            // Guardar usuario y tokens
            this.authStateSubject.next(response.user);
            this.saveTokens(response.accessToken, response.refreshToken);
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
              localStorage.setItem('adomi_user', JSON.stringify(response.user));
            }
          }
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  // Renovar access token
  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshTokenResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.success && response.accessToken && response.refreshToken) {
            this.saveTokens(response.accessToken, response.refreshToken);
          }
        }),
        catchError(error => {
          // Si el refresh falla, limpiar datos y redirigir al login
          this.logout();
          return this.handleError(error);
        })
      );
  }

  // Método para el interceptor (sin limpiar datos automáticamente)
  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken });
  }

  // Logout
  logout(): Observable<LogoutResponse> {
    const refreshToken = this.getRefreshToken();
    
    // Limpiar datos localmente primero
    this.clearUserData();
    
    if (refreshToken) {
      return this.http.post<LogoutResponse>(`${this.baseUrl}/auth/logout`, { refreshToken })
        .pipe(
          catchError(error => {
            // Aunque falle el logout en el servidor, ya limpiamos localmente
            console.warn('Logout request failed:', error);
            return throwError(() => error);
          })
        );
    }
    
    return new Observable(observer => {
      observer.next({ success: true, message: 'Logged out successfully' });
      observer.complete();
    });
  }

  // Logout de todas las sesiones
  logoutAll(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.baseUrl}/auth/logout-all`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.clearUserData();
      }),
      catchError(error => {
        this.clearUserData();
        return this.handleError(error);
      })
    );
  }

  // Obtener información del usuario actual
  getCurrentUserInfo(): Observable<{ success: boolean; user: AuthUser }> {
    console.log('[AUTH] getCurrentUserInfo llamado');
    const token = this.getAccessToken();
    console.log('[AUTH] Token disponible:', token ? 'sí' : 'no');
    return this.http.get<{ success: boolean; user: AuthUser }>(`${this.baseUrl}/auth/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('[AUTH] Respuesta de /auth/me:', response);
        if (response.success) {
          // El backend retorna {success: true, data: {user: {...}}}
          const user = (response as any).data?.user || (response as any).user || response.user;
          console.log('[AUTH] Usuario hidratado:', user);
          if (user) {
            this.authStateSubject.next(user);
            localStorage.setItem('adomi_user', JSON.stringify(user));
          } else {
            console.error('[AUTH] No se pudo extraer usuario de la respuesta');
          }
        }
      }),
      catchError(error => {
        console.error('[AUTH] Error en getCurrentUserInfo:', error);
        return this.handleError(error);
      })
    );
  }

  // Recuperación de contraseña
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<ForgotPasswordResponse>(`${this.baseUrl}/auth/forgot-password`, { email })
      .pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  // Restablecer contraseña
  resetPassword(token: string, password: string): Observable<ResetPasswordResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<ResetPasswordResponse>(`${this.baseUrl}/auth/reset-password`, { token, password })
      .pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  // Manejo de errores
  private handleError(error: any): Observable<never> {
    console.error('AuthService Error:', error);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  // Verificar si el token está próximo a expirar
  isTokenNearExpiry(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      const fiveMinutes = 5 * 60;
      
      return timeUntilExpiry <= fiveMinutes;
    } catch (error) {
      return true;
    }
  }

  // Auto-refresh token si está próximo a expirar
  autoRefreshToken(): Observable<boolean> {
    if (this.isTokenNearExpiry()) {
      return this.refreshAccessToken().pipe(
        map(() => true),
        catchError(() => {
          this.logout();
          return throwError(() => new Error('Token refresh failed'));
        })
      );
    }
    
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  // Redirigir al login con motivo opcional
  redirectToLogin(reason?: 'expired' | 'forbidden' | 'other'): void {
    const query = reason === 'expired' ? { expired: '1' } : reason ? { reason } : undefined;
    if (query) {
      this.router.navigate(['/auth/login'], { queryParams: query });
    } else {
      this.router.navigateByUrl('/auth/login');
    }
  }
}