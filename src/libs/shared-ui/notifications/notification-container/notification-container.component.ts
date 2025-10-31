import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { NotificationService } from '../services/notification.service';
import { Notification, UserProfile } from '../models/notification.model';

@Component({
  selector: 'ui-notification-container',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent, NotificationPanelComponent],
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.scss']
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  @Input() userProfile: UserProfile = 'client';
  @Output() notificationClick = new EventEmitter<Notification>();

  isOpen: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Configurar el perfil de usuario
    console.log('🔔 [NOTIFICATION_CONTAINER] ngOnInit perfil:', this.userProfile);
    this.notificationService.setUserProfile(this.userProfile);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const container = target.closest('.notification-container');
    
    if (!container && this.isOpen) {
      this.closePanel();
    }
  }

  togglePanel(): void {
    console.log('🔔 [NOTIFICATION_CONTAINER] togglePanel antes:', this.isOpen);
    this.isOpen = !this.isOpen;
    console.log('🔔 [NOTIFICATION_CONTAINER] togglePanel después:', this.isOpen);
  }

  closePanel(): void {
    if (this.isOpen) {
      console.log('🔔 [NOTIFICATION_CONTAINER] closePanel cerrando panel');
    }
    this.isOpen = false;
  }

  onNotificationClick(notification: Notification): void {
    console.log('🔔 [NOTIFICATION_CONTAINER] onNotificationClick', notification?.id, notification?.title);
    this.closePanel();
    
    // Navegar si hay un enlace
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
    
    // Emitir evento para el componente padre
    this.notificationClick.emit(notification);
  }

  onMarkAsRead(notificationId: string): void {
    console.log('🔔 [NOTIFICATION_CONTAINER] onMarkAsRead', notificationId);
    this.notificationService.markAsRead(notificationId);
  }

  onMarkAllAsRead(): void {
    console.log('🔔 [NOTIFICATION_CONTAINER] onMarkAllAsRead');
    this.notificationService.markAllAsRead();
  }

  // Métodos para crear notificaciones de ejemplo (para testing)
  createSampleNotification(): void {
    console.log('🔔 [NOTIFICATION_CONTAINER] createSampleNotification');
    this.notificationService.createNotification({
      type: 'appointment',
      profile: this.userProfile,
      title: 'Nueva notificación de prueba',
      message: 'Esta es una notificación de ejemplo creada para testing',
      priority: 'medium',
      actions: ['view']
    });
  }
}











