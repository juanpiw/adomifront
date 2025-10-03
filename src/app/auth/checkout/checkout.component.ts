import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StripeService, StripeError } from '../../services/stripe.service';

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
  }

  async proceedToPayment() {
    if (!this.selectedPlan) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.stripeError = null;

    try {
      // Si tenemos datos temporales, primero registrar al usuario
      if (this.tempUserData) {
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

      this.http.post(`${environment.apiBaseUrl}/auth/register`, {
        email: this.tempUserData.email,
        password: this.tempUserData.password,
        name: this.tempUserData.name,
        role: this.tempUserData.role
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
            this.error = response.error || 'Error al registrar usuario';
            this.loading = false;
            reject(response.error);
          }
        },
        error: (error) => {
          console.error('[CHECKOUT] Error en registro:', error);
          this.error = 'Error al registrar usuario. Inténtalo nuevamente.';
          this.loading = false;
          reject(error);
        }
      });
    });
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
