import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { UiInputComponent } from '../../../libs/shared-ui/ui-input/ui-input.component';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { AuthService, AuthResponse, LoginPayload } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { ErrorHandlerService, ErrorDetails } from '../../core/services/error-handler.service';
import { GoogleAuthService } from '../services/google-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, UiInputComponent, ThemeSwitchComponent],
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

  ngOnInit() {
    // Si ya está autenticado, redirigir al dashboard correspondiente
    if (this.session.isLoggedIn()) {
      this.redirectToDashboard();
    }

    // Verificar si hay error de Google Auth
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'no_account' && params['message']) {
        this.errorMessage = decodeURIComponent(params['message']);
      }
    });
  }

  submit() {
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

    this.auth.login(loginPayload)
      .subscribe({
        next: (response: AuthResponse) => { 
          this.loading = false;
          
          if (response.success && response.user) {
            // El AuthService ya maneja el guardado del usuario y tokens
            this.redirectToDashboard();
          } else {
            this.errorMessage = response.error || 'Error al iniciar sesión';
          }
        },
        error: (err) => {
          this.loading = false;
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
    console.error('Login error:', err);
    
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

    // Verificar si es la primera vez (no ha completado onboarding)
    if (!this.session.isOnboardingCompleted()) {
      this.router.navigateByUrl('/onboarding');
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
    console.log('[LOGIN] Iniciando login con Google');
    
    if (!this.googleAuth.isGoogleAuthAvailable()) {
      this.errorMessage = 'Autenticación con Google no está disponible en este momento.';
      return;
    }

    // Usar modo 'login' - NO crear cuenta si no existe
    this.googleAuth.signInWithGoogle('client', 'login');
  }
}