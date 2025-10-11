import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StripeService, StripeError } from '../../services/stripe.service';
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

  private http = inject(HttpClient);
  private router = inject(Router);
  private stripeService = inject(StripeService);
  private authService = inject(AuthService);

  ngOnInit() {
    // Verificar que hay datos temporales
    const tempData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('tempUserData') : null;
    const planData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('selectedPlan') : null;
    
    if (!tempData || !planData) {
      this.router.navigateByUrl('/auth/register');
      return;
    }

    this.tempUserData = JSON.parse(tempData);
    this.selectedPlan = JSON.parse(planData);

    // Si ya hay token (p.ej., login con Google), no intentamos registrar de nuevo
    const token = this.authService.getAccessToken();
    if (token) {
      this.tempUserData = null;
      try {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('tempUserData');
        }
      } catch {}
    }
  }

  async proceedToPayment() {
    if (!this.selectedPlan) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.stripeError = null;

    try {
      // Si NO hay token y tenemos datos temporales, primero registrar al usuario
      const hasToken = !!this.authService.getAccessToken();
      if (!hasToken && this.tempUserData) {
        await this.registerUserFirst();
      }

      // Crear sesión de checkout
      this.http.post<CheckoutResponse>(`${environment.apiBaseUrl}/stripe/create-checkout-session`, {
        planId: this.selectedPlan.id
      }).subscribe({
        next: async (response) => {
          if (response.ok && response.sessionId) {
            // Usar Stripe Service para redirigir
            const result = await this.stripeService.redirectToCheckout({
              sessionId: response.sessionId,
              successUrl: `${window.location.origin}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
              cancelUrl: `${window.location.origin}/auth/payment-error`
            });

            if (!result.success && result.error) {
              // Manejar tanto StripeError como string
              if (typeof result.error === 'string') {
                this.stripeError = result.error;
              } else {
                this.stripeError = this.stripeService.getErrorMessage(result.error);
              }
              this.loading = false;
            }
          } else {
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

  async registerUserFirst() {
    return new Promise<void>((resolve, reject) => {
      if (!this.tempUserData) {
        resolve();
        return;
      }

      // Asegurar contraseña válida para el registro (fallback si viene desde Google sin password)
      const safePassword = (this.tempUserData.password && this.tempUserData.password.length >= 8)
        ? this.tempUserData.password
        : this.generateRandomPassword(16);
      this.tempUserData.password = safePassword;

      this.http.post(`${environment.apiBaseUrl}/auth/register`, {
        email: this.tempUserData.email,
        password: safePassword,
        name: this.tempUserData.name || this.tempUserData.email?.split('@')[0] || 'Usuario',
        role: this.tempUserData.role || 'provider'
      }).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('[CHECKOUT] Usuario registrado exitosamente');
            // Limpiar datos temporales
            if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('tempUserData');
            }
            resolve();
          } else {
            console.error('[CHECKOUT] Error en registro:', response.error);
            // Si el error es de email duplicado, continuamos sin bloquear
            const message = String(response.error || '').toLowerCase();
            if (message.includes('exists') || message.includes('ya existe') || message.includes('duplicate')) {
              console.warn('[CHECKOUT] Email ya existe, continuando con checkout');
              if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('tempUserData');
              }
              resolve();
              return;
            }
            this.error = response.error || 'Error al registrar usuario';
            this.loading = false;
            reject(response.error);
          }
        },
        error: (error) => {
          console.error('[CHECKOUT] Error en registro:', error);
          const message = String(error?.error?.error || error?.message || '').toLowerCase();
          if (message.includes('exists') || message.includes('ya existe') || message.includes('duplicate')) {
            console.warn('[CHECKOUT] Email ya existe (desde error), continuando con checkout');
            try {
              if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('tempUserData');
              }
            } catch {}
            resolve();
            return;
          }
          this.error = 'Error al registrar usuario. Inténtalo nuevamente.';
          this.loading = false;
          reject(error);
        }
      });
    });
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
