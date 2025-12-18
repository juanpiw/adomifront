import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StripeService, StripeError } from '../../services/stripe.service';
import { AuthService, AuthUser } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { ensureTempUserData, needsProviderPlan } from '../utils/provider-onboarding.util';

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
  isPromo?: boolean;
  promoCode?: string;
}

interface TempUserData {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'provider';
}

interface CheckoutResponse {
  ok: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  selectedPlan: Plan | null = null;
  tempUserData: TempUserData | null = null;
  loading = false;
  error: string | null = null;
  stripeError: string | null = null;
  promoCode: string | null = null;
  registeredUserId: number | null = null;
  paymentGateway: 'stripe' | 'tbk' = 'stripe';
  private requiresPlan = false;

  private http = inject(HttpClient);
  private router = inject(Router);
  private stripeService = inject(StripeService);
  private authService = inject(AuthService);

  ngOnInit() {
    console.log('[CHECKOUT] Init');
    // Verificar que hay datos temporales
    const tempData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('tempUserData') : null;
    const planData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('selectedPlan') : null;
    
    if (!tempData || !planData) {
      console.warn('[CHECKOUT] Faltan tempUserData o selectedPlan. Redirigiendo a /auth/register');
      this.router.navigateByUrl('/auth/register');
      return;
    }

    try { this.tempUserData = JSON.parse(tempData); console.log('[CHECKOUT] tempUserData:', this.tempUserData); } catch (e) { console.error('[CHECKOUT] Error parseando tempUserData:', e); }
    try { this.selectedPlan = JSON.parse(planData); console.log('[CHECKOUT] selectedPlan:', this.selectedPlan); } catch (e) { console.error('[CHECKOUT] Error parseando selectedPlan:', e); }

    this.promoCode = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('promoCode')
      : null;

    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const storedGateway = sessionStorage.getItem('paymentGateway');
      if (storedGateway === 'tbk' || storedGateway === 'stripe') {
        this.paymentGateway = storedGateway;
      }
    }

    if (!this.promoCode && (this.selectedPlan as any)?.promoCode) {
      this.promoCode = (this.selectedPlan as any).promoCode;
    }

    // Determinar si el usuario ya está autenticado y si aún necesita completar el plan
    const token = this.authService.getAccessToken();
    const currentUser = this.authService.getCurrentUser() || this.getLocalUser();
    this.requiresPlan = needsProviderPlan(currentUser);

