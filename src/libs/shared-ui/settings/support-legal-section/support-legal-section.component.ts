import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SettingLink } from '../interfaces';

@Component({
  selector: 'ui-support-legal-section',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './support-legal-section.component.html',
  styleUrls: ['./support-legal-section.component.scss']
})
export class SupportLegalSectionComponent {
  @Input() supportLinks: SettingLink[] = [
    {
      id: 'faq',
      label: 'Preguntas Frecuentes (FAQ)',
      description: 'Encuentra respuestas rápidas',
      action: 'navigate',
      route: '/client/faq'
    },
    {
      id: 'terms',
      label: 'Términos y Condiciones',
      description: 'Política de uso de la aplicación',
      action: 'external',
      url: '/terminos-y-condiciones'
    },
    {
      id: 'privacy',
      label: 'Política de Privacidad',
      description: 'Cómo manejamos tus datos',
      action: 'external',
      url: '/politica-de-privacidad'
    }
  ];
  
  @Output() linkClicked = new EventEmitter<SettingLink>();

  onLinkClick(link: SettingLink) {
    this.linkClicked.emit(link);
  }
}






