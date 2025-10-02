import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiInputComponent } from '../../../libs/shared-ui/ui-input/ui-input.component';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { AuthService, ForgotPasswordResponse } from '../services/auth.service';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, RouterLink, UiInputComponent, ThemeSwitchComponent],
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent {
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  emailError = '';
  
  private auth = inject(AuthService);

  submit() {
    // Limpiar mensajes anteriores
    this.successMessage = '';
    this.errorMessage = '';
    this.emailError = '';

    // Validaciones
    if (!this.email) {
      this.emailError = 'El email es requerido';
      return;
    }

    if (!/.+@.+\..+/.test(this.email)) {
      this.emailError = 'Email inválido';
      return;
    }

    this.loading = true;

    this.auth.forgotPassword(this.email).subscribe({
      next: (response: ForgotPasswordResponse) => {
        this.loading = false;
        this.successMessage = response.message;
      },
      error: (err) => {
        this.loading = false;
        console.error('forgot password error', err);
        
        if (err.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        } else {
          this.errorMessage = 'Error al enviar el email. Inténtalo nuevamente';
        }
      }
    });
  }
}
