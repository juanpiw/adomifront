import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StripeService, StripeError } from '../../services/stripe.service';
import { AuthService } from '../services/auth.service';
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

    if (!this.promoCode && (this.selectedPlan as any)?.promoCode) {
      this.promoCode = (this.selectedPlan as any).promoCode;
    }

    // Si ya hay token (p.ej., login con Google), no intentamos registrar de nuevo
    const token = this.authService.getAccessToken();
    if (token) {
      this.tempUserData = null;
      try {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('tempUserData');
          sessionStorage.removeItem('selectedPlan');
          console.log('[CHECKOUT] Removidos tempUserData/selectedPlan por sesión activa');
        }
      } catch {}
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

  private async registerUserFirst() {
    if (!this.tempUserData) {
      return;
    }

    const safePassword = (this.tempUserData.password && this.tempUserData.password.length >= 8)
      ? this.tempUserData.password
      : this.generateRandomPassword(16);
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
}