    if (token && !this.requiresPlan) {
      this.tempUserData = null;
      try {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('tempUserData');
          sessionStorage.removeItem('selectedPlan');
          console.log('[CHECKOUT] Removidos tempUserData/selectedPlan por sesión activa');
        }
      } catch {}
    } else if (this.requiresPlan) {
      ensureTempUserData(currentUser || this.tempUserData || undefined);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('providerOnboarding', '1');
      }
    }
  }

  async proceedToPayment() {
    if (!this.selectedPlan) {
      console.warn('[CHECKOUT] No hay selectedPlan. Abortando.');
      return;
    }

    this.loading = true;
    this.error = null;
    this.stripeError = null;

    try {
      const hasToken = !!this.authService.getAccessToken();
      if (!hasToken && this.tempUserData) {
        console.log('[CHECKOUT] No hay token. Registrando usuario primero...');
        await this.registerUserFirst();
      }

      const isPromoFlow = !!(this.selectedPlan as any)?.isPromo || !!this.promoCode;
      if (isPromoFlow) {
        await this.applyPromoSubscription();
        return;
      }

      // Plan Free / $0: activar sin pago
      const planPrice = Number((this.selectedPlan as any)?.price || 0);
      if (!(planPrice > 0)) {
        await this.activateFreePlan();
        return;
      }

      if (this.paymentGateway === 'tbk') {
        await this.startTbkFlow();
        return;
      }

      console.log('[CHECKOUT] Creando sesión de Stripe para planId:', this.selectedPlan.id);
      this.http.post<CheckoutResponse>(`${environment.apiBaseUrl}/stripe/create-checkout-session`, {
        planId: this.selectedPlan.id
      }).subscribe({
        next: async (response) => {
          console.log('[CHECKOUT] Respuesta create-checkout-session:', response);
          if (response.ok && response.sessionId) {
            const result = await this.stripeService.redirectToCheckout({
              sessionId: response.sessionId,
              successUrl: `${window.location.origin}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
              cancelUrl: `${window.location.origin}/auth/payment-error`
            });

            if (!result.success && result.error) {
              console.error('[CHECKOUT] redirectToCheckout error:', result.error);
              if (typeof result.error === 'string') {
                this.stripeError = result.error;
              } else {
                this.stripeError = this.stripeService.getErrorMessage(result.error);
              }
              this.loading = false;
            }
          } else {
            console.error('[CHECKOUT] Error creando sesión de pago:', response);
            this.error = response.error || 'Error al crear sesión de pago';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Checkout error:', error);
          this.error = 'Error al procesar el pago. Inténtalo nuevamente.';
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Error en proceedToPayment:', error);
      this.error = 'Error inesperado. Inténtalo nuevamente.';
      this.loading = false;
    }
  }

  private async activateFreePlan(): Promise<void> {
    if (!this.selectedPlan) {
      this.loading = false;
      this.error = 'Plan no seleccionado.';
      return;
    }

    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        this.error = 'Debes iniciar sesión nuevamente para activar tu plan.';
        this.loading = false;
        return;
      }

      // Asegurar planId válido para free (si el front tuvo que derivar un starter sintético)
      let planId = Number((this.selectedPlan as any)?.id || 0);
      if (!Number.isFinite(planId) || planId <= 0) {
        try {
          const fallback = await firstValueFrom(this.http.get<{ ok: boolean; planId: number }>(`${environment.apiBaseUrl}/plans/free/default`));
          if (fallback?.ok && fallback.planId) {
            planId = Number(fallback.planId);
          }
        } catch (e) {
          console.warn('[CHECKOUT] No se pudo obtener planId starter por fallback', e);
        }
      }

      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const resp: any = await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/plans/free/activate`, { planId }, { headers })
      );

      if (!resp?.ok) {
        this.error = resp?.error || 'No pudimos activar el plan Free. Intenta nuevamente.';
        this.loading = false;
        return;
      }

      try {
        await firstValueFrom(this.authService.getCurrentUserInfo());
      } catch (err) {
        console.warn('[CHECKOUT] No se pudo refrescar /auth/me después de activar plan free', err);
      }

      this.cleanupSessionStorage();
      this.loading = false;
      this.router.navigateByUrl('/dash/home');
    } catch (error: any) {
      console.error('[CHECKOUT] Error activando plan free:', error);
      const message = error?.error?.error || error?.message || 'No pudimos activar el plan Free. Intenta nuevamente.';
      this.error = message;
      this.loading = false;
    }
  }

  private async startTbkFlow(): Promise<void> {
    if (!this.selectedPlan) {
      this.loading = false;
      this.error = 'Plan no seleccionado.';
      return;
    }

    try {
      const token = this.authService.getAccessToken();
      if (!token) {
        this.error = 'Debes iniciar sesión nuevamente para continuar con el pago.';
        this.loading = false;
        return;
      }

      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/plans/tbk/init`, { planId: this.selectedPlan.id }, { headers })
      );

      if (!response?.ok || !response?.token || !response?.url) {
        this.error = response?.error || 'No pudimos iniciar el pago con Webpay Plus.';
        this.loading = false;
        return;
      }

      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('tbkPlanPending', '1');
      }

      this.redirectToTbk(response.url, response.token);
    } catch (error: any) {
      console.error('[CHECKOUT] Error iniciando pago TBK:', error);
      const message = error?.error?.error || error?.message || 'No pudimos iniciar el pago con Webpay Plus.';
      this.error = message;
      this.loading = false;
    }
  }

  private redirectToTbk(url: string, token: string): void {
    if (typeof document === 'undefined') {
      window.location.href = url;
      return;
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  }

  private async registerUserFirst() {
    if (!this.tempUserData) {
      return;
    }

    const providedPassword = (this.tempUserData.password || '').trim();
    if (!providedPassword || providedPassword.length < 6) {
      this.error = 'No pudimos validar tu contraseña. Vuelve al paso anterior para completar el formulario.';
      this.loading = false;
      throw new Error('MISSING_OR_INVALID_PASSWORD');
    }

    const safePassword = providedPassword;
    this.tempUserData.password = safePassword;
    const registrationEmail = this.tempUserData.email;

    try {
      const response: any = await firstValueFrom(
        this.authService.register({
          email: this.tempUserData.email,
          password: safePassword,
          role: this.tempUserData.role || 'provider',
          name: this.tempUserData.name || this.tempUserData.email?.split('@')[0] || 'Usuario'
        })
      );

      const data = response?.data || response;
      if (!response?.success && !data?.success) {
        throw new Error(response?.error || data?.error || 'Registro fallido');
      }

      const registeredUser = data?.user || response?.user;
      this.registeredUserId = registeredUser?.id ?? null;
      this.tempUserData = null;

      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('tempUserData');
      }

      this.trackFunnelEvent('registration_completed', {
        provider_id: this.registeredUserId,
        promo_code: this.promoCode || null,
        email: registrationEmail
      });
    } catch (error: any) {
      const message = String(error?.error?.error || error?.message || '').toLowerCase();
      if (message.includes('exists') || message.includes('ya existe') || message.includes('duplicate')) {
        console.warn('[CHECKOUT] Email ya existe (registroUserFirst), intentando continuar');
        this.tempUserData = null;
        try {
          if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('tempUserData');
          }
        } catch {}
        return;
      }
      this.error = 'Error al registrar usuario. Inténtalo nuevamente.';
      this.loading = false;
      throw error;
    }
  }

  private async applyPromoSubscription() {
    if (!this.promoCode) {
      this.error = 'Código promocional no disponible.';
      this.loading = false;
      return;
    }

    let providerId: number | null = this.authService.getCurrentUser()?.id || this.registeredUserId;

    if (!providerId) {
      try {
        const resp: any = await firstValueFrom(this.authService.getCurrentUserInfo());
        providerId = resp?.data?.user?.id || resp?.user?.id || null;
      } catch (error) {
        console.error('[CHECKOUT] No se pudo obtener el usuario actual:', error);
      }
    }

    if (!providerId) {
      this.error = 'No pudimos confirmar tu cuenta. Por favor inicia sesión nuevamente.';
      this.loading = false;
      return;
    }

    try {
      const token = this.authService.getAccessToken();
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
      const httpOptions = headers ? { headers } : {};
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/subscriptions/promo/apply`, {
          providerId,
          code: this.promoCode
        }, httpOptions)
      );

      if (!response?.ok) {
        this.error = response?.error || 'No pudimos activar tu Plan Fundador. Intenta nuevamente.';
        this.loading = false;
        return;
      }

      try {
        await firstValueFrom(this.authService.getCurrentUserInfo());
      } catch (err) {
        console.warn('[CHECKOUT] No se pudo refrescar /auth/me después de aplicar promo', err);
      }

      this.cleanupSessionStorage();
      this.loading = false;
      this.router.navigateByUrl('/dash/home');
    } catch (error: any) {
      console.error('[CHECKOUT] Error aplicando promo:', error);
      const message = error?.error?.error || error?.message || 'No pudimos activar tu Plan Fundador. Intenta nuevamente.';
      this.error = message;
      this.loading = false;
    }
  }

  private cleanupSessionStorage() {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('tempUserData');
        sessionStorage.removeItem('selectedPlan');
        sessionStorage.removeItem('promoCode');
        sessionStorage.removeItem('paymentGateway');
        sessionStorage.removeItem('tbkPlanPending');
      }
    } catch {}
  }

  private trackFunnelEvent(event: string, metadata?: Record<string, any>) {
    try {
      const payload: any = {
        event,
        email: metadata?.['email'] || this.tempUserData?.email || null,
        providerId: this.registeredUserId,
        promoCode: this.promoCode,
        metadata
      };
      this.http.post(`${environment.apiBaseUrl}/subscriptions/funnel/event`, payload).subscribe({
        error: (err) => console.warn('[CHECKOUT] No se pudo registrar evento de funnel', err)
      });
    } catch (err) {
      console.warn('[CHECKOUT] Error interno trackFunnelEvent', err);
    }
  }

  // Genera una contraseña segura
  private generateRandomPassword(length: number = 16): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}';
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }

  goBack() {
    this.router.navigateByUrl('/auth/select-plan');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  }

  ngOnDestroy() {
    // Limpiar elementos de Stripe si existen
    this.stripeService.clearElements();
  }

  // Método para limpiar errores
  clearErrors() {
    this.error = null;
    this.stripeError = null;
  }

  // Método para obtener el mensaje de error principal
  getMainError(): string | null {
    return this.stripeError || this.error;
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
}
