import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StripeService } from '../../services/stripe.service';

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

interface CheckoutResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  message?: string;
  error?: string;
}

@Component({
  selector: 'app-quick-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quick-payment-container">
      <div class="payment-card">
        <div class="header">
          <h1>💳 Pago Rápido</h1>
          <p>Completa tu suscripción de forma segura</p>
        </div>

        <!-- Plan Display -->
        <div *ngIf="selectedPlan" class="plan-display">
          <div class="plan-info">
            <h3>{{ selectedPlan.name }}</h3>
            <p class="plan-description">{{ selectedPlan.description }}</p>
            <div class="plan-price">
              <span class="price">{{ formatPrice(selectedPlan.price) }}</span>
              <span class="interval">/{{ selectedPlan.interval === 'month' ? 'mes' : 'año' }}</span>
            </div>
          </div>
          
          <div class="plan-features">
            <h4>✨ Incluye:</h4>
            <ul>
              <li *ngFor="let feature of selectedPlan.features">{{ feature }}</li>
            </ul>
          </div>
        </div>

        <!-- Payment Options -->
        <div class="payment-options">
          <div class="payment-method">
            <div class="payment-header">
              <svg class="stripe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span>Tarjeta de Crédito/Débito</span>
            </div>
            <p class="payment-description">
              Pago seguro procesado por Stripe. Aceptamos Visa, Mastercard, American Express y más.
            </p>
          </div>
        </div>

        <!-- Error Messages -->
        <div *ngIf="error" class="error-message">
          <div class="error-content">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p>{{ error }}</p>
            <button class="error-close" (click)="clearError()" title="Cerrar">×</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="actions">
          <button class="btn-secondary" (click)="goBack()" [disabled]="loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver
          </button>
          <button 
            class="btn-primary" 
            (click)="proceedToPayment()"
            [disabled]="loading"
          >
            <svg *ngIf="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <svg *ngIf="loading" class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <span *ngIf="!loading">Pagar Ahora</span>
            <span *ngIf="loading">Procesando...</span>
          </button>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <div class="security-badges">
            <div class="security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span>SSL Encriptado</span>
            </div>
            <div class="security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>PCI Compliant</span>
            </div>
            <div class="security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Stripe Protegido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./quick-payment.component.scss']
})
export class QuickPaymentComponent implements OnInit {
  selectedPlan: Plan | null = null;
  loading = false;
  error: string | null = null;

  private http = inject(HttpClient);
  private router = inject(Router);
  private stripeService = inject(StripeService);

  ngOnInit() {
    // Obtener plan desde sessionStorage o route params
    const planData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('selectedPlan') : null;
    
    if (planData) {
      this.selectedPlan = JSON.parse(planData);
    } else {
      // Redirigir si no hay plan seleccionado
      this.router.navigateByUrl('/auth/select-plan');
    }
  }

  async proceedToPayment() {
    if (!this.selectedPlan) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Crear sesión de checkout
      this.http.post<CheckoutResponse>(`${environment.apiBaseUrl}/stripe/create-checkout-session`, {
        planId: this.selectedPlan.id
      }).subscribe({
        next: async (response) => {
          if (response.success && response.sessionId) {
            // Redirigir a Stripe Checkout
            const result = await this.stripeService.redirectToCheckout({
              sessionId: response.sessionId,
              successUrl: `${window.location.origin}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
              cancelUrl: `${window.location.origin}/auth/payment-error`
            });

            if (!result.success && result.error) {
              if (typeof result.error === 'string') {
                this.error = result.error;
              } else {
                this.error = this.stripeService.getErrorMessage(result.error);
              }
              this.loading = false;
            }
          } else {
            this.error = response.error || 'Error al crear sesión de pago';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Quick payment error:', error);
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

  goBack() {
    this.router.navigateByUrl('/auth/select-plan');
  }

  clearError() {
    this.error = null;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  }
}

