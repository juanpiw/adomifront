import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchSuggestion, SuggestionCategory } from '../models/search-suggestion.model';
import { IconComponent, IconName } from '../../icon/icon.component';

@Component({
  selector: 'ui-search-suggestion-item',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './search-suggestion-item.component.html',
  styleUrls: ['./search-suggestion-item.component.scss']
})
export class SearchSuggestionItemComponent {
  @Input() suggestion!: SearchSuggestion;
  @Output() click = new EventEmitter<SearchSuggestion>();

  constructor(private router: Router) {}

  onSuggestionClick(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.suggestion?.link) {
      this.router.navigateByUrl(this.suggestion.link);
    }
    this.click.emit(this.suggestion);
  }

  getCategoryIcon(category: SuggestionCategory): IconName {
    const icons: Record<SuggestionCategory, IconName> = {
      'profile': 'user',
      'agenda': 'calendar',
      'income': 'money',
      'services': 'briefcase',
      'settings': 'settings',
      'help': 'help-circle',
      'dashboard': 'home',
      'notifications': 'bell',
      'messages': 'message',
      'reports': 'chart',
      'analytics': 'trending-up'
    };
    return icons[category] || 'help-circle';
  }

  getCategoryBadgeClass(category: SuggestionCategory): string {
    const classes = {
      'profile': 'bg-blue-100 text-blue-800',
      'agenda': 'bg-green-100 text-green-800',
      'income': 'bg-yellow-100 text-yellow-800',
      'services': 'bg-purple-100 text-purple-800',
      'settings': 'bg-gray-100 text-gray-800',
      'help': 'bg-indigo-100 text-indigo-800',
      'dashboard': 'bg-slate-100 text-slate-800',
      'notifications': 'bg-red-100 text-red-800',
      'messages': 'bg-cyan-100 text-cyan-800',
      'reports': 'bg-orange-100 text-orange-800',
      'analytics': 'bg-pink-100 text-pink-800'
    };
    return classes[category] || 'bg-indigo-100 text-indigo-800';
  }

  getCategoryLabel(category: SuggestionCategory): string {
    const labels = {
      'profile': 'Perfil',
      'agenda': 'Agenda',
      'income': 'Ingresos',
      'services': 'Servicios',
      'settings': 'Configuración',
      'help': 'Ayuda',
      'dashboard': 'Dashboard',
      'notifications': 'Notificaciones',
      'messages': 'Mensajes',
      'reports': 'Reportes',
      'analytics': 'Analíticas'
    };
    return labels[category] || 'Ayuda';
  }
}
