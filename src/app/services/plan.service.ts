import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface PlanInfo {
  id: number;
  name: string;
  current_period_start?: string | null;
  expires_at: string | null;
  is_expired: boolean;
  days_remaining: number | null;
  // Extended fields (optional for backwards compatibility)
  price?: number | null;
  currency?: string | null;
  billing_period?: 'month' | 'year' | string | null;
  commission_rate?: number | null;
  effective_commission_rate?: number | null;
  plan_key?: string | null;
  plan_type?: string | null;
  promo_expires_at?: string | null;
  founder_expires_at?: string | null;
  founder_discount_until?: string | null;
  founder_discount_active?: boolean;
}

export interface PlanExpirationResponse {
  ok: boolean;
  currentPlan?: PlanInfo;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private planInfoSubject = new BehaviorSubject<PlanInfo | null>(null);
  public planInfo$ = this.planInfoSubject.asObservable();

  private authHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  /**
   * Obtener información del plan actual del usuario
   */
  getCurrentPlan(userId: number): Observable<PlanExpirationResponse> {
    return this.http.get<PlanExpirationResponse>(`${environment.apiBaseUrl}/plan-expirations/user/${userId}/current`);
  }

  /**
   * Obtener planes que están por vencer
   */
  getExpiringSoon(days: number = 7): Observable<{ ok: boolean; expirations: any[] }> {
    return this.http.get<{ ok: boolean; expirations: any[] }>(`${environment.apiBaseUrl}/plan-expirations/expiring-soon?days=${days}`);
  }

  /**
   * Obtener planes expirados
   */
  getExpired(): Observable<{ ok: boolean; expirations: any[] }> {
    return this.http.get<{ ok: boolean; expirations: any[] }>(`${environment.apiBaseUrl}/plan-expirations/expired`);
  }

  /**
   * Actualizar información del plan en el servicio
   */
  updatePlanInfo(planInfo: PlanInfo | null): void {
    this.planInfoSubject.next(planInfo);
  }

  /**
   * Obtener información actual del plan
   */
  getCurrentPlanInfo(): PlanInfo | null {
    return this.planInfoSubject.value;
  }

  /**
   * Verificar si el plan está expirado
   */
  isPlanExpired(): boolean {
    const planInfo = this.getCurrentPlanInfo();
    return planInfo ? planInfo.is_expired : false;
  }

  /**
   * Obtener días restantes hasta expiración
   */
  getDaysUntilExpiration(): number | null {
    const planInfo = this.getCurrentPlanInfo();
    return planInfo ? planInfo.days_remaining : null;
  }

  /**
   * Verificar si debe mostrar alerta de actualización
   */
  shouldShowUpgradeAlert(): boolean {
    const planInfo = this.getCurrentPlanInfo();
    if (!planInfo) return false;

    // Mostrar si está expirado
    if (planInfo.is_expired) return true;

    // Mostrar si expira en 7 días o menos
    if (planInfo.days_remaining && planInfo.days_remaining <= 7) return true;

    return false;
  }

  /**
   * Calcular días restantes desde una fecha de expiración
   */
  calculateDaysRemaining(expiresAt: string): number {
    const now = new Date();
    const expirationDate = new Date(expiresAt);
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Formatear fecha de expiración
   */
  formatExpirationDate(expiresAt: string): string {
    const date = new Date(expiresAt);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  initiateTbkPlanPayment(planId: number): Observable<{ ok: boolean; token: string; url: string; paymentId?: number }> {
    return this.http.post<{ ok: boolean; token: string; url: string; paymentId?: number }>(
      `${environment.apiBaseUrl}/plans/tbk/init`,
      { planId },
      { headers: this.authHeaders() }
    );
  }

  commitTbkPlanPayment(token: string): Observable<{ ok: boolean; status: string; paymentId?: number; subscription?: any }> {
    return this.http.post<{ ok: boolean; status: string; paymentId?: number; subscription?: any }>(
      `${environment.apiBaseUrl}/plans/tbk/commit`,
      { token },
      { headers: this.authHeaders() }
    );
  }
}

