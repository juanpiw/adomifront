import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
  private notificationsByProfile: Record<UserProfile, Notification[]> = {
    client: [],
    provider: [],
    admin: []
  };
  private events: NotificationEvent[] = [];
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Sin datos de demo; se inicializa configuración y se carga lista vacía
    this.loadConfiguration();
    this.notificationsSubject.next([]);
  }
  
  /**
   * Actualizar contador de notificaciones no leídas
   * Este método se puede llamar desde fuera para actualizar el contador con datos del backend
   */
  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
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

  setNotifications(profile: UserProfile, notifications: Notification[]): void {
    const enriched = notifications.map(n => this.enrichNotification(n));
    const existingLocal = (this.notificationsByProfile[profile] || []).filter(n => !this.isBackendNotification(n));

    const merged = [...enriched];
    existingLocal.forEach(localNotification => {
      if (this.isDuplicateOfBackend(localNotification, enriched)) {
        return;
      }
      if (!merged.some(n => n.id === localNotification.id)) {
        merged.push(localNotification);
      }
    });

    this.setProfileNotifications(profile, merged);
  }

  enrichNotification(notification: Notification): Notification {
    const defaults = this.getNotificationDefaults(notification.type);

    const normalizeDate = (value?: Date | string): Date | undefined => {
      if (!value) return undefined;
      if (value instanceof Date) return value;
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const createdAt = normalizeDate(notification.createdAt) || new Date();
    const updatedAt = normalizeDate(notification.updatedAt);
    const readAt = normalizeDate(notification.readAt);

    return {
      ...defaults,
      ...notification,
      createdAt,
      updatedAt,
      readAt
    };
  }

  private setProfileNotifications(profile: UserProfile, notifications: Notification[]): void {
    const sorted = [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    this.notificationsByProfile[profile] = sorted;
    if (profile === this.currentProfile) {
      this.notificationsSubject.next(this.getProfileNotifications());
      this.updateUnreadCountValue(profile);
    }
  }

  private updateUnreadCountValue(profile: UserProfile = this.currentProfile): void {
    if (profile !== this.currentProfile) return;
    const unreadCount = this.notificationsByProfile[profile].filter(n => n.status === 'unread').length;
    this.unreadCountSubject.next(unreadCount);
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
    this.notificationsSubject.next(this.getProfileNotifications());
    this.updateUnreadCountValue();
  }

  // Crear nueva notificación
  createNotification(template: NotificationTemplate): Notification {
    console.log('🔔 [NOTIFICATION_SERVICE] ==================== CREAR NOTIFICACIÓN ====================');
    console.log('🔔 [NOTIFICATION_SERVICE] Template:', template);
    
    const notification = this.enrichNotification({
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
    });

    console.log('🔔 [NOTIFICATION_SERVICE] Notificación creada:', notification);

    const profile = notification.profile;
    const existing = this.notificationsByProfile[profile] || [];
    this.setProfileNotifications(profile, [notification, ...existing]);

    this.emitEvent('created', notification);
    
    return notification;
  }

  // Marcar como leída
  markAsRead(notificationId: string): void {
    const profile = this.currentProfile;
    const list = [...(this.notificationsByProfile[profile] || [])];
    const index = list.findIndex(n => n.id === notificationId);
    if (index === -1) return;

    const target = list[index];
    if (target.status !== 'unread') return;

    const updated: Notification = {
      ...target,
      status: 'read',
      readAt: new Date(),
      updatedAt: new Date()
    };

    list[index] = updated;
    this.setProfileNotifications(profile, list);
    this.emitEvent('read', updated);
  }

  // Marcar todas como leídas
  markAllAsRead(): void {
    const profile = this.currentProfile;
    const list = (this.notificationsByProfile[profile] || []).map(notification => {
      if (notification.status !== 'unread') {
        return notification;
      }
      return {
        ...notification,
        status: 'read',
        readAt: new Date(),
        updatedAt: new Date()
      } as Notification;
    });

    this.setProfileNotifications(profile, list);
    this.emitEvent('read_all');
  }

  // Archivar notificación
  archiveNotification(notificationId: string): void {
    const profile = this.currentProfile;
    const list = [...(this.notificationsByProfile[profile] || [])];
    const index = list.findIndex(n => n.id === notificationId);
    if (index === -1) return;

    const updated: Notification = {
      ...list[index],
      status: 'archived',
      updatedAt: new Date()
    };

    list[index] = updated;
    this.setProfileNotifications(profile, list);
    this.emitEvent('archived', updated);
  }

  // Eliminar notificación
  deleteNotification(notificationId: string): void {
    const profile = this.currentProfile;
    const list = [...(this.notificationsByProfile[profile] || [])];
    const index = list.findIndex(n => n.id === notificationId);
    if (index === -1) return;

    const updated: Notification = {
      ...list[index],
      status: 'deleted',
      updatedAt: new Date()
    };

    list[index] = updated;
    this.setProfileNotifications(profile, list);
    this.emitEvent('deleted', updated);
  }

  // Ejecutar acción en notificación
  executeAction(notificationId: string, action: string): void {
    const profile = this.currentProfile;
    const list = [...(this.notificationsByProfile[profile] || [])];
    const index = list.findIndex(n => n.id === notificationId);
    if (index === -1) return;

    const notification = list[index];

    console.log(`Ejecutando acción ${action} en notificación ${notificationId}`);

    if (notification.status === 'unread') {
      this.markAsRead(notificationId);
    }

    this.emitEvent('action_taken', notification);
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
    const list = this.notificationsByProfile[this.currentProfile] || [];
    return list.filter(n => n.status !== 'deleted').map(n => ({ ...n }));
  }

  private isBackendNotification(notification: Notification): boolean {
    return this.getBackendNotificationIdFromNotification(notification) !== null;
  }

  private getBackendNotificationIdFromNotification(notification: Notification): number | null {
    const rawId = notification.metadata?.backendId ?? notification.metadata?.notificationId ?? notification.id;
    const id = Number(rawId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private isDuplicateOfBackend(localNotification: Notification, backendNotifications: Notification[]): boolean {
    const backendId = this.getBackendNotificationIdFromNotification(localNotification);
    if (backendId) {
      return backendNotifications.some(n => this.getBackendNotificationIdFromNotification(n) === backendId);
    }

    const localAppointment = localNotification.metadata?.appointmentId || localNotification.metadata?.appointment_id;
    if (localAppointment) {
      const normalized = String(localAppointment);
      return backendNotifications.some(n => {
        const backendAppointment = n.metadata?.appointmentId || n.metadata?.appointment_id;
        return backendAppointment && String(backendAppointment) === normalized;
      });
    }

    const localPayment = localNotification.metadata?.paymentId || localNotification.metadata?.payment_id;
    if (localPayment) {
      const normalized = String(localPayment);
      return backendNotifications.some(n => {
        const backendPayment = n.metadata?.paymentId || n.metadata?.payment_id;
        return backendPayment && String(backendPayment) === normalized;
      });
    }

    return false;
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

  private emitEvent(type: NotificationEvent['type'], notification?: Notification): void {
    const event: NotificationEvent = {
      type,
      notification,
      timestamp: new Date()
    };

    this.events.push(event);
    this.eventsSubject.next([...this.events]);
  }

  // ===== NOTIFICACIONES DE EJEMPLO =====

  private generateSampleNotifications(): Notification[] { return []; }
}






