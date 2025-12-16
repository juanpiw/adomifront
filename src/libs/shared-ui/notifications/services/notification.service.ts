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
    console.log('🔔 [NOTIFICATION_SERVICE] Constructor inicializado');
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
    console.log('🔔 [NOTIFICATION_SERVICE] setUserProfile llamado', { profileAnterior: this.currentProfile, nuevoPerfil: profile });
    this.currentProfile = profile;
    this.loadConfiguration();
    this.loadNotifications();
    console.log('🔔 [NOTIFICATION_SERVICE] Perfil establecido, notificaciones actuales:', this.notificationsByProfile[profile]?.length || 0);
  }

  getCurrentProfile(): UserProfile {
    return this.currentProfile;
  }

  private loadConfiguration(): void {
    console.log('🔔 [NOTIFICATION_SERVICE] Configurando perfil', this.currentProfile);
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
    const metadata = this.normalizeMetadata(notification.metadata);

    return {
      ...defaults,
      ...notification,
      createdAt,
      updatedAt,
      readAt,
      metadata
    };
  }

  private setProfileNotifications(profile: UserProfile, notifications: Notification[]): void {
    const sorted = this.dedupeNotifications(notifications).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    console.log('🔔 [NOTIFICATION_SERVICE] loadNotifications ejecutado. Perfil:', this.currentProfile);
    this.notificationsSubject.next(this.getProfileNotifications());
    this.updateUnreadCountValue();
    console.log('🔔 [NOTIFICATION_SERVICE] Después de loadNotifications -> total:', this.notificationsByProfile[this.currentProfile]?.length || 0, 'no leídas:', this.notificationsByProfile[this.currentProfile]?.filter(n => n.status === 'unread').length || 0);
  }

  private normalizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) {
      return metadata;
    }
    const normalized: Record<string, any> = { ...metadata };

    const rawAppointmentId =
      normalized['appointment_id'] ??
      normalized['appointmentId'] ??
      normalized['appointmentID'] ??
      normalized['appointment'];
    if (rawAppointmentId !== undefined && rawAppointmentId !== null) {
      const idString = String(rawAppointmentId);
      normalized['appointment_id'] = idString;
      normalized['appointmentId'] = idString;
    }

    const datePartRaw =
      normalized['appointmentDate'] ??
      normalized['appointment_date'] ??
      normalized['date'] ??
      normalized['startDate'] ??
      normalized['scheduledFor'] ??
      normalized['scheduled_for'];
    const datePart = this.normalizeDatePart(datePartRaw);
    if (datePart) {
      normalized['appointmentDate'] = datePart;
      normalized['appointment_date'] = datePart;
      if (!normalized['date']) {
        normalized['date'] = datePart;
      }
    }

    const timePartRaw =
      normalized['appointmentTime'] ??
      normalized['appointment_time'] ??
      normalized['time'] ??
      normalized['start_time'] ??
      normalized['startTime'];
    const timePart = this.normalizeTimePart(timePartRaw);
    if (timePart) {
      normalized['appointmentTime'] = timePart;
      normalized['appointment_time'] = timePart;
      normalized['start_time'] = timePart;
      normalized['startTime'] = timePart;
      if (!normalized['time']) {
        normalized['time'] = timePart;
      }
    }

    if (!normalized['appointmentDateTime'] && !normalized['appointment_datetime'] && datePart) {
      const localIso = `${datePart}T${timePart || '00:00'}`;
      normalized['appointmentDateTime'] = localIso;
      normalized['appointment_datetime'] = localIso;
    }

    if (!normalized['appointmentDateTimeIso'] && !normalized['appointment_datetime_iso'] && datePart) {
      const utcIso = `${datePart}T${(timePart || '00:00')}:00Z`;
      normalized['appointmentDateTimeIso'] = utcIso;
      normalized['appointment_datetime_iso'] = utcIso;
    }

    return normalized;
  }

  private normalizeDatePart(value: any): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    const raw = String(value).trim();
    if (!raw) {
      return null;
    }
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return null;
  }

  private normalizeTimePart(value: any): string | null {
    if (!value && value !== 0) {
      return null;
    }
    const raw = String(value).trim();
    if (!raw) {
      return null;
    }
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
      return raw.slice(0, 5);
    }
    if (/^\d{4}$/.test(raw)) {
      return `${raw.slice(0, 2)}:${raw.slice(2)}`;
    }
    if (/^\d{1,2}$/.test(raw)) {
      return raw.padStart(2, '0') + ':00';
    }
    return null;
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
    return this.dedupeNotifications(list).filter(n => n.status !== 'deleted').map(n => ({ ...n }));
  }

  private dedupeNotifications(list: Notification[]): Notification[] {
    const seenBackend = new Set<string>();
    const seenIds = new Set<string>();
    const result: Notification[] = [];

    for (const n of list) {
      const backendId = this.getBackendNotificationIdFromNotification(n);
      if (backendId !== null) {
        const key = String(backendId);
        if (seenBackend.has(key)) continue;
        seenBackend.add(key);
      } else {
        if (seenIds.has(n.id)) continue;
        seenIds.add(n.id);
      }
      result.push(n);
    }

    return result;
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






