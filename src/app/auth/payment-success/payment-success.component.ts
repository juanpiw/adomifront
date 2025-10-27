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
    // Normalizar estado inicial (evita duplicado de estados por SSR)
    this.success = false;
    this.error = null;
    this.loading = true;
    // Obtener session_id de la URL
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    
    if (!this.sessionId) {
      this.success = false;
      this.error = 'No se encontró información de la sesión de pago';
      this.loading = false;
      return;
    }

    this.processPaymentSuccess();
  }

  processPaymentSuccess() {
    try {
      // Asegurar exclusividad de estados
      this.error = null;
      this.success = false;
      this.loading = true;
      // Si ya hay sesión (Google), no exigir datos temporales ni registrar de nuevo
      const hasToken = !!this.auth.getAccessToken();
      if (hasToken) {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('tempUserData');
          sessionStorage.removeItem('selectedPlan');
        }
        // Esperar promoción por webhook: hacer polling de /auth/me hasta role=provider
        this.success = true;
        this.loading = false;
        let attempts = 0;
        const maxAttempts = 30; // ~60s si usamos 2s de intervalo
        const intervalMs = 2000;
        const intendedProvider = (() => {
          try {
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
            if (raw) { const u = JSON.parse(raw); return u?.intendedRole === 'provider' || u?.pending_role === 'provider'; }
          } catch {}
          return false;
        })();
        const poll = setInterval(() => {
          attempts++;
          this.auth.getCurrentUserInfo().subscribe({
            next: (resp) => {
              const user = (resp as any).data?.user || (resp as any).user || resp;
              if (user?.role === 'provider') {
                clearInterval(poll);
                this.router.navigateByUrl('/dash/home');
              } else if (attempts >= maxAttempts) {
                clearInterval(poll);
                // Fallback: si la intención era proveedor, dirigir al dashboard de proveedor
                if (intendedProvider) {
                  this.router.navigateByUrl('/dash/home');
                } else {
                  this.router.navigateByUrl('/client/reservas');
                }
              }
            },
            error: () => {
              if (attempts >= maxAttempts) {
                clearInterval(poll);
                if (intendedProvider) {
                  this.router.navigateByUrl('/dash/home');
                } else {
                  this.router.navigateByUrl('/client/reservas');
                }
              }
            }
          });
        }, intervalMs);
        return;
      }

      // Flujo legacy: obtener datos temporales para registro por email/contraseña
      const tempData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
        ? sessionStorage.getItem('tempUserData') : null;
      const planData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
        ? sessionStorage.getItem('selectedPlan') : null;
      
      if (!tempData || !planData) {
        this.success = false;
        this.error = 'No se encontraron los datos del usuario. Por favor, regístrate nuevamente.';
        this.loading = false;
        return;
      }

      const userData = JSON.parse(tempData);
      const plan = JSON.parse(planData);

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
            this.error = null;
            this.success = true;
            this.loading = false;
            setTimeout(() => {
              this.router.navigateByUrl('/onboarding');
            }, 3000);
          } else {
            this.success = false;
            this.error = response.error || 'Error al crear la cuenta. Inténtalo nuevamente.';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Registration error:', error);
          if (error.status === 409) {
            this.success = false;
            this.error = 'El email ya está registrado. Inicia sesión en su lugar.';
          } else if (error.status === 400) {
            this.success = false;
            this.error = 'Datos de registro inválidos. Verifica la información.';
          } else if (error.status >= 500) {
            this.success = false;
            this.error = 'Error del servidor. Inténtalo nuevamente en unos minutos.';
          } else {
            this.success = false;
            this.error = error.error?.error || 'Error al crear la cuenta. Contacta al soporte.';
          }
          this.loading = false;
        }
      });
    } catch (parseError) {
      console.error('Error parsing stored data:', parseError);
      this.success = false;
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
