import { Injectable, signal, inject } from '@angular/core';
import { AuthService, AuthUser } from './auth.service';

const STORAGE_KEY = 'adomi:user';
const ONBOARDING_KEY = 'adomi:onboarding_completed';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private authService = inject(AuthService);
  private userSig = signal<AuthUser | null>(this.read());

  user = this.userSig.asReadonly();

  constructor() {
    // Suscribirse a los cambios del AuthService
    this.authService.authState$.subscribe(user => {
      this.userSig.set(user);
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  setUser(user: AuthUser | null) {
    this.userSig.set(user);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.setUser(null);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Limpiar datos localmente aunque falle el logout en el servidor
        this.setUser(null);
      }
    });
  }

  getCurrentUser(): AuthUser | null {
    return this.authService.getCurrentUser();
  }

  getUser(): AuthUser | null {
    return this.authService.getCurrentUser();
  }

  setOnboardingCompleted(completed: boolean) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (completed) {
        localStorage.setItem(ONBOARDING_KEY, 'true');
      } else {
        localStorage.removeItem(ONBOARDING_KEY);
      }
    }
  }

  isOnboardingCompleted(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }

  // Obtener plan activo del usuario
  getActivePlanId(): number | null {
    const user = this.getCurrentUser();
    return user?.active_plan_id || null;
  }

  // Verificar si tiene plan premium (plan_id > 1)
  hasPremiumAccess(): boolean {
    const planId = this.getActivePlanId();
    return planId ? planId > 1 : false;
  }

  // Verificar si es fundador (plan_id = 3 o mayor)
  isFounder(): boolean {
    const planId = this.getActivePlanId();
    return planId ? planId >= 3 : false;
  }

  // Obtener estado de suscripción basado en plan_id
  getSubscriptionStatus(): 'basic' | 'premium' | 'founder' | null {
    const planId = this.getActivePlanId();
    if (!planId) return null;
    
    if (planId === 1) return 'basic';
    if (planId === 2) return 'premium';
    if (planId >= 3) return 'founder';
    
    return 'basic';
  }

  // Verificar si es proveedor
  isProvider(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'provider';
  }

  // Verificar si es cliente
  isClient(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'client';
  }

  isIdentityVerified(): boolean {
    return !!this.getCurrentUser()?.is_verified;
  }

  getVerificationStatus(): AuthUser['verification_status'] {
    return this.getCurrentUser()?.verification_status || 'none';
  }

  // Obtener información completa del usuario
  getUserInfo(): AuthUser | null {
    return this.getCurrentUser();
  }

  // Verificar si el token está próximo a expirar
  isTokenNearExpiry(): boolean {
    return this.authService.isTokenNearExpiry();
  }

  // Auto-refresh del token
  autoRefreshToken() {
    return this.authService.autoRefreshToken();
  }

  // Obtener loading state
  isLoading(): boolean {
    return this.authService.loading$.pipe().subscribe().closed;
  }

  // Obtener access token
  getAccessToken(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('adomi_access_token');
  }

  // Obtener refresh token
  getRefreshToken(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('adomi_refresh_token');
  }

  // Establecer access token
  setAccessToken(token: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('adomi_access_token', token);
    }
  }

  // Establecer refresh token
  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('adomi_refresh_token', token);
    }
  }

  // Limpiar sesión completa
  clearSession(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('adomi_access_token');
      localStorage.removeItem('adomi_refresh_token');
      localStorage.removeItem(STORAGE_KEY);
    }
    this.userSig.set(null);
  }

  private read(): AuthUser | null {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}