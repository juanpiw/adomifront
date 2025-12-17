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
    const willOpen = !this.isOpen;
    if (willOpen) {
      // Al abrir el panel marcamos todo como leído para que el badge se reinicie
      this.notificationService.markAllAsRead();
    }
    this.isOpen = willOpen;
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
    
    // Navegación: si es notificación de cita y soy proveedor, ir directo a Agenda y enfocar la cita.
    const profile = this.notificationService.getCurrentProfile();
    const md = notification?.metadata || {};
    const appointmentId = md['appointmentId'] ?? md['appointment_id'];
    const quoteId = md['quoteId'] ?? md['quote_id'];
    const dateRaw = md['appointmentDate'] ?? md['appointment_date'] ?? md['date'];
    const timeRaw = md['appointmentTime'] ?? md['appointment_time'] ?? md['time'] ?? md['start_time'];

    const normalizeDate = (raw: any): string | null => {
      if (!raw) return null;
      const str = String(raw).trim();
      if (!str) return null;
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.includes('T') ? str.split('T')[0] : str.slice(0, 10);
      }
      const parsed = new Date(str);
      if (isNaN(parsed.getTime())) return null;
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const normalizeTime = (raw: any): string | null => {
      if (!raw) return null;
      const str = String(raw).trim();
      if (!str) return null;
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(str)) return str.slice(0, 5);
      return null;
    };

    if (profile === 'provider' && appointmentId) {
      const date = normalizeDate(dateRaw);
      const time = normalizeTime(timeRaw);
      this.router.navigate(['/dash/agenda'], {
        queryParams: {
          view: 'calendar',
          ...(date ? { date } : {}),
          appointmentId: String(appointmentId),
          ...(time ? { time } : {})
        },
        queryParamsHandling: 'merge'
      }).catch(() => {});
      this.notificationClick.emit(notification);
      return;
    }

    // Cliente: si hay appointmentId, llevar a Mis Reservas y enfocar la tarjeta
    if (profile === 'client' && appointmentId) {
      this.router.navigate(['/client/reservas'], {
        queryParams: {
          focusAppointmentId: String(appointmentId)
        },
        queryParamsHandling: 'merge'
      }).catch(() => {});
      this.notificationClick.emit(notification);
      return;
    }

    // Cotizaciones: navegar a la sección correspondiente
    if (quoteId) {
      const target = profile === 'provider' ? '/dash/cotizaciones' : '/client/cotizaciones';
      this.router.navigate([target], {
        queryParams: { focusQuoteId: String(quoteId) },
        queryParamsHandling: 'merge'
      }).catch(() => {});
      this.notificationClick.emit(notification);
      return;
    }

    // Navegar si hay un enlace legacy
    if (notification.link) {
      this.router.navigate([notification.link]).catch(() => {});
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











