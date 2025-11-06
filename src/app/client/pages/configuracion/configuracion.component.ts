import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SettingsHeaderComponent,
  AccountProfileSectionComponent,
  PaymentsBillingSectionComponent,
  PreferencesNotificationsSectionComponent,
  SupportLegalSectionComponent,
  SettingLink,
  NotificationPreferences
} from '../../../../libs/shared-ui/settings';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-client-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    SettingsHeaderComponent,
    FormsModule,
    AccountProfileSectionComponent,
    PaymentsBillingSectionComponent,
    PreferencesNotificationsSectionComponent,
    SupportLegalSectionComponent
  ],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ClientConfiguracionComponent implements OnInit {
  @ViewChild('securitySection') private securitySectionRef?: ElementRef<HTMLElement>;

  preferences: NotificationPreferences = {
    pushNotifications: true,
    promotionalEmails: false
  };

  accountLinks: SettingLink[] = [
    {
      id: 'edit-profile',
      label: 'Editar Información Personal',
      description: 'Nombre, email, teléfono',
      action: 'navigate',
      route: '/client/perfil'
    },
    {
      id: 'security',
      label: 'Seguridad y Contraseña',
      description: 'Cambiar contraseña, autenticación de dos factores',
      action: 'navigate'
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      description: 'Desconéctate de tu cuenta',
      action: 'logout',
      isDanger: true
    }
  ];

  showSecurityPanel = false;
  securitySubmitting = false;
  securityMessage = '';
  securityMessageType: 'success' | 'error' | '' = '';
  securityForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.loadPreferences();
  }

  onPreferenceChanged(event: {setting: string, value: boolean}) {
    this.preferences = {
      ...this.preferences,
      [event.setting]: event.value
    };
    this.savePreferences();
    this.showFeedback(`${this.getSettingLabel(event.setting)} ${event.value ? 'activado' : 'desactivado'}`);
  }

  onLinkClicked(link: SettingLink) {
    if (link.id === 'security') {
      this.toggleSecurityPanel(true);
      return;
    }

    switch (link.action) {
      case 'navigate':
        if (link.route) {
          this.router.navigate([link.route]);
        }
        break;
      case 'logout':
        this.handleLogout();
        break;
      case 'external':
        if (link.url) {
          window.open(link.url, '_blank');
        }
        break;
    }
  }

  onCloseSecurityPanel(): void {
    this.toggleSecurityPanel(false);
  }

  submitSecurityForm(): void {
    if (this.securitySubmitting) {
      return;
    }

    this.securityMessage = '';
    this.securityMessageType = '';

    const { currentPassword, newPassword, confirmPassword } = this.securityForm;

    if (!newPassword || newPassword.length < 6) {
      this.securityMessage = 'La nueva contraseña debe tener al menos 6 caracteres.';
      this.securityMessageType = 'error';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.securityMessage = 'Las contraseñas no coinciden.';
      this.securityMessageType = 'error';
      return;
    }

    this.securitySubmitting = true;

    this.auth.changePassword(newPassword, currentPassword || undefined).subscribe({
      next: (response) => {
        this.securitySubmitting = false;

        if (response?.success) {
          this.securityMessage = response.message || 'Contraseña actualizada correctamente.';
          this.securityMessageType = 'success';
          this.securityForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          return;
        }

        this.securityMessage = response?.error || 'No se pudo actualizar la contraseña.';
        this.securityMessageType = 'error';
      },
      error: (error) => {
        this.securitySubmitting = false;
        this.securityMessage = error?.message || 'No se pudo actualizar la contraseña.';
        this.securityMessageType = 'error';
      }
    });
  }

  private toggleSecurityPanel(show: boolean): void {
    this.showSecurityPanel = show;

    if (show) {
      this.securityMessage = '';
      this.securityMessageType = '';
      setTimeout(() => {
        this.securitySectionRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      this.securitySubmitting = false;
      this.securityMessage = '';
      this.securityMessageType = '';
      this.securityForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
  }

  private handleLogout() {
    this.showFeedback('Cerrando sesión...', 'info');

    this.auth.logout().subscribe({
      next: () => {
        this.showFeedback('Sesión cerrada correctamente', 'success');
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.showFeedback('Sesión finalizada', 'warning');
        this.router.navigateByUrl('/');
      }
    });
  }

  private getSettingLabel(setting: string): string {
    const labels: {[key: string]: string} = {
      'push-notifications': 'Notificaciones Push',
      'promotional-emails': 'Correos Promocionales'
    };
    return labels[setting] || setting;
  }

  private loadPreferences() {
    // Verificar si estamos en el navegador antes de acceder a localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('adomiSettings');
        if (stored) {
          const settings = JSON.parse(stored);
          this.preferences = {
            pushNotifications: settings['push-notifications'] ?? true,
            promotionalEmails: settings['promotional-emails'] ?? false
          };
        }
      } catch (error) {
        console.error('Error al cargar preferencias:', error);
      }
    }
  }

  private savePreferences() {
    // Verificar si estamos en el navegador antes de acceder a localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const settings = {
          'push-notifications': this.preferences.pushNotifications,
          'promotional-emails': this.preferences.promotionalEmails
        };
        localStorage.setItem('adomiSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error al guardar preferencias:', error);
      }
    }
  }

  private showFeedback(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    // Aquí se podría implementar un sistema de toast/feedback
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}