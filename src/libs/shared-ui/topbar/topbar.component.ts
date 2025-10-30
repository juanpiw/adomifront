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
    userProfile: 'client'
  };
  @Input() cashNotice: { amount: number; currency?: string; dueDateLabel?: string; status?: string } | null = null;

  @Output() helpClick = new EventEmitter<string>();
  @Output() hamburgerClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<void>();
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

  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  onSettingsClick(): void {
    this.settingsClick.emit();
  }

  onNotificationAction(notification: Notification): void {
    this.notificationAction.emit(notification);
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
}
