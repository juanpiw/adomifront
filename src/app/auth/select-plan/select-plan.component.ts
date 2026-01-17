import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService, AuthUser } from '../services/auth.service';
import { ensureTempUserData, needsProviderPlan } from '../utils/provider-onboarding.util';
import { firstValueFrom } from 'rxjs';

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
  metadata?: Record<string, any> | null;
  plan_type?: string;
  benefits?: string[];
  commission_rate?: number;
  // id de origen cuando derivamos (mensual <-> anual)
  sourceId?: number;
  isPromo?: boolean;
  promoCode?: string;
  duration_months?: number;
}

interface PlanFeatureRow {
  label: string;
  enabled: boolean;
  note?: string;
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
    metadata?: Record<string, any> | null;
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
  paymentMethod: 'stripe' | 'tbk' = 'stripe';
  readonly paymentMethods: Array<{
    id: 'stripe' | 'tbk';
    label: string;
    description: string;
    badge?: string;
  }> = [
    {
      id: 'stripe',
      label: 'Tarjeta de crédito / débito',
      description: 'Procesado por Stripe. Acepta tarjetas internacionales.',
      badge: 'Recomendado'
    },
    {
      id: 'tbk',
      label: 'Webpay Plus (Transbank)',
      description: 'Paga con tarjetas chilenas o RedCompra mediante Webpay.'
    }
  ];
  
  // Billing toggle
  isAnnualBilling = true; // Por defecto anual
  monthlyPlans: Plan[] = [];
  annualPlans: Plan[] = [];

  pendingActivation = false;

  // Promo / Fundador state
  promoCode: string = '';
  promoLoading = false;
  promoError: string | null = null;
  promoSuccess: string | null = null;
  promoPlan: Plan | null = null;
  promoMeta: PromoValidationResponse['promo'] | null = null;
  promoActivating = false;
  accountSwitchInProgress = false;
  requiresPlan = false;
  private autoPromoApplied = false;
  private fastActivating = false;
  private readonly founderDefaults = {
    services: 10,
    bookings: 50
  };

  // Fundador usa código promo (promoCode + applyPromoCode). No se solicita correo aquí.

  // Alias para reutilizar exactamente el HTML del pricing de Home
  get isAnnual(): boolean {
    return this.isAnnualBilling;
  }

  setBilling(isAnnual: boolean) {
    if (this.isPromoActive()) return;
    // Si el backend no trae uno de los intervalos, derivarlo en el front para que el toggle funcione.
    if (isAnnual && this.annualPlans.length === 0 && this.monthlyPlans.length > 0) {
      this.annualPlans = this.deriveAnnualPlansFromMonthly(this.monthlyPlans);
    }
    if (!isAnnual && this.monthlyPlans.length === 0 && this.annualPlans.length > 0) {
      this.monthlyPlans = this.deriveMonthlyPlansFromAnnual(this.annualPlans);
    }

    if (isAnnual && this.annualPlans.length === 0) {
      console.warn('[SELECT_PLAN] No hay planes anuales disponibles (ni derivables)');
      return;
    }
    if (!isAnnual && this.monthlyPlans.length === 0) {
      console.warn('[SELECT_PLAN] No hay planes mensuales disponibles (ni derivables)');
      return;
    }
    this.isAnnualBilling = isAnnual;
    this.selectedPlan = null;
  }

  get billingPeriodLabel(): string {
    return this.isAnnualBilling ? '/año' : '/mes';
  }

  get proPrice(): string {
    const p = this.getPlanForKey('pro');
    if (p) return this.formatAmount(p.price);
    return this.isAnnualBilling ? '290.000' : '29.000';
  }

  get scalePrice(): string {
    const p = this.getPlanForKey('scale');
    if (p) return this.formatAmount(p.price);
    return this.isAnnualBilling ? '890.000' : '89.000';
  }

