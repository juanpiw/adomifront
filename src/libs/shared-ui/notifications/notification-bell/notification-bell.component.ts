import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { IconComponent } from '../../icon/icon.component';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/notification.model';

@Component({
  selector: 'ui-notification-bell',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<Notification>();

  unreadCount: number = 0;
  hasUnreadNotifications: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Suscribirse al contador de notificaciones no leídas
    this.subscriptions.push(
      this.notificationService.getUnreadCount().subscribe(count => {
        this.unreadCount = count;
        this.hasUnreadNotifications = count > 0;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleNotifications(): void {
    this.toggle.emit();
  }

  onNotificationClick(notification: Notification): void {
    this.notificationClick.emit(notification);
  }
}




