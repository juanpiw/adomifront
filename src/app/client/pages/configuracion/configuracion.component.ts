import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-client-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    SettingsHeaderComponent,
    AccountProfileSectionComponent,
    PaymentsBillingSectionComponent,
    PreferencesNotificationsSectionComponent,
    SupportLegalSectionComponent
  ],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ClientConfiguracionComponent implements OnInit {
  // Preferencias de notificaciones
  preferences: NotificationPreferences = {
    pushNotifications: true,
    promotionalEmails: false
  };

  constructor(private router: Router) {}

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

  private handleLogout() {
    // Aquí se implementaría la lógica de logout
    console.log('Cerrando sesión...');
    this.showFeedback('Cerrando sesión...', 'info');
    // this.authService.logout();
  }

  private getSettingLabel(setting: string): string {
    const labels: {[key: string]: string} = {
      'push-notifications': 'Notificaciones Push',
      'promotional-emails': 'Correos Promocionales'
    };
    return labels[setting] || setting;
  }

  private loadPreferences() {
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

  private savePreferences() {
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

  private showFeedback(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    // Aquí se podría implementar un sistema de toast/feedback
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}