  selectTier(key: 'starter' | 'pro' | 'scale') {
    // Intento 1: según billing actual
    let plan = this.getPlanForKey(key);

    // Fallback: si no existe en el intervalo actual, probar el otro intervalo y auto-cambiar el toggle
    if (!plan) {
      if (this.isAnnualBilling && this.monthlyPlans.length > 0) {
        this.isAnnualBilling = false;
        plan = this.getPlanForKey(key);
      } else if (!this.isAnnualBilling && this.annualPlans.length > 0) {
        this.isAnnualBilling = true;
        plan = this.getPlanForKey(key);
      }
    }

    if (!plan) {
      // Último recurso: si es starter, derivar plan gratuito por precio=0
      if (key === 'starter') {
        plan = {
          id: 1, // se corregirá en checkout/free-activate si es otro id
          name: 'Plan Starter',
          price: 0,
          currency: 'CLP',
          interval: this.isAnnualBilling ? 'year' as const : 'month' as const,
          description: '',
          features: [],
          max_services: 0,
          max_bookings: 0,
          metadata: { plan_key: 'starter' }
        } as Plan;
      } else {
        this.error = 'Plan no disponible por ahora. Intenta más tarde.';
        return;
      }
    }

    this.selectPlan(plan);

    // Flujo Starter: activar directo sin pasar por checkout
    if (key === 'starter') {
      void this.fastActivateStarter();
    }
  }

  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  ngOnInit() {
    // Nota: evitar logs en producción (y nunca loguear credenciales).
    this.route.queryParams.subscribe(params => {
      this.pendingActivation = String(params['status'] || '') === 'pending_activation';
    });
    // Importante:
    // - Este componente se usa tanto para onboarding (sin plan) como para "Cambiar plan" (con plan activo).
    // - Antes redirigía a /dash/home si detectaba active_plan_id, lo que bloqueaba a providers que querían cambiar de plan.
    const currentUserEarly = this.authService.getCurrentUser() || this.getLocalUser();
    if (currentUserEarly?.active_plan_id && currentUserEarly?.role !== 'provider' && currentUserEarly?.pending_role !== 'provider') {
      this.router.navigateByUrl(currentUserEarly?.role === 'client' ? '/client/reservas' : '/');
      return;
    }
    // Verificar datos temporales; permitir continuar si ya es provider logueado aunque falte tempUserData
    const tempData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('tempUserData') : null;
    if (tempData) {
      try {
        this.tempUserData = JSON.parse(tempData);
      } catch (e) {
        console.error('[SELECT_PLAN] Error parseando tempUserData:', e);
      }
    }

    if (!this.tempUserData) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.role === 'provider') {
        this.tempUserData = {
          name: currentUser.name || (currentUser.email ? String(currentUser.email).split('@')[0] : ''),
          email: currentUser.email || '',
          password: '',
          role: 'provider'
        } as any;
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('tempUserData', JSON.stringify(this.tempUserData));
          }
        } catch {}
      } else {
        console.warn('[SELECT_PLAN] tempUserData no encontrado. Intentando reconstruir desde localStorage.adomi_user');
        try {
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
          if (raw) {
            const u = JSON.parse(raw);
            const intendedProvider = u?.intendedRole === 'provider' || u?.pending_role === 'provider' || u?.role === 'provider';
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
            }
          }
        } catch (e) {
          console.error('[SELECT_PLAN] Error reconstruyendo tempUserData:', e);
        }
      }
      if (!this.tempUserData) {
        console.warn('[SELECT_PLAN] No fue posible reconstruir tempUserData. Redirigiendo a /auth/register');
        this.router.navigateByUrl('/auth/register');
        return;
      }
    }
    
    // ✅ VALIDACIÓN CRÍTICA: Solo proveedores pueden acceder a planes
    if (this.tempUserData?.role !== 'provider') {
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

    const currentUser = this.authService.getCurrentUser() || this.getLocalUser();
    this.accountSwitchInProgress = !!(currentUser?.account_switch_in_progress || currentUser?.pending_role === 'provider');
    this.requiresPlan = needsProviderPlan(currentUser);

    if (this.requiresPlan) {
      ensureTempUserData(currentUser || this.tempUserData || undefined);
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('providerOnboarding', '1');
        }
      } catch {}
    } else if (currentUser?.role === 'client' && !currentUser?.pending_role) {
      console.warn('[SELECT_PLAN] Usuario cliente sin onboarding activo. Redirigiendo a reservas.');
      this.router.navigateByUrl('/client/reservas');
      return;
    }
  }

  loadPlans() {
    this.http.get<{ ok: boolean; plans: Plan[] }>(`${environment.apiBaseUrl}/plans?scope=select_plan`)
      .subscribe({
        next: (response) => {
          // Fallback defensivo: aunque backend filtre, evitamos que planes legacy aparezcan
          const allowed = new Set(['starter', 'pro', 'scale']);
          const filtered = (response.plans || []).map(p => {
            const key =
              this.getPlanKey(p) ||
              ((String(p.plan_type || '').toLowerCase() === 'free' || Number(p.price || 0) <= 0) ? 'starter' : null);
            if (!key || !allowed.has(key)) return null;
            // Asegurar que el plan lleve plan_key para usos posteriores
            const meta = this.normalizePlanMetadata(p);
            const metadata = { ...meta, plan_key: key };
            return { ...p, metadata } as Plan;
          }).filter(Boolean) as Plan[];
          this.plans = filtered;
          this.separatePlansByInterval();
          this.tryAutoApplyPromoFromSession();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading plans:', error);
          this.error = 'Error al cargar los planes. Inténtalo nuevamente.';
          this.loading = false;
        }
      });
  }

  private tryAutoApplyPromoFromSession(): void {
    if (this.autoPromoApplied || this.promoLoading || this.isPromoActive()) return;
    try {
      if (typeof sessionStorage === 'undefined') return;
      const stored = String(sessionStorage.getItem('promoCode') || '').trim();
      if (!stored) return;
      this.promoCode = stored;
      this.autoPromoApplied = true;
      this.applyPromoCode();
    } catch {
      // ignore
    }
  }

  // ===== Pricing-v2 helpers (para mantener el mismo HTML que la landing) =====
  private getPlanKey(plan: Plan | null | undefined): 'starter' | 'pro' | 'scale' | null {
    if (!plan) return null;
    const meta: any = this.normalizePlanMetadata(plan);
    const raw = String(meta?.['plan_key'] || meta?.['planKey'] || '').trim().toLowerCase();
    if (raw === 'starter' || raw === 'pro' || raw === 'scale') return raw;

    // Fallback por nombre (cuando backend no trae metadata.plan_key)
    const name = String(plan.name || '').trim().toLowerCase();
    if (name.includes('starter') || name.includes('básico') || name.includes('basico') || name.includes('basic')) return 'starter';
    if (name.includes('scale')) return 'scale';
    // "pro mensual", "pro anual", etc.
    if (name.includes(' pro') || name.startsWith('pro') || name.includes('profesional')) return 'pro';
    return null;
  }

  getPlanForKey(key: 'starter' | 'pro' | 'scale'): Plan | null {
    const plans = this.getCurrentPlans();
    for (const p of plans) {
      const k = this.getPlanKey(p);
      if (k === key) return p;
    }
    return null;
  }

  getTierKey(plan: Plan | null): 'starter' | 'pro' | 'scale' | 'unknown' {
    if (!plan) return 'unknown';
    const k = this.getPlanKey(plan);
    if (k === 'starter' || k === 'pro' || k === 'scale') return k;
    return 'unknown';
  }

  getPortfolioLimitLabel(plan: Plan | null, fallback: string): string {
    if (!plan) return fallback;
    const meta: any = this.normalizePlanMetadata(plan);
    const raw = Number(meta?.['portfolio_limit'] ?? meta?.['portfolioLimit']);
    if (Number.isFinite(raw) && raw > 0) return `${Math.floor(raw)} items`;
    if (raw === 0) return '0 items';
    return fallback;
  }

  getAnalyticsLabel(plan: Plan | null, fallback: string): string {
    if (!plan) return fallback;
    const meta: any = this.normalizePlanMetadata(plan);
    const tier = String(meta?.['analytics_tier'] ?? meta?.['analyticsTier'] ?? '').toLowerCase();
    if (tier === 'advanced' || tier === 'avanzado') return 'Avanzado';
    if (tier === 'basic' || tier === 'basico' || tier === 'básico') return 'Básico';
    return fallback;
  }

  getVisibilityLabel(plan: Plan | null, fallback: string): string {
    if (!plan) return fallback;
    const meta: any = this.normalizePlanMetadata(plan);
    const prio = String(meta?.['search_priority'] ?? meta?.['searchPriority'] ?? '').toLowerCase();
    if (prio === 'top') return 'Top';
    if (prio === 'high' || prio === 'alta') return 'Alta';
    if (prio === 'standard' || prio === 'estandar' || prio === 'estándar') return 'Estándar';
    return fallback;
  }

  // Fundador ahora se activa validando código vía applyPromoCode()

  separatePlansByInterval() {
    console.log('[SELECT_PLAN] Separando planes por intervalo');
    this.annualPlans = this.plans.filter(plan => plan.interval === 'year');
    this.monthlyPlans = this.plans.filter(plan => plan.interval === 'month');

    // Derivar intervalos faltantes (backend puede devolver solo month o solo year)
    if (this.annualPlans.length === 0 && this.monthlyPlans.length > 0) {
      this.annualPlans = this.deriveAnnualPlansFromMonthly(this.monthlyPlans);
    }
    if (this.monthlyPlans.length === 0 && this.annualPlans.length > 0) {
      this.monthlyPlans = this.deriveMonthlyPlansFromAnnual(this.annualPlans);
    }

    // Si el billing actual no tiene planes, hacer fallback automático al que sí exista
    if (this.isAnnualBilling && this.annualPlans.length === 0 && this.monthlyPlans.length > 0) {
      this.isAnnualBilling = false;
    } else if (!this.isAnnualBilling && this.monthlyPlans.length === 0 && this.annualPlans.length > 0) {
      this.isAnnualBilling = true;
    }
    console.log('[SELECT_PLAN] monthlyPlans:', this.monthlyPlans.length, 'annualPlans:', this.annualPlans.length);
  }

  private deriveAnnualPlansFromMonthly(monthly: Plan[]): Plan[] {
    return (monthly || []).map(p => ({
      ...p,
      // Mantener mismo id: el backend ya entiende el plan por id (y el billing se decide por precio/intervalo).
      id: p.id,
      sourceId: p.id,
      interval: 'year',
      price: Math.round(Number(p.price || 0) * 12)
    }));
  }

  private deriveMonthlyPlansFromAnnual(annual: Plan[]): Plan[] {
    return (annual || []).map(p => ({
      ...p,
      id: p.id,
      sourceId: p.id,
      interval: 'month',
      price: Math.round(Number(p.price || 0) / 12)
    }));
  }

  selectPlan(plan: Plan) {
    if (this.isPromoActive()) {
      console.log('[SELECT_PLAN] Ignorando selección de plan porque hay promo activa');
      return;
    }
    console.log('[SELECT_PLAN] Plan seleccionado:', plan);
    this.selectedPlan = plan;
    this.paymentMethod = 'stripe';

    // UX: si es un plan pagado, llevar al selector de pasarela (Stripe/Webpay)
    if (this.requiresPaymentSelection()) {
      this.scrollToPaymentMethods();
    }
  }

  private scrollToPaymentMethods(): void {
    try {
      if (typeof document === 'undefined') return;
      setTimeout(() => {
        const el = document.getElementById('paymentMethods');
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } catch {}
  }

  toggleBilling() {
    this.setBilling(!this.isAnnualBilling);
  }

  getCurrentPlans(): Plan[] {
    const pool = this.isAnnualBilling ? this.annualPlans : this.monthlyPlans;
    return this.pickOnePlanPerGroup(pool);
  }

  getBillingLabel(): string {
    return this.isAnnualBilling ? 'Anual' : 'Mensual';
  }

  getSavingsPercentage(): number {
    if (this.annualPlans.length === 0 || this.monthlyPlans.length === 0) return 0;

    const annualByKey = this.groupPlansByKey(this.annualPlans);
    const monthlyByKey = this.groupPlansByKey(this.monthlyPlans);
    const keys = Array.from(annualByKey.keys()).filter(k => monthlyByKey.has(k));
    if (keys.length === 0) return 0;

    let totalSavings = 0;
    let counted = 0;
    for (const key of keys) {
      const annual = this.pickBestPlan(annualByKey.get(key) || []);
      const monthly = this.pickBestPlan(monthlyByKey.get(key) || []);
      if (!annual || !monthly) continue;
      const monthlyAnnual = Number(monthly.price || 0) * 12;
      const annualPrice = Number(annual.price || 0);
      if (!(monthlyAnnual > 0) || !(annualPrice > 0) || annualPrice >= monthlyAnnual) continue;
      const savings = ((monthlyAnnual - annualPrice) / monthlyAnnual) * 100;
      totalSavings += savings;
      counted += 1;
    }
    return counted ? Math.round(totalSavings / counted) : 0;
  }

  private groupPlansByKey(plans: Plan[]): Map<string, Plan[]> {
    const map = new Map<string, Plan[]>();
    for (const p of plans || []) {
      const key = this.getPlanGroupKey(p);
      const arr = map.get(key) || [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }

  private pickBestPlan(plans: Plan[]): Plan | null {
    if (!plans?.length) return null;
    const sorted = [...plans].sort((a, b) => {
      const aRec = this.isPlanRecommended(a) ? 1 : 0;
      const bRec = this.isPlanRecommended(b) ? 1 : 0;
      if (aRec !== bRec) return bRec - aRec;
      const ap = Number(a.price || 0);
      const bp = Number(b.price || 0);
      if (ap !== bp) return ap - bp;
      return Number(a.id || 0) - Number(b.id || 0);
    });
    return sorted[0] || null;
  }

  private pickOnePlanPerGroup(plans: Plan[]): Plan[] {
    const groups = this.groupPlansByKey(plans);
    const picked: Plan[] = [];
    for (const [_, arr] of groups.entries()) {
      const best = this.pickBestPlan(arr);
      if (best) picked.push(best);
    }
    // Orden estable: por precio asc y luego id
    return picked.sort((a, b) => {
      const ap = Number(a.price || 0);
      const bp = Number(b.price || 0);
      if (ap !== bp) return ap - bp;
      return Number(a.id || 0) - Number(b.id || 0);
    });
  }

  getDisplayPlanName(plan: Plan | null): string {
    if (!plan?.name) return '';
    // Evitar confusión si el nombre en DB viene con “Mensual/Anual”
    return String(plan.name).replace(/\s+(Mensual|Anual)\s*$/i, '').trim();
  }

  getCommissionNotes(plan: Plan | null): string[] {
    if (!plan) return [];
    const meta: any = this.normalizePlanMetadata(plan);
    const notes: string[] = [];
    notes.push('Se descuenta del monto bruto de cada cita pagada.');
    const cashEnabled = !!meta?.['cash_enabled'] || !!meta?.['cashEnabled'];
    if (cashEnabled) {
      notes.push('En efectivo: la comisión se registra como deuda y se cobra por Adomi.');
    }
    return notes;
  }

  continueToPayment() {
    if (!this.selectedPlan || !this.tempUserData) {
      console.warn('[SELECT_PLAN] No hay selectedPlan o tempUserData. Abortando.');
      return;
    }
    if (this.requiresPaymentSelection() && !this.paymentMethod) {
      console.warn('[SELECT_PLAN] Falta seleccionar método de pago.');
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
      if (this.requiresPaymentSelection()) {
        sessionStorage.setItem('paymentGateway', this.paymentMethod);
      } else {
        sessionStorage.removeItem('paymentGateway');
      }
      console.log('[SELECT_PLAN] selectedPlan guardado en sessionStorage');
    }
    
    // Redirigir a checkout
    console.log('[SELECT_PLAN] Navegando a /auth/checkout');
    this.router.navigateByUrl('/auth/checkout');
  }

  requiresPaymentSelection(): boolean {
    return !!this.selectedPlan && !this.selectedPlan.isPromo && Number(this.selectedPlan.price || 0) > 0;
  }

  onPaymentMethodChange(method: 'stripe' | 'tbk') {
    this.paymentMethod = method;
  }

  goBack() {
    // Al volver cancelamos el flujo de plan. Si el usuario es cliente con switch en progreso, lo limpiamos y volvemos a su dash.
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('tempUserData');
        sessionStorage.removeItem('selectedPlan');
        sessionStorage.removeItem('promoCode');
        sessionStorage.removeItem('paymentGateway');
        sessionStorage.removeItem('providerOnboarding');
        sessionStorage.removeItem('tbkPlanPending');
      }
    } catch {
      // Ignorado: si no podemos limpiar sessionStorage no bloqueamos la navegación
    }

    const current = this.authService.getCurrentUser();
    const isClient = current?.role === 'client';
    if (isClient) {
      this.authService.clearProviderSwitch();
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('adomi_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.pending_role = null;
            parsed.account_switch_in_progress = false;
            parsed.account_switch_started_at = null;
            parsed.account_switch_source = null;
            localStorage.setItem('adomi_user', JSON.stringify(parsed));
          }
        }
      } catch {}
      this.router.navigateByUrl('/client/reservas');
    } else {
      // Para proveedores, aseguramos un estado limpio para re-login (borra tokens/usuario y va a login)
      try {
        console.log('[SELECT_PLAN] goBack proveedor: limpiando auth para re-login');
        this.authService.logout();
      } catch {}
      this.router.navigateByUrl('/auth/login');
    }
  }

  formatDisplayPrice(price: number): string {
    const formatter = new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const normalized = Number.isFinite(price) ? Math.max(0, price) : 0;
    return `$${formatter.format(normalized)}`;
  }

  formatAmount(price: number): string {
    const formatter = new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const normalized = Number.isFinite(price) ? Math.max(0, price) : 0;
    return formatter.format(normalized);
  }

  getCommissionLabel(plan: Plan | null): string {
    if (!plan) return '—';
    const rate = Number(plan.commission_rate);
    if (!Number.isFinite(rate)) return '—';
    return `${Math.max(0, rate)}%`;
  }

  getCommissionBoxClass(plan: Plan | null): string {
    if (!plan) return '';
    const rate = Number(plan.commission_rate);
    if (!Number.isFinite(rate)) return '';
    if (rate <= 7) return 'low-comm';
    if (rate >= 12) return 'high-comm';
    return '';
  }

  getPlanIntervalLabel(plan: Plan | null): string {
    if (!plan) return '';
    return plan.interval === 'month' ? '/mes' : '/año';
  }

  getPlanSavingsLabel(plan: Plan | null): string | null {
    if (!plan || plan.interval !== 'year') return null;
    const key = this.getPlanGroupKey(plan);
    const monthlyPeer = this.monthlyPlans.find(p => this.getPlanGroupKey(p) === key);
    if (!monthlyPeer) return null;
    const yearlyEquivalent = (monthlyPeer.price || 0) * 12;
    const savings = Math.round(yearlyEquivalent - (plan.price || 0));
    if (savings <= 0) return null;
    return `Ahorras ${this.formatDisplayPrice(savings)}`;
  }

  isPlanRecommended(plan: Plan): boolean {
    // Preferimos señal por metadata; fallback por comisión más baja.
    const meta: any = this.normalizePlanMetadata(plan);
    if (meta?.['search_priority'] && String(meta['search_priority']).toLowerCase() === 'high') return true;
    if (meta?.['support_level'] && String(meta['support_level']).toLowerCase() === 'priority') return true;
    const rate = Number(plan.commission_rate ?? 0);
    return rate > 0 && rate <= 7;
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

  getPlanSubtitle(plan: Plan | null): string {
    if (!plan) return '';
    const meta: any = this.normalizePlanMetadata(plan);
    const subtitle = meta?.['subtitle'] || meta?.['tagline'];
    if (typeof subtitle === 'string' && subtitle.trim()) return subtitle.trim();
    // Fallback: usar plan_type (sin depender de nombres)
    if (plan.plan_type === 'free') return 'Para empezar';
    if (plan.plan_type === 'paid') return 'Para profesionales';
    return '';
  }

  getPlanFeatureRows(plan: Plan | null): PlanFeatureRow[] {
    if (!plan) return [];

    // Fundador (promo): derivar de metadata + duración (6m)
    if (plan.plan_type === 'founder' || plan.isPromo) {
      return this.founderFeatureRows;
    }

    const meta: any = this.normalizePlanMetadata(plan);
    const rows: PlanFeatureRow[] = [];

    rows.push({ label: 'Pagos en efectivo', enabled: !!meta?.['cash_enabled'] || !!meta?.['cashEnabled'] });
    rows.push({ label: 'Sistema de cotizaciones', enabled: !!meta?.['quotes_enabled'] || !!meta?.['quotesEnabled'] });

    const promotionsEnabled = !!meta?.['promotions_enabled'] || !!meta?.['promotionsEnabled'];
    const promotionsLimit = Number(meta?.['promotions_limit'] ?? meta?.['promotionsLimit'] ?? 0);
    rows.push({
      label: promotionsEnabled ? (promotionsLimit > 0 ? `Promociones activas (${promotionsLimit})` : 'Promociones activas (ilimitadas)') : 'Promociones activas',
      enabled: promotionsEnabled
    });

    const portfolioLimit = Number(meta?.['portfolio_limit'] ?? meta?.['portfolioLimit'] ?? 0);
    rows.push({
      label: portfolioLimit > 0 ? `Portafolio (${portfolioLimit} ítems)` : 'Portafolio (ilimitado)',
      enabled: true
    });

    const faqEnabled = !!meta?.['faq_enabled'] || !!meta?.['faqEnabled'];
    const faqLimit = Number(meta?.['faq_limit'] ?? meta?.['faqLimit'] ?? 0);
    rows.push({
      label: faqEnabled ? (faqLimit > 0 ? `FAQ público (${faqLimit})` : 'FAQ público') : 'FAQ público',
      enabled: faqEnabled
    });

    rows.push({ label: 'Ver rating del cliente', enabled: !!meta?.['client_rating_visible'] || !!meta?.['clientRatingVisible'] });
    rows.push({ label: 'Exportar reportes (CSV)', enabled: !!meta?.['csv_export_enabled'] || !!meta?.['csvExportEnabled'] });

    const analyticsTier = String(meta?.['analytics_tier'] ?? meta?.['analyticsTier'] ?? '').toLowerCase();
    rows.push({ label: analyticsTier === 'advanced' ? 'Dashboard avanzado' : 'Dashboard básico', enabled: true });

    const supportLevel = String(meta?.['support_level'] ?? meta?.['supportLevel'] ?? '').toLowerCase();
    rows.push({
      label: supportLevel ? `Soporte ${supportLevel}` : 'Soporte',
      enabled: true
    });

    return rows;
  }

  private normalizePlanMetadata(plan: Plan | null | undefined): any {
    if (!plan?.metadata) return {};
    const raw = plan.metadata;
    if (raw && typeof raw === 'object') return raw;
    try {
      return JSON.parse(String(raw));
    } catch {
      return {};
    }
  }

  get founderDurationMonths(): number {
    const months = Number(this.promoMeta?.max_duration_months || this.promoPlan?.duration_months || 6);
    return Number.isFinite(months) && months > 0 ? months : 6;
  }

  get founderFeatureRows(): PlanFeatureRow[] {
    const months = this.founderDurationMonths;
    return [
      { label: `${months} meses sin comisión de plataforma`, enabled: true },
      { label: 'Prioridad en búsquedas locales', enabled: true },
      { label: 'Soporte directo del equipo Adomi', enabled: true },
      { label: 'Acceso a nuevas funciones beta', enabled: true },
      { label: 'Pagos en efectivo habilitados', enabled: true },
      { label: 'Sistema de cotizaciones incluido', enabled: true }
    ];
  }

  getPlanGroupKey(plan: Plan | null | undefined): string {
    if (!plan) return 'unknown';
    const meta: any = this.normalizePlanMetadata(plan);
    const key = meta?.['plan_key'] || meta?.['planKey'] || meta?.['tier'] || meta?.['group'] || meta?.['group_key'] || meta?.['groupKey'];
    if (typeof key === 'string' && key.trim()) return key.trim().toLowerCase();
    // Fallback: estable por id (evita hardcode por nombre)
    return `plan-${plan.id}`;
  }

  private cleanupSessionStorage() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('tempUserData');
        sessionStorage.removeItem('selectedPlan');
        sessionStorage.removeItem('promoCode');
        sessionStorage.removeItem('paymentGateway');
        sessionStorage.removeItem('tbkPlanPending');
        sessionStorage.removeItem('providerOnboarding');
      }
    } catch {
      // ignore
    }
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
      console.warn('[SELECT_PLAN] No token o providerId disponible, intentando auto registro/login antes de activar promo');
      void this.registerLoginAndApplyPromo();
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
        console.log('[SELECT_PLAN] /subscriptions/promo/apply response', response);
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

  // Auto registro/login cuando no hay token antes de aplicar Fundador
  private async registerLoginAndApplyPromo(): Promise<void> {
    this.promoActivating = true;
    try {
      if (!this.tempUserData) {
        const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('tempUserData') : null;
        if (raw) {
          try { this.tempUserData = JSON.parse(raw); } catch {}
        }
      }

      const email = this.tempUserData?.email;
      const password = this.tempUserData?.password;
      const name = this.tempUserData?.name || (email ? email.split('@')[0] : 'Usuario');
      const role: 'provider' | 'client' = this.tempUserData?.role || 'provider';

      if (!email || !password) {
        console.warn('[SELECT_PLAN] No tempUserData disponible para auto-registro/login antes de activar promo');
        this.promoError = 'Faltan tus datos para activar el plan. Vuelve al registro.';
        this.promoActivating = false;
        return;
      }

      console.log('[SELECT_PLAN] Registrando usuario provider antes de activar promo', { email, role });
      try {
        const registerResp: any = await firstValueFrom(
          this.authService.register({ email, password, role, name })
        );
        const registerData = registerResp?.data || registerResp;
        if (!registerData?.success && !registerResp?.success) {
          throw new Error(registerResp?.error || registerData?.error || 'Registro fallido');
        }
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('ya tienes una cuenta') || msg.includes('ya existe') || err?.status === 409) {
          console.warn('[SELECT_PLAN] Usuario ya existe, continuando con login');
        } else {
          console.error('[SELECT_PLAN] Error en auto-registro antes de activar promo', err);
          this.promoError = 'No pudimos completar tu registro. Intenta nuevamente.';
          this.promoActivating = false;
          return;
        }
      }

      // Login inmediato para obtener token
      console.log('[SELECT_PLAN] Haciendo login automático para activar promo');
      try {
        await firstValueFrom(this.authService.login({ email, password }));
        await firstValueFrom(this.authService.getCurrentUserInfo());
      } catch (err) {
        console.error('[SELECT_PLAN] Error en login automático tras registro', err);
        this.promoError = 'No pudimos iniciar sesión automáticamente. Intenta iniciar sesión para activar tu código.';
        this.promoActivating = false;
        return;
      }

      const providerId = this.authService.getCurrentUser()?.id || null;
      const token = this.authService.getAccessToken();

      if (token && providerId && this.promoPlan?.promoCode) {
        try {
          const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
          const resp: any = await firstValueFrom(
            this.http.post(`${environment.apiBaseUrl}/subscriptions/promo/apply`, {
              providerId,
              code: this.promoPlan.promoCode
            }, { headers })
          );

          if (resp?.ok) {
            console.log('[SELECT_PLAN] Promo aplicada tras auto-registro/login, navegando a dash/home');
            this.cleanupSessionStorage();
            this.promoSuccess = 'Plan Fundador activado. Te llevamos a tu panel...';
            this.promoError = null;
            this.promoActivating = false;
            this.router.navigateByUrl('/dash/home');
            return;
          } else {
            console.warn('[SELECT_PLAN] No se pudo activar promo tras auto-registro/login. Resp:', resp);
            this.promoError = resp?.error || 'No pudimos activar tu Plan Fundador. Intenta nuevamente.';
          }
        } catch (err: any) {
          console.error('[SELECT_PLAN] Error aplicando promo tras auto-registro/login', err);
          this.promoError = err?.error?.error || err?.message || 'No pudimos activar tu Plan Fundador. Intenta nuevamente.';
        }
      } else {
        this.promoError = 'No pudimos obtener tu sesión para activar el plan. Intenta iniciar sesión.';
      }
    } catch (err: any) {
      console.error('[SELECT_PLAN] Error en registro/login antes de activar promo', err);
      this.promoError = 'No pudimos activar tu Plan Fundador. Intenta nuevamente.';
    } finally {
      this.promoActivating = false;
    }
  }

  private getLocalUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem('adomi_user');
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async fastActivateStarter(): Promise<void> {
    if (this.fastActivating) return;
    this.fastActivating = true;
    this.loading = true;
    this.error = null;

    try {
      // Resolver planId starter (fallback al endpoint default). Si no hay ID válido, dejaremos que el backend resuelva.
      let planId = Number(this.selectedPlan?.id || 0);
      if (!Number.isFinite(planId) || planId <= 0) {
        try {
          const resp: any = await firstValueFrom(
            this.http.get<{ ok: boolean; planId: number }>(`${environment.apiBaseUrl}/plans/free/default`)
          );
          if (resp?.ok && resp.planId) {
            planId = Number(resp.planId);
          }
        } catch (e) {
          console.warn('[SELECT_PLAN] No se pudo obtener planId starter por fallback', e);
        }
      }

      // Si no hay token, registrar/login con tempUserData
      const hasToken = !!this.authService.getAccessToken();
      if (!hasToken) {
        if (!this.tempUserData?.email || !this.tempUserData?.password) {
          this.error = 'No pudimos completar tu registro. Vuelve al paso anterior.';
          this.loading = false;
          this.fastActivating = false;
          return;
        }
        try {
          await firstValueFrom(
            this.authService.register({
              email: this.tempUserData.email,
              password: this.tempUserData.password,
              role: 'provider',
              name: this.tempUserData.name || this.tempUserData.email.split('@')[0]
            })
          );
          // Asegurar token activo tras registro
          await firstValueFrom(this.authService.login({
            email: this.tempUserData.email,
            password: this.tempUserData.password
          }));
          await firstValueFrom(this.authService.getCurrentUserInfo());
        } catch (err: any) {
          console.warn('[SELECT_PLAN] Registro previo falló o ya existe, intentando login', err);
          try {
            await firstValueFrom(this.authService.login({
              email: this.tempUserData.email,
              password: this.tempUserData.password
            }));
          } catch (loginErr) {
            this.error = 'No pudimos iniciar sesión automáticamente. Intenta de nuevo.';
            this.loading = false;
            this.fastActivating = false;
            return;
          }
        }
      }

      const token = this.authService.getAccessToken();
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

      // Solo enviamos planId si es válido (>0); el backend ya hace fallback cuando falta.
      const body: any = { planKey: 'starter' };
      if (Number.isFinite(planId) && planId > 0) {
        body.planId = planId;
      }
      if (!token && this.tempUserData?.email && this.tempUserData?.password) {
        body.email = this.tempUserData.email;
        body.password = this.tempUserData.password;
        body.name = this.tempUserData.name || this.tempUserData.email.split('@')[0];
      }

      const resp: any = await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/plans/free/activate`, body, headers ? { headers } : {})
      );

      if (!resp?.ok) {
        this.error = resp?.error || 'No pudimos activar el plan gratuito. Intenta nuevamente.';
        this.loading = false;
        this.fastActivating = false;
        return;
      }

      try {
        await firstValueFrom(this.authService.getCurrentUserInfo());
      } catch (e) {
        console.warn('[SELECT_PLAN] No se pudo refrescar /auth/me tras activar free', e);
      }

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('tempUserData');
          sessionStorage.removeItem('selectedPlan');
          sessionStorage.removeItem('promoCode');
          sessionStorage.removeItem('paymentGateway');
          sessionStorage.removeItem('providerOnboarding');
        }
      } catch {}

      this.loading = false;
      this.fastActivating = false;
      this.router.navigateByUrl('/dash/home');
    } catch (err: any) {
      console.error('[SELECT_PLAN] Error fastActivateStarter', err);
      this.error = err?.error?.error || err?.message || 'No pudimos activar el plan gratuito. Intenta nuevamente.';
      this.loading = false;
      this.fastActivating = false;
    }
  }
}
