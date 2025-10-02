import { Injectable, inject } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement, StripeCardElementOptions } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';

export interface StripeCheckoutOptions {
  sessionId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripePaymentIntentOptions {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
  clientSecret?: string;
}

export interface StripeError {
  type: string;
  code?: string;
  message: string;
  decline_code?: string;
}

@Injectable({ providedIn: 'root' })
export class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  constructor() {
    // No inicializar automáticamente para evitar problemas de SSR
    // Se inicializará cuando se necesite
  }

  /**
   * Inicializar Stripe con la clave pública
   */
  private async initializeStripe(): Promise<void> {
    if (!this.stripe) {
      try {
        // Verificar si la clave es válida
        if (!environment.stripePublishableKey || environment.stripePublishableKey.includes('your_stripe_publishable_key_here') || environment.stripePublishableKey.includes('51234567890abcdef')) {
          console.warn('Stripe Publishable Key no configurada. Stripe estará deshabilitado.');
          return;
        }

        this.stripe = await loadStripe(environment.stripePublishableKey);
        if (!this.stripe) {
          console.warn('No se pudo cargar Stripe. Verifica tu clave pública.');
        }
      } catch (error) {
        console.warn('Error inicializando Stripe:', error);
      }
    }
  }

  /**
   * Obtener instancia de Stripe
   */
  async getStripe(): Promise<Stripe | null> {
    if (!this.stripe) {
      await this.initializeStripe();
    }
    return this.stripe;
  }

  /**
   * Redirigir a Stripe Checkout
   */
  async redirectToCheckout(options: StripeCheckoutOptions): Promise<{ success: boolean; error?: StripeError | string }> {
    try {
      const stripe = await this.getStripe();
      if (!stripe) {
        return { success: false, error: { type: 'api_error', message: 'Stripe no está disponible' } };
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: options.sessionId,
        successUrl: options.successUrl || `${window.location.origin}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: options.cancelUrl || `${window.location.origin}/auth/payment-error`
      });

      if (error) {
        console.error('Error en redirectToCheckout:', error);
        return { success: false, error: error as StripeError };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error en redirectToCheckout:', error);
      return { success: false, error: { type: 'api_error', message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Crear elementos de Stripe para formulario de pago personalizado
   */
  async createElements(containerId: string): Promise<{ success: boolean; error?: StripeError }> {
    try {
      const stripe = await this.getStripe();
      if (!stripe) {
        return { success: false, error: { type: 'api_error', message: 'Stripe no está disponible' } };
      }

      // Crear elementos
      this.elements = stripe.elements({
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0570de',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Ideal Sans, system-ui, sans-serif',
            spacingUnit: '2px',
            borderRadius: '4px',
          }
        }
      });

      // Crear elemento de tarjeta
      const cardElementOptions: StripeCardElementOptions = {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
          },
        },
      };

      this.cardElement = this.elements.create('card', cardElementOptions);
      
      // Montar el elemento en el contenedor
      const container = document.getElementById(containerId);
      if (container) {
        this.cardElement.mount(container);
      } else {
        return { success: false, error: { type: 'api_error', message: 'Contenedor no encontrado' } };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error creando elementos de Stripe:', error);
      return { success: false, error: { type: 'api_error', message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Crear Payment Intent
   */
  async createPaymentIntent(options: StripePaymentIntentOptions): Promise<{ success: boolean; clientSecret?: string; error?: StripeError }> {
    try {
      const stripe = await this.getStripe();
      if (!stripe) {
        return { success: false, error: { type: 'api_error', message: 'Stripe no está disponible' } };
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(options.clientSecret!, {
        payment_method: {
          card: this.cardElement!,
        }
      });

      if (error) {
        return { success: false, error: error as StripeError };
      }

      return { success: true, clientSecret: paymentIntent?.id };
    } catch (error: any) {
      console.error('Error creando Payment Intent:', error);
      return { success: false, error: { type: 'api_error', message: error.message || 'Error desconocido' } };
    }
  }

  /**
   * Obtener elemento de tarjeta
   */
  getCardElement(): StripeCardElement | null {
    return this.cardElement;
  }

  /**
   * Limpiar elementos
   */
  clearElements(): void {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
    this.elements = null;
  }

  /**
   * Verificar si Stripe está disponible
   */
  isStripeAvailable(): boolean {
    return this.stripe !== null;
  }

  /**
   * Obtener mensaje de error amigable
   */
  getErrorMessage(error: StripeError): string {
    switch (error.type) {
      case 'card_error':
        switch (error.code) {
          case 'card_declined':
            return 'Tu tarjeta fue rechazada. Intenta con otra tarjeta.';
          case 'expired_card':
            return 'Tu tarjeta ha expirado. Intenta con otra tarjeta.';
          case 'incorrect_cvc':
            return 'El código de seguridad de tu tarjeta es incorrecto.';
          case 'incorrect_number':
            return 'El número de tu tarjeta es incorrecto.';
          case 'invalid_expiry_month':
          case 'invalid_expiry_year':
            return 'La fecha de expiración de tu tarjeta es incorrecta.';
          case 'processing_error':
            return 'Hubo un error procesando tu tarjeta. Intenta nuevamente.';
          default:
            return error.message || 'Error con tu tarjeta. Intenta con otra tarjeta.';
        }
      case 'validation_error':
        return 'Los datos ingresados no son válidos. Verifica la información.';
      case 'api_error':
        return 'Error del servidor. Intenta nuevamente en unos minutos.';
      case 'authentication_error':
        return 'Error de autenticación. Recarga la página e intenta nuevamente.';
      default:
        return error.message || 'Ha ocurrido un error inesperado. Intenta nuevamente.';
    }
  }
}
