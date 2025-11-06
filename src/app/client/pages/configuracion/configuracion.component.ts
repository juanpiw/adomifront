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
import { ClientSettingsService } from '../../services/client-settings.service';

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
  preferencesLoading = false;
  preferencesMessage = '';
  preferencesMessageType: 'success' | 'error' | 'info' | '' = '';

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

  paymentLinks: SettingLink[] = [
    {
      id: 'payment-methods',
      label: 'Métodos de Pago',
      description: 'Administra tus tarjetas guardadas',
      action: 'navigate',
      route: '/client/pagos'
    },
    {
      id: 'payment-history',
      label: 'Historial de Pagos',
      description: 'Ver recibos y transacciones pasadas',
      action: 'navigate',
      route: '/client/pagos'
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
    private auth: AuthService,
    private clientSettings: ClientSettingsService
  ) {}

  ngOnInit() {
    this.loadPreferences();
  }

  onPreferenceChanged(event: {setting: string, value: boolean}) {
    const key: 'promotionalEmails' | 'pushNotifications' =
      event.setting === 'promotional-emails' ? 'promotionalEmails' : 'pushNotifications';
    const previousValue = this.preferences[key];

    this.preferences = {
      ...this.preferences,
      [key]: event.value
    };

    this.persistPreferencesLocal(this.preferences);
    this.preferencesLoading = true;
    this.preferencesMessage = '';
    this.preferencesMessageType = '';

    this.clientSettings.updateNotificationPreferences({
      pushNotifications: this.preferences.pushNotifications,
      promotionalEmails: this.preferences.promotionalEmails
    }).subscribe({
      next: (response) => {
        this.preferencesLoading = false;
        if (response?.success && response.preferences) {
          this.preferences = response.preferences;
          this.persistPreferencesLocal(this.preferences);
          this.preferencesMessage = `${this.getSettingLabel(event.setting)} ${event.value ? 'activado' : 'desactivado'}`;
          this.preferencesMessageType = 'success';
        } else {
          this.preferences[key] = previousValue;
          this.preferencesMessage = response?.error || 'No se pudo actualizar la preferencia.';
          this.preferencesMessageType = 'error';
        }
      },
      error: (error) => {
        this.preferencesLoading = false;
        this.preferences[key] = previousValue;
        this.preferencesMessage = error?.message || 'No se pudo actualizar la preferencia.';
        this.preferencesMessageType = 'error';
        this.persistPreferencesLocal(this.preferences);
      }
    });
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

  onPaymentLinkClicked(link: SettingLink) {
    if (link.id === 'payment-methods') {
      this.router.navigate(['/client/pagos'], { queryParams: { view: 'methods' } });
      return;
    }

    if (link.id === 'payment-history') {
      this.router.navigate(['/client/pagos'], { queryParams: { view: 'history' } });
      return;
    }

    if (link.route) {
      this.router.navigate([link.route]);
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
    this.preferencesLoading = true;
    this.preferencesMessage = '';
    this.preferencesMessageType = '';

    this.clientSettings.getNotificationPreferences().subscribe({
      next: (response) => {
        this.preferencesLoading = false;

        if (response?.success && response.preferences) {
          this.preferences = response.preferences;
          this.persistPreferencesLocal(this.preferences);
        } else {
          this.applyPreferencesFromCache();
          this.preferencesMessage = response?.error || 'No se pudieron obtener las preferencias. Mostrando valores locales.';
          this.preferencesMessageType = 'error';
        }
      },
      error: (error) => {
        this.preferencesLoading = false;
        this.applyPreferencesFromCache();
        this.preferencesMessage = error?.message || 'No se pudieron obtener las preferencias. Mostrando valores locales.';
        this.preferencesMessageType = 'error';
      }
    });
  }

  private applyPreferencesFromCache() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('adomiSettings');
      if (stored) {
        try {
          const settings = JSON.parse(stored);
          this.preferences = {
            pushNotifications: settings['push-notifications'] ?? true,
            promotionalEmails: settings['promotional-emails'] ?? false
          };
        } catch {}
      }
    }
  }

  private persistPreferencesLocal(prefs: NotificationPreferences) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const settings = {
          'push-notifications': prefs.pushNotifications,
          'promotional-emails': prefs.promotionalEmails
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