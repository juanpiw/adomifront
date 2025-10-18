import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { 
  Notification, 
  NotificationType, 
  UserProfile, 
  NotificationPriority,
  NotificationStatus,
  NotificationConfig,
  NotificationTemplate,
  NotificationFilters,
  NotificationStats,
  NotificationEvent
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private configSubject = new BehaviorSubject<NotificationConfig | null>(null);
  private eventsSubject = new BehaviorSubject<NotificationEvent[]>([]);

  public notifications$ = this.notificationsSubject.asObservable();
  public config$ = this.configSubject.asObservable();
  public events$ = this.eventsSubject.asObservable();

  private currentProfile: UserProfile = 'client';
  private notifications: Notification[] = [];
  private events: NotificationEvent[] = [];

  constructor() {
    // Sin datos de demo; se inicializa configuración y se carga lista vacía
    this.loadConfiguration();
    this.notificationsSubject.next([]);
  }

  // ===== CONFIGURACIÓN =====
  
  setUserProfile(profile: UserProfile): void {
    this.currentProfile = profile;
    this.loadConfiguration();
    this.loadNotifications();
  }

  getCurrentProfile(): UserProfile {
    return this.currentProfile;
  }

  private loadConfiguration(): void {
    const config: NotificationConfig = {
      profile: this.currentProfile,
      enabledTypes: this.getDefaultEnabledTypes(),
      priority: {
        low: true,
        medium: true,
        high: true,
        urgent: true
      },
      channels: {
        inApp: true,
        email: false,
        push: false,
        sms: false
      },
      schedule: {
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        timezone: 'America/Santiago'
      }
    };
    this.configSubject.next(config);
  }

  private getDefaultEnabledTypes(): NotificationType[] {
    const baseTypes: NotificationType[] = ['system', 'security'];
    
    if (this.currentProfile === 'client') {
      return [...baseTypes, 'appointment', 'payment', 'rating', 'message', 'booking', 'promotion'];
    } else if (this.currentProfile === 'provider') {
      return [...baseTypes, 'appointment', 'payment', 'rating', 'message', 'booking', 'availability', 'income', 'service', 'verification'];
    } else if (this.currentProfile === 'admin') {
      return [...baseTypes, 'system', 'security', 'support'];
    }
    
    return baseTypes;
  }

  // ===== GESTIÓN DE NOTIFICACIONES =====

  private initializeNotifications(): void { /* removido demo */ }

  private loadNotifications(): void {
    // En una implementación real, esto cargaría desde una API
    // Por ahora, filtramos las notificaciones por perfil
    const profileNotifications = this.notifications.filter(n => n.profile === this.currentProfile);
    this.notificationsSubject.next(profileNotifications);
  }

  // Crear nueva notificación
  createNotification(template: NotificationTemplate): Notification {
    const notification: Notification = {
      id: this.generateId(),
      type: template.type,
      title: template.title,
      message: template.message,
      description: template.description,
      priority: template.priority,
      status: 'unread',
      profile: template.profile,
      createdAt: new Date(),
      actions: template.actions,
      metadata: template.metadata,
      ...this.getNotificationDefaults(template.type)
    };

    this.notifications.push(notification);
    this.notificationsSubject.next(this.getProfileNotifications());
    this.emitEvent('created', notification);
    
    return notification;
  }

  // Marcar como leída
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.status === 'unread') {
      notification.status = 'read';
      notification.readAt = new Date();
      notification.updatedAt = new Date();
      
      this.notificationsSubject.next(this.getProfileNotifications());
      this.emitEvent('read', notification);
    }
  }

  // Marcar todas como leídas
  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => 
      n.profile === this.currentProfile && n.status === 'unread'
    );

    unreadNotifications.forEach(notification => {
      notification.status = 'read';
      notification.readAt = new Date();
      notification.updatedAt = new Date();
    });

    this.notificationsSubject.next(this.getProfileNotifications());
    unreadNotifications.forEach(n => this.emitEvent('read', n));
  }

  // Archivar notificación
  archiveNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'archived';
      notification.updatedAt = new Date();
      
      this.notificationsSubject.next(this.getProfileNotifications());
      this.emitEvent('archived', notification);
    }
  }

  // Eliminar notificación
  deleteNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'deleted';
      notification.updatedAt = new Date();
      
      this.notificationsSubject.next(this.getProfileNotifications());
      this.emitEvent('deleted', notification);
    }
  }

  // Ejecutar acción en notificación
  executeAction(notificationId: string, action: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      // Aquí se ejecutaría la lógica específica de la acción
      console.log(`Ejecutando acción ${action} en notificación ${notificationId}`);
      
      // Marcar como leída si no lo está
      if (notification.status === 'unread') {
        this.markAsRead(notificationId);
      }
      
      this.emitEvent('action_taken', notification);
    }
  }

  // ===== CONSULTAS =====

  getNotifications(filters?: NotificationFilters): Observable<Notification[]> {
    let filteredNotifications = this.getProfileNotifications();

    if (filters) {
      if (filters.type && filters.type.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => filters.type!.includes(n.type));
      }
      
      if (filters.status && filters.status.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => filters.status!.includes(n.status));
      }
      
      if (filters.priority && filters.priority.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => filters.priority!.includes(n.priority));
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredNotifications = filteredNotifications.filter(n => 
          n.title.toLowerCase().includes(searchTerm) ||
          n.message.toLowerCase().includes(searchTerm)
        );
      }
    }

    return of(filteredNotifications);
  }

  getUnreadCount(): Observable<number> {
    const unreadCount = this.getProfileNotifications().filter(n => n.status === 'unread').length;
    return of(unreadCount);
  }

  getStats(): Observable<NotificationStats> {
    const profileNotifications = this.getProfileNotifications();
    
    const stats: NotificationStats = {
      total: profileNotifications.length,
      unread: profileNotifications.filter(n => n.status === 'unread').length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byStatus: {} as Record<NotificationStatus, number>
    };

    // Contar por tipo
    Object.values(['appointment', 'reminder', 'payment', 'rating', 'system', 'message', 'verification', 'promotion', 'security', 'booking', 'availability', 'income', 'service', 'profile', 'support'] as NotificationType[]).forEach(type => {
      stats.byType[type] = profileNotifications.filter(n => n.type === type).length;
    });

    // Contar por prioridad
    Object.values(['low', 'medium', 'high', 'urgent'] as NotificationPriority[]).forEach(priority => {
      stats.byPriority[priority] = profileNotifications.filter(n => n.priority === priority).length;
    });

    // Contar por estado
    Object.values(['unread', 'read', 'archived', 'deleted'] as NotificationStatus[]).forEach(status => {
      stats.byStatus[status] = profileNotifications.filter(n => n.status === status).length;
    });

    return of(stats);
  }

  // ===== MÉTODOS PRIVADOS =====

  private getProfileNotifications(): Notification[] {
    return this.notifications.filter(n => 
      n.profile === this.currentProfile && n.status !== 'deleted'
    );
  }

  private getNotificationDefaults(type: NotificationType): Partial<Notification> {
    const defaults: Record<NotificationType, Partial<Notification>> = {
      appointment: { icon: 'calendar', color: '#4f46e5' },
      reminder: { icon: 'clock', color: '#f59e0b' },
      payment: { icon: 'credit-card', color: '#10b981' },
      rating: { icon: 'star', color: '#f59e0b' },
      system: { icon: 'info', color: '#6b7280' },
      message: { icon: 'message', color: '#3b82f6' },
      verification: { icon: 'shield-check', color: '#8b5cf6' },
      promotion: { icon: 'gift', color: '#ec4899' },
      security: { icon: 'shield-alert', color: '#ef4444' },
      booking: { icon: 'calendar-plus', color: '#06b6d4' },
      availability: { icon: 'clock', color: '#84cc16' },
      income: { icon: 'trending-up', color: '#10b981' },
      service: { icon: 'briefcase', color: '#6366f1' },
      profile: { icon: 'user', color: '#8b5cf6' },
      support: { icon: 'help-circle', color: '#f97316' }
    };

    return defaults[type] || defaults.system;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private emitEvent(type: NotificationEvent['type'], notification: Notification): void {
    const event: NotificationEvent = {
      type,
      notification,
      timestamp: new Date()
    };
    
    this.events.push(event);
    this.eventsSubject.next(this.events);
  }

  // ===== NOTIFICACIONES DE EJEMPLO =====

  private generateSampleNotifications(): Notification[] { return []; }
}






