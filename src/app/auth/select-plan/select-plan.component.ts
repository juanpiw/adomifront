import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

interface Plan {
  id: number;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  max_services: number;
  max_bookings: number;
  // id de origen cuando derivamos (mensual <-> anual)
  sourceId?: number;
  isPromo?: boolean;
  promoCode?: string;
  duration_months?: number;
  commission_rate?: number;
}

interface TempUserData {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'provider';
}

interface PromoValidationResponse {
  ok: boolean;
  plan?: Plan;
  promo?: {
    code: string;
    label?: string;
    message?: string;
    expires_at?: string;
    max_duration_months?: number;
    remaining_spots?: number;
  };
  error?: string;
}

@Component({
  selector: 'app-select-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-plan.component.html',
  styleUrls: ['./select-plan.component.scss']
})
export class SelectPlanComponent implements OnInit {
  plans: Plan[] = [];
  selectedPlan: Plan | null = null;
  loading = true;
  error: string | null = null;
  tempUserData: TempUserData | null = null;
  
  // Billing toggle
  isAnnualBilling = true; // Por defecto anual
  monthlyPlans: Plan[] = [];
  annualPlans: Plan[] = [];

  // Promo / Fundador state
  promoCode: string = '';
  promoLoading = false;
  promoError: string | null = null;
  promoSuccess: string | null = null;
  promoPlan: Plan | null = null;
  promoMeta: PromoValidationResponse['promo'] | null = null;
  promoActivating = false;
  accountSwitchInProgress = false;
  founderFeatures: string[] = [
    '3 meses sin comisión de plataforma',
    'Prioridad en búsquedas locales',
    'Soporte directo del equipo Adomi',
    'Acceso a nuevas funciones beta'
  ];
  private readonly founderDefaults = {
    services: 10,
    bookings: 50
  };

  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    console.log('[SELECT_PLAN] Init');
    // Verificar que hay datos temporales del usuario
    const tempData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('tempUserData') : null;
    if (!tempData) {
      console.warn('[SELECT_PLAN] tempUserData no encontrado. Intentando reconstruir desde localStorage.adomi_user');
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
        if (raw) {
          const u = JSON.parse(raw);
          const intendedProvider = u?.intendedRole === 'provider' || u?.pending_role === 'provider';
          if (intendedProvider) {
            this.tempUserData = {
              name: u?.name || (u?.email ? String(u.email).split('@')[0] : ''),
              email: u?.email || '',
              password: '',
              role: 'provider'
            } as any;
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('tempUserData', JSON.stringify(this.tempUserData));
            }
            console.log('[SELECT_PLAN] Reconstruido tempUserData desde adomi_user:', this.tempUserData);
          }
        }
      } catch (e) {
        console.error('[SELECT_PLAN] Error reconstruyendo tempUserData:', e);
      }
      if (!this.tempUserData) {
        console.warn('[SELECT_PLAN] No fue posible reconstruir tempUserData. Redirigiendo a /auth/register');
        this.router.navigateByUrl('/auth/register');
        return;
      }
    } else {
      try {
        this.tempUserData = JSON.parse(tempData);
        console.log('[SELECT_PLAN] tempUserData:', this.tempUserData);
      } catch (e) {
        console.error('[SELECT_PLAN] Error parseando tempUserData:', e);
      }
    }
    
    // ✅ VALIDACIÓN CRÍTICA: Solo proveedores pueden acceder a planes
    if (this.tempUserData?.role !== 'provider') {
      console.log('[SELECT_PLAN] Acceso denegado - rol no es provider:', this.tempUserData?.role);
      this.error = 'Los planes de pago están disponibles solo para profesionales.';
      this.loading = false;
      
      // Redirigir a registro después de 3 segundos
      setTimeout(() => {
        this.router.navigateByUrl('/auth/register');
      }, 3000);
      return;
    }
    
    this.loadPlans();
    this.trackFunnelEvent('view_plan', {
      billing: this.isAnnualBilling ? 'annual' : 'monthly'
    });

    const currentUser = this.authService.getCurrentUser();
    this.accountSwitchInProgress = !!(currentUser?.account_switch_in_progress || currentUser?.pending_role === 'provider');
  }

  loadPlans() {
    console.log('[SELECT_PLAN] Cargando planes...');
    this.http.get<{ ok: boolean; plans: Plan[] }>(`${environment.apiBaseUrl}/plans`)
      .subscribe({
        next: (response) => {
          console.log('[SELECT_PLAN] Planes recibidos:', response);
          this.plans = response.plans;
          this.separatePlansByInterval();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading plans:', error);
          this.error = 'Error al cargar los planes. Inténtalo nuevamente.';
          this.loading = false;
        }
      });
  }

  separatePlansByInterval() {
    console.log('[SELECT_PLAN] Separando planes por intervalo');
    this.annualPlans = this.plans.filter(plan => plan.interval === 'year');
    this.monthlyPlans = this.plans.filter(plan => plan.interval === 'month');
    
    // Si no hay planes mensuales, crear versiones mensuales de los anuales
    if (this.monthlyPlans.length === 0 && this.annualPlans.length > 0) {
      this.monthlyPlans = this.annualPlans.map(plan => ({
        ...plan,
        id: plan.id, // mantener mismo id para que el backend encuentre el plan
        sourceId: plan.id,
        price: Math.round(plan.price / 12), // Precio mensual aproximado
        interval: 'month' as const
      }));
    }

    // Si no hay planes anuales, derivarlos multiplicando por 12 los mensuales
    if (this.annualPlans.length === 0 && this.monthlyPlans.length > 0) {
      this.annualPlans = this.monthlyPlans.map(plan => ({
        ...plan,
        id: plan.id, // mantener mismo id para que el backend encuentre el plan
        sourceId: plan.id,
        price: Math.round(plan.price * 12),
        interval: 'year' as const
      }));
    }
    console.log('[SELECT_PLAN] monthlyPlans:', this.monthlyPlans.length, 'annualPlans:', this.annualPlans.length);
  }

  selectPlan(plan: Plan) {
    if (this.isPromoActive()) {
      console.log('[SELECT_PLAN] Ignorando selección de plan porque hay promo activa');
      return;
    }
    console.log('[SELECT_PLAN] Plan seleccionado:', plan);
    this.selectedPlan = plan;
  }

  toggleBilling() {
    if (this.isPromoActive()) {
      console.log('[SELECT_PLAN] Toggle billing bloqueado porque hay promo activa');
      return;
    }
    console.log('[SELECT_PLAN] Toggle billing. Estado previo isAnnualBilling:', this.isAnnualBilling);
    this.isAnnualBilling = !this.isAnnualBilling;
    this.selectedPlan = null; // Limpiar selección al cambiar
    console.log('[SELECT_PLAN] Estado nuevo isAnnualBilling:', this.isAnnualBilling);
  }

  getCurrentPlans(): Plan[] {
    return this.isAnnualBilling ? this.annualPlans : this.monthlyPlans;
  }

  getBillingLabel(): string {
    return this.isAnnualBilling ? 'Anual' : 'Mensual';
  }

  getSavingsPercentage(): number {
    if (this.annualPlans.length === 0 || this.monthlyPlans.length === 0) return 0;
    
    // Calcular ahorro promedio
    let totalSavings = 0;
    for (let i = 0; i < this.annualPlans.length; i++) {
      const annual = this.annualPlans[i];
      const monthly = this.monthlyPlans[i];
      if (monthly) {
        const monthlyAnnual = monthly.price * 12;
        const savings = ((monthlyAnnual - annual.price) / monthlyAnnual) * 100;
        totalSavings += savings;
      }
    }
    return Math.round(totalSavings / this.annualPlans.length);
  }

  continueToPayment() {
    if (!this.selectedPlan || !this.tempUserData) {
      console.warn('[SELECT_PLAN] No hay selectedPlan o tempUserData. Abortando.');
      return;
    }

    console.log('[SELECT_PLAN] Continuar a pago con plan:', this.selectedPlan);
    // Guardar plan seleccionado temporalmente
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('selectedPlan', JSON.stringify(this.selectedPlan));
      if (this.isPromoActive() && this.promoMeta?.code) {
        sessionStorage.setItem('promoCode', this.promoMeta.code);
      } else {
        sessionStorage.removeItem('promoCode');
      }
      console.log('[SELECT_PLAN] selectedPlan guardado en sessionStorage');
    }
    
    // Redirigir a checkout
    console.log('[SELECT_PLAN] Navegando a /auth/checkout');
    this.router.navigateByUrl('/auth/checkout');
  }

  goBack() {
    this.router.navigateByUrl('/auth/register');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  }

  isPlanRecommended(plan: Plan): boolean {
    return plan.name.toLowerCase().includes('premium');
  }

  // Promo helpers
  get promoDisabled(): boolean {
    return this.promoLoading;
  }

  isPromoActive(): boolean {
    return !!this.promoPlan && !!this.promoMeta && !!this.selectedPlan?.isPromo;
  }

  get founderServicesLimitLabel(): string {
    const maxServices = this.promoPlan?.max_services ?? this.founderDefaults.services;
    if (!maxServices || maxServices === 999) return 'Ilimitados';
    return `${maxServices}`;
  }

  get founderBookingsLimitLabel(): string {
    const maxBookings = this.promoPlan?.max_bookings ?? this.founderDefaults.bookings;
    if (!maxBookings || maxBookings === 9999) return 'Ilimitadas';
    return `${maxBookings}/mes`;
  }

  private trackFunnelEvent(event: string, metadata?: Record<string, any>) {
    try {
      const payload: any = {
        event,
        email: this.tempUserData?.email || null,
        promoCode: this.promoMeta?.code || (this.promoCode ? this.promoCode.toUpperCase() : null),
        metadata
      };
      this.http.post(`${environment.apiBaseUrl}/subscriptions/funnel/event`, payload).subscribe({
        error: (err) => console.warn('[SELECT_PLAN] No se pudo registrar evento de funnel', err)
      });
    } catch (err) {
      console.warn('[SELECT_PLAN] Error interno trackFunnelEvent', err);
    }
  }

  async applyPromoCode() {
    const trimmed = this.promoCode.trim();
    if (!trimmed) {
      this.promoError = 'Ingresa un código válido';
      return;
    }

    this.promoLoading = true;
    this.promoError = null;
    this.promoSuccess = null;

    this.http.post<PromoValidationResponse>(`${environment.apiBaseUrl}/plans/validate-code`, {
      code: trimmed,
      billing: this.isAnnualBilling ? 'year' : 'month'
    }).subscribe({
      next: (response) => {
        if (response.ok && response.plan && response.promo) {
          this.promoPlan = {
            ...response.plan,
            isPromo: true,
            promoCode: response.promo.code,
            price: 0,
            interval: 'month',
            features: response.plan.features || []
          };
          this.promoMeta = response.promo;
          this.selectedPlan = this.promoPlan;
          this.promoSuccess = 'Código validado. Activando Plan Fundador...';
          this.promoError = null;
          console.log('[SELECT_PLAN] Promo aplicada:', this.promoMeta, this.promoPlan);
          this.trackFunnelEvent('promo_validated', {
            duration_months: response.plan.duration_months || null,
            max_services: response.plan.max_services,
            max_bookings: response.plan.max_bookings
          });
          this.activatePromoPlan();
        } else {
          this.promoError = response.error || 'No pudimos validar este código. Verifica e intenta nuevamente.';
          this.resetPromoState();
        }
        this.promoLoading = false;
      },
      error: (error) => {
        console.error('[SELECT_PLAN] Error validando código promo:', error);
        const message = error?.error?.error || error?.error?.message || error?.message;
        this.promoError = message || 'No pudimos validar este código. Verifica e intenta nuevamente.';
        this.resetPromoState();
        this.promoLoading = false;
      }
    });
  }

  clearPromo() {
    this.promoCode = '';
    this.promoLoading = false;
    this.promoError = null;
    this.promoSuccess = null;
    this.promoMeta = null;
    this.promoPlan = null;
    this.promoActivating = false;
    if (this.selectedPlan?.isPromo) {
      this.selectedPlan = null;
    }
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('promoCode');
    }
  }

  private resetPromoState() {
    this.promoPlan = null;
    this.promoMeta = null;
    this.promoActivating = false;
    if (this.selectedPlan?.isPromo) {
      this.selectedPlan = null;
    }
  }

  private activatePromoPlan() {
    if (!this.promoPlan?.promoCode) {
      console.warn('[SELECT_PLAN] No promoCode para activar plan');
      return;
    }

    const token = this.authService.getAccessToken();
    const currentUser = this.authService.getCurrentUser();
    const providerId = currentUser?.id;

    if (!token || !providerId) {
      console.warn('[SELECT_PLAN] No token o providerId disponible, manteniendo flujo manual');
      this.promoSuccess = 'Código aplicado. Inicia sesión nuevamente para activarlo.';
      return;
    }

    this.promoActivating = true;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.post(`${environment.apiBaseUrl}/subscriptions/promo/apply`, {
      providerId,
      code: this.promoPlan.promoCode
    }, { headers }).subscribe({
      next: async (response: any) => {
        if (response?.ok) {
          this.promoSuccess = 'Plan Fundador activado. Te estamos llevando a tu panel...';
          this.promoError = null;
          try {
            await this.authService.getCurrentUserInfo().toPromise();
          } catch (err) {
            console.warn('[SELECT_PLAN] No se pudo refrescar /auth/me tras aplicar promo', err);
          }
          setTimeout(() => {
            this.router.navigateByUrl('/dash/home');
          }, 600);
        } else {
          this.promoError = response?.error || 'No pudimos activar tu Plan Fundador. Intenta nuevamente.';
          this.promoSuccess = null;
        }
        this.promoActivating = false;
      },
      error: (error) => {
        console.error('[SELECT_PLAN] Error activando promo inmediatamente:', error);
        const message = error?.error?.error || error?.message || 'No pudimos activar tu Plan Fundador. Intenta nuevamente.';
        this.promoError = message;
        this.promoSuccess = null;
        this.promoActivating = false;
      }
    });
  }
}
