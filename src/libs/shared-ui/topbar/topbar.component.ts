import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { NotificationContainerComponent } from '../notifications/notification-container/notification-container.component';
import { Notification, UserProfile } from '../notifications/models/notification.model';
import { GlobalSearchModalComponent } from '../global-search/global-search-modal/global-search-modal.component';
import { SearchSuggestion } from '../global-search/models/search-suggestion.model';

export interface TopbarConfig {
  showSearch?: boolean;
  showHamburger?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  helpContext?: string; // Contexto de ayuda (ej: 'dashboard', 'explorar', 'perfil')
  userProfile?: UserProfile; // Perfil del usuario para notificaciones
  planBadge?: {
    label: string;
    variant?: 'founder' | 'default';
  } | null;
  verificationBadge?: {
    label: string;
    variant?: 'verified' | 'pending' | 'rejected';
    tooltip?: string;
    link?: string;
  } | null;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, NotificationContainerComponent, GlobalSearchModalComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  @Input() config: TopbarConfig = {
    showSearch: true,
    showHamburger: true,
    showNotifications: true,
    showSettings: true,
    searchPlaceholder: '¿Necesitas ayuda?',
    searchValue: '',
    helpContext: 'general',
    userProfile: 'client',
    planBadge: null,
    verificationBadge: null
  };
  @Input() cashNotice: {
    amount: number;
    currency?: string;
    dueDateLabel?: string;
    status?: 'pending' | 'overdue' | 'under_review' | 'rejected';
    overdueAmount?: number;
    manualStatus?: 'under_review' | 'paid' | 'rejected' | null;
    manualUpdatedAt?: string | null;
  } | null = null;

  @Output() helpClick = new EventEmitter<string>();
  @Output() hamburgerClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() notificationAction = new EventEmitter<Notification>();
  @Output() searchSuggestionClick = new EventEmitter<SearchSuggestion>();

  isConversacionesRoute = false;
  isSearchModalOpen = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Detectar si estamos en la ruta de conversaciones
    this.router.events.subscribe(() => {
      this.isConversacionesRoute = this.router.url.includes('/client/conversaciones');
    });
    
    // Verificar la ruta inicial
    this.isConversacionesRoute = this.router.url.includes('/client/conversaciones');
  }

  onHelpClick(): void {
    this.isSearchModalOpen = true;
    this.helpClick.emit(this.config.helpContext || 'general');
  }

  onHamburgerClick(): void {
    this.hamburgerClick.emit();
  }

  onNotificationClick(notification: Notification): void {
    // Reemitimos hacia el padre para navegación contextual
    this.notificationClick.emit(notification);
    // Mantener compatibilidad con quien escuche notificationAction
    this.notificationAction.emit(notification);
  }

  onSettingsClick(): void {
    this.settingsClick.emit();
  }

  onNotificationAction(notification: Notification): void {
    // Alias para compatibilidad: ambos eventos entregan la notificación
    this.onNotificationClick(notification);
  }

  onSearchModalClose(): void {
    this.isSearchModalOpen = false;
  }

  onSearchSuggestionClick(suggestion: SearchSuggestion): void {
    this.searchSuggestionClick.emit(suggestion);
    // Navegar a la sugerencia si tiene un link
    if (suggestion.link) {
      this.router.navigateByUrl(suggestion.link);
    }
  }

  onCashNoticeClick(): void {
    this.router.navigate(['/dash/agenda'], { queryParams: { view: 'cash' } });
  }

  navigateTo(link?: string | null): void {
    if (!link) return;
    if (link.startsWith('http')) {
      if (typeof window !== 'undefined') {
        window.open(link, '_blank');
      }
      return;
    }
    this.router.navigateByUrl(link);
  }
}
