import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GoogleAuthService } from '../services/google-auth.service';
import { AuthService, AuthUser } from '../services/auth.service';
import { ensureTempUserData, needsProviderPlan } from '../utils/provider-onboarding.util';

@Component({
  selector: 'app-google-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-container">
      <div class="success-card">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <div class="spinner-container">
            <div class="spinner"></div>
            <div class="spinner-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <div class="content-section">
            <h2 class="loading-text">Procesando tu cuenta...</h2>
            <p class="subtitle">Estamos configurando todo para ti</p>
          </div>
        </div>
        
        <!-- Success State -->
        <div *ngIf="success" class="success-state">
          <div class="success-icon-container">
            <div class="success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="star-badge">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
          
          <div class="content-section">
            <h2>¡Bienvenido a Adomi!</h2>
            <p class="subtitle">Tu cuenta ha sido creada exitosamente</p>
            <div class="info-box">
              <p class="info-text">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                Autenticación con Google completada
              </p>
            </div>
          </div>
          
          <div class="button-section">
            <button (click)="goToDashboard()" class="btn btn-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
              </svg>
              Ir a Mi Dashboard
            </button>
            
            <p class="countdown-text">
              Te redirigiremos automáticamente en {{ countdown }} segundos
            </p>
          </div>
        </div>
        
        <!-- Error State -->
        <div *ngIf="error" class="error-state">
          <div class="error-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <div class="content-section">
            <h2 class="error-title">Error de Autenticación</h2>
            <p class="error-message">{{ error }}</p>
          </div>
          
          <button (click)="goToLogin()" class="btn btn-secondary">
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./google-success.component.scss']
})
export class GoogleSuccessComponent implements OnInit, OnDestroy {
  loading = true;
  success = false;
  error: string | null = null;
  countdown = 5;
  private countdownInterval: any;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private googleAuth = inject(GoogleAuthService);
  private platformId = inject(PLATFORM_ID);
  private auth = inject(AuthService);

  ngOnInit() {
    // Solo ejecutar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.processSuccessCallback();
    } else {
      // SSR: no-op
    }
  }

  private processSuccessCallback() {
    try {
      // Obtener parámetros de la URL
      const tokenParam = this.route.snapshot.queryParams['token'];
      const refreshParam = this.route.snapshot.queryParams['refresh'];
      const userParam = this.route.snapshot.queryParams['user'];

      if (tokenParam && refreshParam && userParam) {
        const accessToken = decodeURIComponent(tokenParam);
        const refreshToken = decodeURIComponent(refreshParam);

        let user: any = {};
        try {
          user = JSON.parse(decodeURIComponent(userParam));
          // Sembrar googleAuthMode si viene en user.mode
          try {
            if (user && user.mode && typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('googleAuthMode', user.mode);
            }
          } catch {}
        } catch (e) {
          user = {};
        }

        // Guardar tokens y usuario
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('adomi_access_token', accessToken);
          localStorage.setItem('adomi_refresh_token', refreshToken);
          localStorage.setItem('adomi_user', JSON.stringify(user));
        } else {
          // no localStorage available
        }

        this.success = true;
        this.loading = false;

        // Hidratar usuario desde backend para confirmar sesión válida
        this.auth.getCurrentUserInfo().subscribe({
          next: (userInfo) => {
            // Extraer usuario de la respuesta (puede venir como data.user o user)
            const backendUser = (userInfo as any).data?.user || (userInfo as any).user || userInfo.user;

            if (backendUser) {
              // Mezclar datos: conservar intendedRole/pending_role/mode de la URL si el backend no los retorna
              const extras = {
                intendedRole: user?.intendedRole,
                pending_role: user?.pending_role,
                mode: user?.mode
              };
              const mergedUser = { ...backendUser, ...extras };
              localStorage.setItem('adomi_user', JSON.stringify(mergedUser));
            } else {
              // keep URL user
            }
            this.startCountdown();
          },
          error: (error) => {
            this.startCountdown();
          }
        });

      } else {
        throw new Error('Parámetros de autenticación incompletos');
      }

    } catch (error: any) {
      this.error = error.message || 'Error al procesar la autenticación';
      this.loading = false;
    }
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        // Obtener el rol del usuario desde localStorage (parseo seguro)
        try {
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
          const user = raw && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : {};
          this.redirectAfterGoogle(user);
        } catch (e) {
          this.redirectAfterGoogle({});
        }
      }
    }, 1000);
  }

  goToDashboard() {
    clearInterval(this.countdownInterval);
    // Obtener el rol del usuario desde localStorage (parseo seguro)
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
      const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
      this.redirectAfterGoogle(user);
    } catch (e) {
      this.redirectAfterGoogle({});
    }
  }

  private redirectAfterGoogle(user: AuthUser | any) {
    if (!isPlatformBrowser(this.platformId)) return;
    const role = user?.role;
    
    // Determinar si venimos de registro o login (opcional)
    const mode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('googleAuthMode') : null;
    
    // FIX TEMPORAL: Si el usuario está vacío pero tenemos datos en localStorage, usarlos
    if (!user || Object.keys(user).length === 0) {
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
        if (raw && raw !== 'undefined' && raw !== 'null') {
          user = JSON.parse(raw);
        }
      } catch (e) {
      }
    }
    
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('googleAuthMode');
    }

    const finalRole = user?.role;
    const pendingRole = user?.pending_role;
    const intendedRole = user?.intendedRole;
    const requiresPlan = needsProviderPlan(user);

    if (requiresPlan) {
      try {
        ensureTempUserData(user);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('providerOnboarding', '1');
          if (!mode) {
            sessionStorage.setItem('googleAuthMode', 'register');
          }
        }
      } catch (err) {
      }
      if (typeof window !== 'undefined') {
        clearInterval(this.countdownInterval);
        window.location.assign('/auth/select-plan');
        return;
      }
      this.router.navigate(['/auth/select-plan']);
      return;
    }

    if (finalRole === 'provider') {
      this.router.navigate(['/dash']);
      return;
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('providerOnboarding');
    }

    this.router.navigate(['/client/reservas']);
  }

  goToLogin() {
    clearInterval(this.countdownInterval);
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
