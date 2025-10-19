import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { IconComponent } from '../../icon/icon.component';
import { NotificationService } from '../services/notification.service';
import { Notification, NotificationFilters } from '../models/notification.model';

@Component({
  selector: 'ui-notification-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      })),
      state('out', style({
        opacity: 0,
        transform: 'scale(0.95) translateY(-10px)'
      })),
      transition('in => out', animate('200ms ease-in')),
      transition('out => in', animate('200ms ease-out'))
    ])
  ]
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() markAsRead = new EventEmitter<string>();
  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<Notification>();

  notifications: Notification[] = [];
  unreadNotifications: Notification[] = [];
  readNotifications: Notification[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Cargar notificaciones
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadNotifications(): void {
    this.subscriptions.push(
      this.notificationService.getNotifications().subscribe(notifications => {
        this.notifications = notifications;
        this.unreadNotifications = notifications.filter(n => n.status === 'unread');
        this.readNotifications = notifications.filter(n => n.status === 'read');
      })
    );
  }

  onMarkAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
    this.markAsRead.emit(notificationId);
  }

  onMarkAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.markAllAsRead.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  onNotificationClick(notification: Notification): void {
    // Marcar como leída si no lo está
    if (notification.status === 'unread') {
      this.onMarkAsRead(notification.id);
    }
    
    this.notificationClick.emit(notification);
  }

  onViewAllNotifications(): void {
    // TODO: Navegar a página completa de notificaciones
    console.log('Ver todas las notificaciones');
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  }

  getPriorityColor(priority: string): string {
    const colors = {
      'low': '#6b7280',
      'medium': '#f59e0b',
      'high': '#ef4444',
      'urgent': '#dc2626'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  }
}







