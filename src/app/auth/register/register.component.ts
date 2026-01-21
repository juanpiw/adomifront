import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthResponse, RegisterPayload } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { ErrorHandlerService, ErrorDetails } from '../../core/services/error-handler.service';
import { GoogleAuthService } from '../services/google-auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  selectedRole: 'client' | 'provider' = 'client';
  currentStep: number = 1; // Nuevo: control de pasos
  emailError: string | null = null;
  passwordError: string | null = null;
  confirmPasswordError: string | null = null;
  nameError: string | null = null;
  loading = false;
  serverError: string | null = null;
  serverSuccess: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  termsAccepted = false;
  showLoginLink = false;
  
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private session = inject(SessionService);
  private errorHandler = inject(ErrorHandlerService);
  private googleAuth = inject(GoogleAuthService);

  ngOnInit() {
    // Si ya está autenticado, redirigir al dashboard correspondiente
    if (this.session.isLoggedIn()) {
      this.redirectToDashboard();
    }
    
    // Verificar si los términos ya fueron aceptados
    this.checkTermsAccepted();
    
    // ✅ Verificar query parameters para errores de Google OAuth / preselecciones (Fundador, role, promo)
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.handleGoogleOAuthError(params);
      }

      // Prefill role/email/promo desde Home (Fundador)
      const roleParam = String(params['role'] || '').toLowerCase();
      const planParam = String(params['plan'] || '').toLowerCase();
      const promoParam = String(params['promo'] || '').trim();
      const emailParam = String(params['email'] || '').trim();

      if (emailParam && !this.email) {
        this.email = emailParam;
      }

      const forceProvider = roleParam === 'provider' || planParam === 'fundador';
      if (forceProvider && this.selectedRole !== 'provider') {
        // Mueve al flujo de proveedor (paso 2) automáticamente
        this.setRole('provider');
      }

      if (promoParam) {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('promoCode', promoParam.toUpperCase());
          }
        } catch {}
      }
    });
  }

  private handleGoogleOAuthError(params: any) {
    console.log('[REGISTER] Error de Google OAuth:', params);
    
    switch(params['error']) {
      case 'email_already_exists':
        const existingRole = params['existing_role'];
        const attemptedRole = params['attempted_role'];
        const email = params['email'];
        
        // Mensaje unificado: ya tienes cuenta, inicia sesión
        this.serverError = `Ya tienes una cuenta como ${existingRole === 'client' ? 'Cliente' : 'Profesional'}. ` +
          `¿Deseas iniciar sesión en su lugar?`;
        
        // Mostrar botón de login
        this.showLoginLink = true;
        break;
        
      case 'email_exists_with_different_role':
        // Mantener compatibilidad con el error anterior
        const existingRoleOld = params['existing_role'];
        const attemptedRoleOld = params['attempted_role'];
        
        this.serverError = `Ya tienes una cuenta como ${existingRoleOld === 'client' ? 'Cliente' : 'Profesional'}. ` +
          `¿Deseas iniciar sesión en su lugar?`;
        
        this.showLoginLink = true;
        break;
        
      case 'google_auth_failed':
        this.serverError = 'Error al autenticar con Google. Inténtalo nuevamente.';
        break;
        
      default:
        this.serverError = 'Error durante el registro con Google. Inténtalo nuevamente.';
    }
  }

  checkTermsAccepted() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      this.termsAccepted = sessionStorage.getItem('termsAccepted') === 'true';
    }
  }

  setRole(role: 'client'|'provider') {
    console.log('[REGISTER] setRole llamado con:', role);
    console.log('[REGISTER] currentStep antes:', this.currentStep);
    this.selectedRole = role;
    this.clearErrors();
    
    // Avanzar al siguiente paso después de seleccionar rol
    setTimeout(() => {
      this.currentStep = 2;
      console.log('[REGISTER] currentStep después:', this.currentStep);
      console.log('[REGISTER] selectedRole final:', this.selectedRole);
    }, 300); // Pequeño delay para que se vea la selección
  }

  goBackToStep1() {
    this.currentStep = 1;
    this.clearErrors();
  }

  onRegister() {
    console.log('🟢 [REGISTER] onRegister start', {
      role: this.selectedRole,
      name: this.name,
      email: this.email,
      ts: new Date().toISOString()
    });
    this.clearErrors();
    
    if (!this.validateForm()) {
      console.warn('🟠 [REGISTER] Validación falló', {
        nameError: this.nameError,
        emailError: this.emailError,
        passwordError: this.passwordError,
        confirmPasswordError: this.confirmPasswordError
      });
      return;
    }
    
    // Si es cliente, registro directo sin pago
    if (this.selectedRole === 'client') {
      this.registerClient();
    } else {
      // Si es proveedor, ir a selección de planes
      this.goToPlanSelection();
    }
  }

  private validateForm(): boolean {
    let isValid = true;

    // Validar nombre
    if (!this.name.trim()) {
      this.nameError = 'El nombre es requerido';
      isValid = false;
    } else if (this.name.trim().length < 2) {
      this.nameError = 'El nombre debe tener al menos 2 caracteres';
      isValid = false;
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.name.trim())) {
      this.nameError = 'El nombre solo puede contener letras y espacios';
      isValid = false;
    }

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
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.password)) {
      this.passwordError = 'Debe contener al menos una letra minúscula, una mayúscula y un número';
      isValid = false;
    }

    // Validar confirmación de contraseña
    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Confirma tu contraseña';
      isValid = false;
    } else if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
      isValid = false;
    }

    return isValid;
  }

  private clearErrors() {
    this.emailError = null;
    this.passwordError = null;
    this.confirmPasswordError = null;
    this.nameError = null;
    this.serverError = null;
    this.serverSuccess = null;
    this.showLoginLink = false;
  }

  private registerClient() {
    this.loading = true;
    
    const registerPayload: RegisterPayload = {
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      role: this.selectedRole
    };

    console.log('🟢 [REGISTER] registerClient payload:', registerPayload);

    this.auth.register(registerPayload).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        console.log('🟢 [REGISTER] Respuesta subscribe next:', response);
        
        if (response.success && response.user) {
          // El AuthService ya maneja el guardado del usuario y tokens
          this.serverSuccess = '¡Registro exitoso! Inicia sesión para continuar.';
          // Redirigir al login para que el usuario ingrese credenciales
          setTimeout(() => {
            this.router.navigate(['/auth/login'], {
              queryParams: { registered: '1', email: this.email.trim().toLowerCase() }
            });
          }, 1200);
        } else {
          this.serverError = response.error || 'Error al registrarse';
          console.warn('🟠 [REGISTER] Respuesta sin success/user, serverError:', this.serverError);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('🔴 [REGISTER] Error en subscribe:', err);
        this.handleRegisterError(err);
      }
    });
  }

  private goToPlanSelection() {
    const tempUserData = {
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      role: this.selectedRole
    };
    
    // Guardar datos temporalmente en sessionStorage
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('tempUserData', JSON.stringify(tempUserData));
    }
    
    // Redirigir a selección de planes
    this.router.navigateByUrl('/auth/select-plan');
  }

  private handleRegisterError(err: any) {
    console.error('Register error:', err);
    
    const errorDetails: ErrorDetails = this.errorHandler.handleRegisterError(err);
    
    // Si hay un error de campo específico, mostrarlo en el campo correspondiente
    if (errorDetails.field) {
      switch (errorDetails.field) {
        case 'name':
          this.nameError = errorDetails.message;
          break;
        case 'email':
          this.emailError = errorDetails.message;
          break;
        case 'password':
          this.passwordError = errorDetails.message;
          break;
        case 'confirmPassword':
          this.confirmPasswordError = errorDetails.message;
          break;
      }
    } else {
      // Mostrar error general
      this.serverError = this.errorHandler.getFriendlyMessage(errorDetails);
      
      // ✅ Si es error 409 (email ya existe), mostrar botón de login
      if (err.status === 409) {
        this.showLoginLink = true;
      }
    }

    // Si el error requiere reautenticación, limpiar sesión
    if (this.errorHandler.requiresReauth(errorDetails)) {
      this.session.clearSession();
    }
  }

  private redirectToDashboard() {
    const user = this.session.getCurrentUser();
    if (!user) return;

    if (user.role === 'provider') {
      this.router.navigateByUrl('/dash/home');
    } else {
      this.router.navigateByUrl('/client/reservas');
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Método para limpiar el formulario
  clearForm() {
    this.name = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.selectedRole = 'client';
    this.clearErrors();
  }

  // Método para ir a login
  goToLogin() {
    this.router.navigateByUrl('/auth/login');
  }

  // Métodos de validación para el template
  hasLowerCase(password: string): boolean {
    return /[a-z]/.test(password);
  }

  hasUpperCase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  hasNumber(password: string): boolean {
    return /\d/.test(password);
  }

  // Método para registro con Google
  signUpWithGoogle() {
    console.log('[REGISTER] Iniciando registro con Google para rol:', this.selectedRole);
    console.log('[REGISTER] Datos que se enviarán al backend:', {
      role: this.selectedRole,
      mode: 'register',
      step: this.currentStep
    });
    
    if (!this.googleAuth.isGoogleAuthAvailable()) {
      this.serverError = 'Autenticación con Google no está disponible en este momento.';
      return;
    }

    if (!this.selectedRole) {
      this.serverError = 'Por favor, selecciona un rol antes de continuar.';
      return;
    }

    // Guardar el modo de autenticación en sessionStorage para el callback
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('googleAuthMode', 'register');
      console.log('[REGISTER] Guardado googleAuthMode = register en sessionStorage');
    }

    // Usar el rol seleccionado y modo 'register' para CREAR cuenta
    this.googleAuth.signInWithGoogle(this.selectedRole, 'register');
  }

  // Método para registro con Google directamente desde selección de rol
  signUpWithGoogleFromRoleSelection(role: 'client'|'provider') {
    console.log('[REGISTER] Registro con Google desde selección de rol:', role);
    this.selectedRole = role;
    
    if (!this.googleAuth.isGoogleAuthAvailable()) {
      this.serverError = 'Autenticación con Google no está disponible en este momento.';
      return;
    }

    // Guardar el modo de autenticación en sessionStorage para el callback
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('googleAuthMode', 'register');
      console.log('[REGISTER] Guardado googleAuthMode = register en sessionStorage');
    }

    // Usar el rol seleccionado y modo 'register' para CREAR cuenta
    this.googleAuth.signInWithGoogle(role, 'register');
  }

  goToTerms() {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/terminos']));
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}