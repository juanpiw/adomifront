import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../libs/shared-ui/notifications/services/notification.service';
import { Notification } from '../../../libs/shared-ui/notifications/models/notification.model';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  private notifications = inject(NotificationService);
  private router = inject(Router);

  loading = false;
  all: Notification[] = [];
  unread: Notification[] = [];
  read: Notification[] = [];
  displayedUnread: Notification[] = [];
  displayedRead: Notification[] = [];
  pageSize = 25;
  unreadShown = 25;
  readShown = 25;

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loading = true;
    // Cargar snapshot inicial
    this.subs.push(
      this.notifications.getNotifications().subscribe((list) => {
        this.apply(list);
        this.loading = false;
      })
    );
    // Escuchar cambios en tiempo real
    this.subs.push(
      this.notifications.notifications$.subscribe((list) => {
        this.apply(list);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  goBack(): void {
    const profile = this.notifications.getCurrentProfile();
    const fallback = profile === 'provider' ? '/dash/home' : '/client/explorar';
    this.router.navigateByUrl(fallback);
  }

  markAll(): void {
    this.notifications.markAllAsRead();
  }

  onCardClick(n: Notification): void {
    if (n.status === 'unread') {
      this.notifications.markAsRead(n.id);
    }
    // Navegación opcional si hay ruta en metadata
    const targetUrl = n.metadata?.['targetUrl'] || n.metadata?.['url'];
    if (targetUrl) {
      this.router.navigateByUrl(targetUrl).catch(() => {});
    }
  }

  loadMoreUnread(): void {
    this.unreadShown += this.pageSize;
    this.updateSlices();
  }

  loadMoreRead(): void {
    this.readShown += this.pageSize;
    this.updateSlices();
  }

  isEmpty(): boolean {
    return this.all.length === 0;
  }

  private apply(list: Notification[]): void {
    const clean = (list || []).filter((n) => n.status !== 'deleted');
    const sorted = [...clean].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    this.all = sorted;
    this.unread = sorted.filter((n) => n.status === 'unread');
    this.read = sorted.filter((n) => n.status !== 'unread');
    this.updateSlices();
  }

  private updateSlices(): void {
    this.displayedUnread = this.unread.slice(0, this.unreadShown);
    this.displayedRead = this.read.slice(0, this.readShown);
  }

  formatCreatedAt(notification: Notification): string {
    return notification.createdAt.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAppointmentDate(notification: Notification): string | null {
    const md = notification.metadata || {};
    const datePart =
      md['appointmentDate'] ??
      md['appointment_date'] ??
      md['date'];
    if (!datePart) return null;
    const parsed = new Date(datePart);
    return isNaN(parsed.getTime())
      ? String(datePart)
      : parsed.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  getAppointmentTime(notification: Notification): string | null {
    const md = notification.metadata || {};
    const timePart =
      md['appointmentTime'] ??
      md['appointment_time'] ??
      md['time'] ??
      md['start_time'];
    if (!timePart) return null;
    const str = String(timePart).trim();
    if (!str.includes(':')) return str;
    const [hh, mm] = str.split(':');
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
  }
}

