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
  tbk_secondary_code?: string | null;
  profile_photo_url?: string | null;
  pending_role?: 'client' | 'provider' | null;
  account_switch_in_progress?: boolean;
  account_switch_started_at?: string | null;
  account_switched_at?: string | null;
  account_switch_source?: string | null;
  is_verified?: boolean;
  verification_status?: 'none' | 'pending' | 'approved' | 'rejected' | string | null;
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
  private readonly debug = !environment.production;
  private tokenKey = 'adomi_access_token';
  private refreshKey = 'adomi_refresh_token';
  
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
    const token = this.readToken(this.tokenKey);
    if (!token) {
      return null;
    }
    return token;
  }

  // Obtener refresh token desde localStorage
  getRefreshToken(): string | null {
    const token = this.readToken(this.refreshKey);
    return token;
  }

  // Guardar tokens en localStorage
  private saveTokens(accessToken: string, refreshToken: string): void {
    const validAccess = accessToken && accessToken !== 'null' && accessToken !== 'undefined';
    const validRefresh = refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined';

    if (!validAccess || !validRefresh) {
      if (this.debug) {
        console.warn('[AUTH] 💾 saveTokens: tokens inválidos, no se guardan', {
          hasAccess: !!accessToken,
          hasRefresh: !!refreshToken
        });
      }
      return;
    }

    this.persistToken(this.tokenKey, accessToken);
    this.persistToken(this.refreshKey, refreshToken);
  }

  // Limpiar tokens del localStorage
  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage?.removeItem(this.tokenKey);
        localStorage?.removeItem(this.refreshKey);
        sessionStorage?.removeItem(this.tokenKey);
        sessionStorage?.removeItem(this.refreshKey);
      } catch {
        if (this.debug) {
          console.warn('[AUTH] 🧹 clearTokens: no storage disponible');
        }
      }
    }
  }

  // Cargar usuario desde localStorage
  private loadUserFromStorage(): void {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    const userStr = localStorage.getItem('adomi_user');
    
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        const user = JSON.parse(userStr);
        this.authStateSubject.next(user);
        return;
      } catch (error) {
        if (this.debug) {
          console.error('[AUTH] ❌ Error parsing user from localStorage:', error);
        }
        // No eliminar tokens; solo limpiar el usuario y rehidratar desde /auth/me si hay token
        localStorage.removeItem('adomi_user');
      }
    } else {
    }

    // Si no hay usuario pero sí token, intentar rehidratar desde el backend
    const token = this.getAccessToken();
    if (token) {
      this.getCurrentUserInfo().subscribe({
        next: (response) => {
        },
        error: (error) => {
          if (this.debug) {
            console.error('[AUTH] ❌ Error rehidratando usuario:', error);
          }
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

  // Lectura defensiva de tokens desde storage
  private readToken(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage?.getItem(key) || sessionStorage?.getItem(key);
      if (!raw || raw === 'null' || raw === 'undefined') return null;
      return raw;
    } catch {
      return null;
    }
  }

  /**
   * Rehidrata la sesión cuando los tokens llegan desde flujos externos (ej. TBK).
   */
  hydrateFromExternalTokens(accessToken?: string | null, refreshToken?: string | null, user?: AuthUser | null) {
    const validAccess = !!accessToken && accessToken !== 'null' && accessToken !== 'undefined';
    const validRefresh = !!refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined';

    if (validAccess && validRefresh) {
      this.saveTokens(accessToken as string, refreshToken as string);
    }

    if (user) {
      this.authStateSubject.next(user);
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem('adomi_user', JSON.stringify(user));
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  // Persistir token en localStorage + sessionStorage para evitar estados "null"
  private persistToken(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage?.setItem(key, value);
    } catch {}
    try {
      sessionStorage?.setItem(key, value);
    } catch {}
  }

  // Obtener usuario actual
  getCurrentUser(): AuthUser | null {
    const user = this.authStateSubject.value;
    return user;
  }

  switchAccountToProvider(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.baseUrl}/account/switch-to-provider`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        const current = this.authStateSubject.value;
        if (current) {
          const updated: AuthUser = {
            ...current,
            pending_role: 'provider',
            account_switch_in_progress: true,
            account_switch_started_at: new Date().toISOString()
          };
          this.authStateSubject.next(updated);
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('adomi_user', JSON.stringify(updated));
          }
        }
      })
    );
  }

  // Registro de usuario
  register(payload: RegisterPayload): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload)
      .pipe(
        tap(response => {
          const data: any = (response as any)?.data || response;
          if (response.success && data?.user && data?.accessToken && data?.refreshToken) {
            // Guardar usuario y tokens
            this.authStateSubject.next(data.user);
            this.saveTokens(data.accessToken, data.refreshToken);
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
              localStorage.setItem('adomi_user', JSON.stringify(data.user));
            }
          } else {
            if (this.debug) {
              console.warn('[AUTH] 🟠 register() faltan datos clave en la respuesta', {
                success: response.success,
                hasUser: !!data?.user,
                hasAccess: !!data?.accessToken,
                hasRefresh: !!data?.refreshToken
              });
            }
          }
          this.loadingSubject.next(false);
        }),
        map(response => this.normalizeAuthResponse(response)),
        catchError(error => {
          if (this.debug) {
            console.error('[AUTH] 🔴 register() catchError', error);
          }
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
          const data: any = (response as any)?.data || response;
          if (response.success && data?.user && data?.accessToken && data?.refreshToken) {
            // Guardar usuario y tokens
            this.authStateSubject.next(data.user);
            this.saveTokens(data.accessToken, data.refreshToken);
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
              localStorage.setItem('adomi_user', JSON.stringify(data.user));
            }
          } else {
            if (this.debug) {
              console.warn('[AUTH] 🟠 login() faltan datos clave en la respuesta', {
                success: response.success,
                hasUser: !!data?.user,
                hasAccess: !!data?.accessToken,
                hasRefresh: !!data?.refreshToken
              });
            }
          }
          this.loadingSubject.next(false);
        }),
        map(response => this.normalizeAuthResponse(response)),
        catchError(error => {
          if (this.debug) {
            console.error('[AUTH] 🔴 login() catchError', error);
          }
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  clearProviderSwitch(): void {
    const current = this.authStateSubject.value;
    if (!current) return;
    const updated: AuthUser = {
      ...current,
      pending_role: null,
      account_switch_in_progress: false,
      account_switch_started_at: null,
      account_switched_at: current.account_switched_at || null,
      account_switch_source: null
    };
    this.authStateSubject.next(updated);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('adomi_user', JSON.stringify(updated));
      }
    } catch {}
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

  /**
   * Actualiza el usuario en memoria y localStorage con datos frescos del backend
   * sin tocar tokens. Útil después de /auth/me o flujos externos.
   */
  applyUserFromBackend(user: AuthUser): void {
    if (!user) return;
    this.authStateSubject.next(user);
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('adomi_user', JSON.stringify(user));
      }
    } catch {}
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
            if (this.debug) {
              console.warn('Logout request failed:', error);
            }
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
    const token = this.getAccessToken();
    // Añadir parámetro de cache-busting para evitar 304 con payload obsoleto tras promoción
    const ts = Date.now().toString();
    return this.http.get<{ success: boolean; user: AuthUser }>(`${this.baseUrl}/auth/me`, {
      headers: this.getAuthHeaders(),
      params: { t: ts }
    }).pipe(
      tap(response => {
        if (response.success) {
          // El backend retorna {success: true, data: {user: {...}}}
          const user = (response as any).data?.user || (response as any).user || response.user;
          if (user) {
            this.authStateSubject.next(user);
            localStorage.setItem('adomi_user', JSON.stringify(user));
          } else {
            if (this.debug) {
              console.error('[AUTH] No se pudo extraer usuario de la respuesta');
            }
          }
        }
      }),
      catchError(error => {
        if (this.debug) {
          console.error('[AUTH] Error en getCurrentUserInfo:', error);
        }
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

  // Cambiar contraseña (usuario autenticado)
  changePassword(newPassword: string, currentPassword?: string): Observable<{ success: boolean; message?: string; error?: string }> {
    const payload: { newPassword: string; currentPassword?: string } = { newPassword };
    if (currentPassword) {
      payload.currentPassword = currentPassword;
    }

    return this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${this.baseUrl}/auth/change-password`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Manejo de errores
  private handleError(error: any): Observable<never> {
    // Mantener silencioso en prod para no spamear consola del usuario
    if (this.debug) {
      console.error('[AUTH] ❌ AuthService Error:', {
        status: error?.status,
        message: error?.message,
        errorBody: error?.error,
        url: error?.url
      });
    }
    
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

  private normalizeAuthResponse(response: any): AuthResponse {
    const data: any = response?.data ?? response;
    const normalized: AuthResponse = {
      success: response?.success ?? data?.success ?? false,
      user: data?.user,
      accessToken: data?.accessToken,
      refreshToken: data?.refreshToken,
      expiresIn: data?.expiresIn,
      error: response?.error ?? data?.error
    };
    return normalized;
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