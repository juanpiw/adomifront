import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { AuthService, AuthResponse, LoginPayload } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { ErrorHandlerService, ErrorDetails } from '../../core/services/error-handler.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ThemeSwitchComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  emailError = '';
  passwordError = '';
  showPassword = false;
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private session = inject(SessionService);
  private errorHandler = inject(ErrorHandlerService);
  private googleAuth = inject(GoogleAuthService);
  private readonly debug = !environment.production;

  ngOnInit() {
    // Si ya está autenticado, redirigir al dashboard correspondiente
    if (this.session.isLoggedIn()) {
      this.redirectToDashboard();
    }

    // Verificar si hay mensajes por query params (Google Auth o sesión expirada)
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'no_account' && params['message']) {
        this.errorMessage = decodeURIComponent(params['message']);
      }
      if (params['expired'] === '1') {
        this.errorMessage = 'Tu sesión expiró. Por favor, vuelve a iniciar sesión.';
      }
    });
  }

  submit() {
    if (this.debug) {
      console.log('🔵 [LOGIN] submit() start', {
        email: this.email,
        hasPassword: !!this.password,
        ts: new Date().toISOString()
      });
    }
    // Limpiar errores anteriores
    this.clearErrors();

    // Validaciones básicas
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;

    const loginPayload: LoginPayload = {
      email: this.email.trim().toLowerCase(),
      password: this.password
    };

    // Nunca loguear password (ni siquiera en dev)
    if (this.debug) {
      console.log('🔵 [LOGIN] Payload normalizado:', {
        email: loginPayload.email,
        hasPassword: !!loginPayload.password
      });
    }

    this.auth.login(loginPayload)
      .subscribe({
        next: (response: AuthResponse) => { 
          this.loading = false;
          if (this.debug) {
            console.log('🟢 [LOGIN] Respuesta subscribe next:', {
              success: (response as any)?.success,
              hasUser: !!(response as any)?.user,
              userId: (response as any)?.user?.id,
              role: (response as any)?.user?.role
            });
          }
          
          if (response.success && response.user) {
            // El AuthService ya maneja el guardado del usuario y tokens
            this.redirectToDashboard();
          } else {
            this.errorMessage = response.error || 'Error al iniciar sesión';
            if (this.debug) {
              console.warn('🟠 [LOGIN] Respuesta sin success/user, errorMessage seteado:', this.errorMessage);
            }
          }
        },
        error: (err) => {
          this.loading = false;
          if (this.debug) {
            console.error('🔴 [LOGIN] Error en subscribe:', err);
          }
          this.handleLoginError(err);
        }
      });
  }

  private validateForm(): boolean {
    let isValid = true;

    // Validar email
    if (!this.email.trim()) {
      this.emailError = 'El email es requerido';
      isValid = false;
    } else if (!/.+@.+\..+/.test(this.email.trim())) {
      this.emailError = 'Email inválido';
      isValid = false;
    }

    // Validar contraseña
    if (!this.password) {
      this.passwordError = 'La contraseña es requerida';
      isValid = false;
    } else if (this.password.length < 6) {
      this.passwordError = 'Mínimo 6 caracteres';
      isValid = false;
    }

    return isValid;
  }

  private clearErrors() {
    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';
  }

  private handleLoginError(err: any) {
    if (this.debug) {
      console.error('Login error:', err);
    }
    
    const errorDetails: ErrorDetails = this.errorHandler.handleAuthError(err);
    
    // Si hay un error de campo específico, mostrarlo en el campo correspondiente
    if (errorDetails.field) {
      if (errorDetails.field === 'email') {
        this.emailError = errorDetails.message;
      } else if (errorDetails.field === 'password') {
        this.passwordError = errorDetails.message;
      }
    } else {
      // Mostrar error general
      this.errorMessage = this.errorHandler.getFriendlyMessage(errorDetails);
    }

    // Si el error requiere reautenticación, limpiar sesión
    if (this.errorHandler.requiresReauth(errorDetails)) {
      this.session.clearSession();
    }
  }

  private redirectToDashboard() {
    const user = this.session.getCurrentUser();
    if (!user) return;
    
    const providerLike = (() => {
      try {
        const role = String((user as any)?.role || '').toLowerCase();
        const pendingRole = String((user as any)?.pending_role || (user as any)?.pendingRole || '').toLowerCase();
        return role === 'provider' || pendingRole === 'provider';
      } catch {
        return false;
      }
    })();

    // Verificar si es la primera vez (no ha completado onboarding)
    if (!this.session.isOnboardingCompleted()) {
      // Proveedores: enviar al onboarding especial (servicio + horario)
      if (providerLike) {
        this.router.navigateByUrl('/dash/provider-setup');
      } else {
        this.router.navigateByUrl('/onboarding');
      }
    } else {
      // Redirigir al dashboard correspondiente según el rol
      if (user.role === 'provider') {
        this.router.navigateByUrl('/dash/home');
      } else {
        this.router.navigateByUrl('/client/reservas');
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Método para limpiar el formulario
  clearForm() {
    this.email = '';
    this.password = '';
    this.clearErrors();
  }

  // Método para ir a registro
  goToRegister() {
    this.router.navigateByUrl('/auth/register');
  }

  // Método para ir a recuperar contraseña
  goToForgotPassword() {
    this.router.navigateByUrl('/auth/forgot');
  }

  // Método para login con Google
  signInWithGoogle() {
    if (this.debug) {
      console.log('🔵 [LOGIN] ==================== INICIO LOGIN CON GOOGLE ====================');
      console.log('🔵 [LOGIN] Timestamp:', new Date().toISOString());
      console.log('🔵 [LOGIN] localStorage antes del login:', {
        has_access_token: !!localStorage.getItem('adomi_access_token'),
        has_refresh_token: !!localStorage.getItem('adomi_refresh_token'),
        has_user: !!localStorage.getItem('adomi_user')
      });
    }
    
    if (!this.googleAuth.isGoogleAuthAvailable()) {
      if (this.debug) {
        console.error('🔴 [LOGIN] Google Auth NO disponible');
      }
      this.errorMessage = 'Autenticación con Google no está disponible en este momento.';
      return;
    }

    if (this.debug) {
      console.log('🔵 [LOGIN] Google Auth disponible, iniciando proceso...');
      console.log('🔵 [LOGIN] Parámetros: role=client, mode=login');
    }
    
    // Usar modo 'login' - NO crear cuenta si no existe
    this.googleAuth.signInWithGoogle('client', 'login');
  }
}