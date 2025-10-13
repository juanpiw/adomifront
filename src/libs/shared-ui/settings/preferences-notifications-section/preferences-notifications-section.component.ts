import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { ToggleSetting, NotificationPreferences } from '../interfaces';

@Component({
  selector: 'ui-preferences-notifications-section',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './preferences-notifications-section.component.html',
  styleUrls: ['./preferences-notifications-section.component.scss']
})
export class PreferencesNotificationsSectionComponent {
  @Input() preferences: NotificationPreferences = {
    pushNotifications: true,
    promotionalEmails: false
  };
  
  @Output() preferenceChanged = new EventEmitter<{setting: string, value: boolean}>();

  get toggleSettings(): ToggleSetting[] {
    return [
      {
        id: 'push-notifications',
        label: 'Notificaciones Push',
        description: 'Alertas sobre citas y cambios de estado',
        value: this.preferences.pushNotifications,
        onChange: (value: boolean) => this.onToggleChange('push-notifications', value)
      },
      {
        id: 'promotional-emails',
        label: 'Recibir Correos Promocionales',
        description: 'Ofertas y novedades de Adomi',
        value: this.preferences.promotionalEmails,
        onChange: (value: boolean) => this.onToggleChange('promotional-emails', value)
      }
    ];
  }

  onToggleChange(setting: string, value: boolean) {
    this.preferenceChanged.emit({ setting, value });
  }
}




