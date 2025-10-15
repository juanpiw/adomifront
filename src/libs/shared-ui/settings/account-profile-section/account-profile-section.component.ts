import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SettingLink } from '../interfaces';

@Component({
  selector: 'ui-account-profile-section',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './account-profile-section.component.html',
  styleUrls: ['./account-profile-section.component.scss']
})
export class AccountProfileSectionComponent {
  @Input() profileLinks: SettingLink[] = [
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
      action: 'navigate',
      route: '/client/seguridad'
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      description: 'Desconéctate de tu cuenta',
      action: 'logout',
      isDanger: true
    }
  ];
  
  @Output() linkClicked = new EventEmitter<SettingLink>();

  onLinkClick(link: SettingLink) {
    this.linkClicked.emit(link);
  }
}






