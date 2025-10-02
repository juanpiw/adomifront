import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UiInputComponent } from '../../../libs/shared-ui/ui-input/ui-input.component';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { AuthService, ResetPasswordResponse } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterLink, UiInputComponent, ThemeSwitchComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  token = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  passwordError = '';
  confirmPasswordError = '';
  
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // Obtener el token de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage = 'Token de recuperación no válido o faltante';
      }
    });
  }

  submit() {
    // Limpiar mensajes anteriores
    this.successMessage = '';
    this.errorMessage = '';
    this.passwordError = '';
    this.confirmPasswordError = '';

    // Validaciones
    if (!this.password) {
      this.passwordError = 'La contraseña es requerida';
      return;
    }

    if (this.password.length < 6) {
      this.passwordError = 'Mínimo 6 caracteres';
      return;
    }

    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Confirma tu contraseña';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (response: ResetPasswordResponse) => {
        this.loading = false;
        this.successMessage = 'Contraseña restablecida exitosamente. Redirigiendo al login...';
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        console.error('reset password error', err);
        
        if (err.status === 400) {
          this.errorMessage = 'Token inválido o expirado. Solicita un nuevo enlace de recuperación';
        } else if (err.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        } else {
          this.errorMessage = 'Error al restablecer la contraseña. Inténtalo nuevamente';
        }
      }
    });
  }
}

