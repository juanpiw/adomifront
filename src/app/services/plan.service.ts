import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlanInfo {
  id: number;
  name: string;
  expires_at: string | null;
  is_expired: boolean;
  days_remaining: number | null;
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
  private planInfoSubject = new BehaviorSubject<PlanInfo | null>(null);
  public planInfo$ = this.planInfoSubject.asObservable();

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
}

