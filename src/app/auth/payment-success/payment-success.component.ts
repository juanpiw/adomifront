import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService, AuthResponse } from '../services/auth.service';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  sessionId: string | null = null;
  loading = true;
  error: string | null = null;
  success = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private session = inject(SessionService);

  ngOnInit() {
    // Obtener session_id de la URL
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    
    if (!this.sessionId) {
      this.error = 'No se encontró información de la sesión de pago';
      this.loading = false;
      return;
    }

    this.processPaymentSuccess();
  }

  processPaymentSuccess() {
    // Obtener datos temporales del usuario
    const tempData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('tempUserData') : null;
    const planData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('selectedPlan') : null;
    
    if (!tempData || !planData) {
      this.error = 'No se encontraron los datos del usuario. Por favor, regístrate nuevamente.';
      this.loading = false;
      return;
    }

    try {
      const userData = JSON.parse(tempData);
      const plan = JSON.parse(planData);

      // Si ya hay sesión (Google), no volver a registrar: solo limpiar y continuar
      const hasToken = !!this.auth.getAccessToken();
      if (hasToken) {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('tempUserData');
          sessionStorage.removeItem('selectedPlan');
        }
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigateByUrl('/onboarding');
        }, 2000);
        return;
      }

      // Caso legacy: registro con email/contraseña
      this.auth.register({
        email: userData.email,
        password: userData.password,
        role: userData.role,
        name: userData.name
      }).subscribe({
        next: (response: AuthResponse) => {
          if (response.success) {
            if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('tempUserData');
              sessionStorage.removeItem('selectedPlan');
            }
            this.session.setUser(response.user);
            this.success = true;
            this.loading = false;
            setTimeout(() => {
              this.router.navigateByUrl('/onboarding');
            }, 3000);
          } else {
            this.error = response.error || 'Error al crear la cuenta. Inténtalo nuevamente.';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Registration error:', error);
          if (error.status === 409) {
            this.error = 'El email ya está registrado. Inicia sesión en su lugar.';
          } else if (error.status === 400) {
            this.error = 'Datos de registro inválidos. Verifica la información.';
          } else if (error.status >= 500) {
            this.error = 'Error del servidor. Inténtalo nuevamente en unos minutos.';
          } else {
            this.error = error.error?.error || 'Error al crear la cuenta. Contacta al soporte.';
          }
          this.loading = false;
        }
      });
    } catch (parseError) {
      console.error('Error parsing stored data:', parseError);
      this.error = 'Error al procesar los datos. Por favor, regístrate nuevamente.';
      this.loading = false;
    }
  }

  goToDashboard() {
    this.router.navigateByUrl('/onboarding');
  }

  retryPayment() {
    window.location.reload();
  }
}
