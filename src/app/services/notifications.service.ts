import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, firstValueFrom, Subscription } from 'rxjs';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { NotificationService } from '../../libs/shared-ui/notifications/services/notification.service';
import type { Notification, NotificationEvent, NotificationPriority, NotificationStatus, NotificationType, UserProfile } from '../../libs/shared-ui/notifications/models/notification.model';

type MessagingModule = typeof import('firebase/messaging');
type Messaging = import('firebase/messaging').Messaging;

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private notificationState = inject(NotificationService);
  private apiBase = environment.apiBaseUrl;

  private permissionSubject = new BehaviorSubject<NotificationPermission>('default');
  public permission$ = this.permissionSubject.asObservable();

  private foregroundMessagesSubject = new Subject<any>();
  public foregroundMessages$ = this.foregroundMessagesSubject.asObservable();

  private firebaseApp: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private messagingModulePromise: Promise<MessagingModule | null> | null = null;
  private serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
  private foregroundListenerAttached = false;
  private serviceWorkerBridgeAttached = false;
  private currentTokenKey = 'notifications:fcm-token';
  private currentToken: string | null = null;
  private notificationEventsSub?: Subscription;
  private currentProfile: UserProfile = 'client';
  private bulkReadInProgress = false;

  constructor() {
    this.checkPermission();
    if (typeof window !== 'undefined') {
      try {
        this.currentToken = window.localStorage.getItem(this.currentTokenKey);
      } catch {
        this.currentToken = null;
      }
    }
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  /**
   * Verificar permisos de notificaciones
   */
  checkPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = Notification.permission;
      this.permissionSubject.next(permission);
      return permission;
    }
    return 'denied';
  }

  /**
   * Solicitar permisos de notificaciones al usuario
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Este entorno no soporta notificaciones');
      return 'denied';
    }

    try {
      console.log('[NOTIFICATIONS_SERVICE] 🔔 Solicitando permisos de notificaciones al usuario...');
      const permission = await Notification.requestPermission();
      this.permissionSubject.next(permission);
      console.log('[NOTIFICATIONS_SERVICE] 🔔 Respuesta del usuario:', permission);

      if (permission === 'granted') {
        await this.registerFCMToken();
      } else {
        console.warn('[NOTIFICATIONS_SERVICE] 🔔 Permisos denegados por el usuario');
      }

      return permission;
    } catch (error) {
      console.error('[NOTIFICATIONS_SERVICE] 🔔 Error solicitando permisos:', error);
      this.permissionSubject.next('denied');
      return 'denied';
    }
  }

  /**
   * Inicializa Firebase (solo en navegador) y devuelve el módulo de messaging
   */
  private async ensureFirebaseMessaging(): Promise<{ messagingModule: MessagingModule; messaging: Messaging } | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!environment.firebase) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Configuración de Firebase no encontrada');
      return null;
    }

    if (!this.messagingModulePromise) {
      this.messagingModulePromise = import('firebase/messaging')
        .catch((error) => {
          console.error('[NOTIFICATIONS_SERVICE] 🔔 Error cargando firebase/messaging:', error);
          return null;
        });
    }

    const messagingModule = await this.messagingModulePromise;
    if (!messagingModule) {
      return null;
    }

    const supported = await messagingModule.isSupported();
    if (!supported) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Firebase messaging no soportado en este navegador');
      return null;
    }

    if (!this.firebaseApp) {
      this.firebaseApp = initializeApp(environment.firebase);
    }

    if (!this.messaging) {
      this.messaging = messagingModule.getMessaging(this.firebaseApp);
    }

    return { messagingModule, messaging: this.messaging };
  }

  private async ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    if (!this.serviceWorkerRegistrationPromise) {
      this.serviceWorkerRegistrationPromise = (async () => {
        try {
          const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          if (existing) {
            return existing;
          }
          return await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (error) {
          console.error('[NOTIFICATIONS_SERVICE] 🔔 Error registrando service worker de Firebase:', error);
          return null;
        }
      })();
    }

    return this.serviceWorkerRegistrationPromise;
  }

  private async getValidToken(): Promise<string | null> {
    const context = await this.ensureFirebaseMessaging();
    if (!context) {
      return null;
    }

    const { messagingModule, messaging } = context;
    const registration = await this.ensureServiceWorkerRegistration();
    if (!registration) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 No se pudo registrar el service worker de Firebase');
      return null;
    }

    const vapidKey = environment.firebase?.vapidKey;
    if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE') {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Falta la VAPID key de Firebase Web Push');
      return null;
    }

    try {
      const token = await messagingModule.getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });
      return token || null;
    } catch (error) {
      console.error('[NOTIFICATIONS_SERVICE] 🔔 Error obteniendo token FCM:', error);
      return null;
    }
  }

  private async removeTokenFromBackend(token: string): Promise<void> {
    try {
      await firstValueFrom(this.removeDeviceToken(token));
    } catch (error) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Error eliminando token previo en backend:', error);
    }
  }

  /**
   * Registrar token FCM para notificaciones push
   */
  async registerFCMToken(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 No hay usuario autenticado; se omite el registro del token');
      return;
    }

    const token = await this.getValidToken();
    if (!token) {
      return;
    }

    if (this.currentToken && this.currentToken !== token) {
      await this.removeTokenFromBackend(this.currentToken);
    }

    if (this.currentToken === token) {
      console.log('[NOTIFICATIONS_SERVICE] 🔔 Token FCM ya registrado');
      return;
    }

    const registered = await this.sendTokenToBackend(token);
    if (registered) {
      this.currentToken = token;
      try {
        window.localStorage.setItem(this.currentTokenKey, token);
      } catch {}
      console.log('[NOTIFICATIONS_SERVICE] 🔔 Token FCM registrado correctamente');
    }
  }

  private async sendTokenToBackend(token: string): Promise<boolean> {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) {
        console.warn('[NOTIFICATIONS_SERVICE] 🔔 Usuario no autenticado, no se puede registrar token');
        return false;
      }

      await firstValueFrom(
        this.http.post(
          `${this.apiBase}/notifications/device-token`,
          { token, platform: 'web' },
          { headers: this.authHeaders() }
        )
      );

      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS_SERVICE] 🔔 Error enviando token al backend:', error);
      return false;
    }
  }

  /**
   * Registrar token de dispositivo
   */
  registerDeviceToken(token: string, platform: string = 'web'): Observable<any> {
    return this.http.post(
      `${this.apiBase}/notifications/device-token`,
      { token, platform },
      { headers: this.authHeaders() }
    );
  }

  /**
   * Eliminar token de dispositivo
   */
  removeDeviceToken(token: string): Observable<any> {
    return this.http.delete(
      `${this.apiBase}/notifications/device-token`,
      {
        headers: this.authHeaders(),
        body: { token }
      }
    );
  }

  /**
   * Mostrar notificación local (foreground)
   */
  showLocalNotification(title: string, body: string, icon?: string): void {
    if (typeof window === 'undefined' || this.permissionSubject.value !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: icon || '/assets/icon-192x192.png',
      badge: '/assets/badge-72x72.png',
      tag: 'adomi-notification',
      requireInteraction: false
    });

    setTimeout(() => {
      notification.close();
    }, 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  private async setupForegroundListener(): Promise<void> {
    if (this.foregroundListenerAttached) {
      return;
    }

    const context = await this.ensureFirebaseMessaging();
    if (!context) {
      return;
    }

    const { messagingModule, messaging } = context;

    messagingModule.onMessage(messaging, (payload) => {
      this.foregroundMessagesSubject.next(payload);
      const title = payload.notification?.title || 'Adomi';
      const body = payload.notification?.body || '';
      if (title || body) {
        this.showLocalNotification(title, body, payload.notification?.icon);
      }
      this.syncInAppNotifications(this.currentProfile).catch(error => {
        console.warn('[NOTIFICATIONS_SERVICE] 🔔 Error actualizando notificaciones tras push:', error);
      });
    });

    this.foregroundListenerAttached = true;
  }

  private setupServiceWorkerBridge(): void {
    if (typeof window === 'undefined' || this.serviceWorkerBridgeAttached) {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (!event.data) {
        return;
      }
      if (event.data.type === 'notification-click') {
        this.foregroundMessagesSubject.next({
          from: 'service-worker',
          data: event.data.data || {}
        });
      }
    });

    this.serviceWorkerBridgeAttached = true;
  }

  private resolveUserProfile(role?: string | null): UserProfile {
    const normalized = String(role || '').toLowerCase();
    if (normalized === 'provider') return 'provider';
    if (normalized === 'admin') return 'admin';
    return 'client';
  }

  private async syncInAppNotifications(profile: UserProfile): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<{ ok: boolean; notifications: any[]; unreadCount?: number }>(
        `${this.apiBase}/notifications`,
        { headers: this.authHeaders(), params: { limit: '50', offset: '0' } }
      ));

      if (!response?.ok) {
        return;
      }

      const items = Array.isArray(response.notifications) ? response.notifications : [];
      const mapped = items.map(item => this.mapBackendNotification(item, profile));
      this.notificationState.setNotifications(profile, mapped);

      if (typeof response.unreadCount === 'number') {
        this.notificationState.updateUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('[NOTIFICATIONS_SERVICE] 🔔 Error sincronizando notificaciones in-app:', error);
    }
  }

  private mapBackendNotification(raw: any, profile: UserProfile): Notification {
    const type = this.mapNotificationType(raw?.type);
    let metadata: Record<string, any> | undefined;
    let parsedData: any = undefined;

    if (raw?.data) {
      try {
        parsedData = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data;
        if (parsedData && typeof parsedData === 'object') {
          metadata = parsedData;
        }
      } catch (error) {
        console.warn('[NOTIFICATIONS_SERVICE] 🔔 No se pudo parsear metadata de notificación:', error);
      }
    }

    const priority = this.mapNotificationPriority(metadata?.['priority']);
    const createdAt = raw?.created_at ? new Date(raw.created_at) : new Date();
    const status: NotificationStatus = raw?.is_read ? 'read' : 'unread';
    const backendId = raw?.id;
    const link = (metadata?.['link'] ?? metadata?.['url'] ?? metadata?.['route_hint']) || undefined;
    const action = metadata?.['action'] || raw?.action || undefined;
    const entityType = metadata?.['entity_type'] || raw?.entity_type || undefined;
    const entityId =
      metadata?.['entity_id'] ??
      metadata?.['appointment_id'] ??
      metadata?.['quote_id'] ??
      metadata?.['thread_id'] ??
      raw?.entity_id ??
      undefined;
    const roleTarget = metadata?.['role_target'] || raw?.role_target || 'both';
    const routeHint = metadata?.['route_hint'] || raw?.route_hint || undefined;
    const params = metadata?.['params'] || raw?.params || undefined;

    const notification: Notification = {
      id: backendId ? String(backendId) : this.generateLocalId(),
      type,
      title: raw?.title || 'Notificación',
      message: raw?.body || raw?.message || '',
      description: metadata?.['description'] || undefined,
      priority,
      status,
      profile,
      createdAt,
      updatedAt: createdAt,
      metadata: {
        ...metadata,
        backendId,
        notificationId: backendId
      },
      link,
      actions: Array.isArray(metadata?.['actions']) ? metadata['actions'] : [],
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      roleTarget: roleTarget as any,
      routeHint,
      params
    };

    return this.notificationState.enrichNotification(notification);
  }

  private mapNotificationType(value: any): NotificationType {
    const normalized = String(value || '').toLowerCase();
    const allowed: NotificationType[] = ['appointment', 'reminder', 'payment', 'rating', 'system', 'message', 'verification', 'promotion', 'security', 'booking', 'availability', 'income', 'service', 'profile', 'support'];
    return allowed.includes(normalized as NotificationType) ? (normalized as NotificationType) : 'system';
  }

  private mapNotificationPriority(value: any): NotificationPriority {
    const normalized = String(value || '').toLowerCase();
    const allowed: NotificationPriority[] = ['low', 'medium', 'high', 'urgent'];
    return allowed.includes(normalized as NotificationPriority) ? (normalized as NotificationPriority) : 'medium';
  }

  private generateLocalId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
  }

  private ensureNotificationEventBridge(): void {
    if (this.notificationEventsSub) {
      return;
    }

    this.notificationEventsSub = this.notificationState.events$.subscribe((events: NotificationEvent[]) => {
      if (!Array.isArray(events) || events.length === 0) {
        return;
      }

      const latest = events[events.length - 1];
      if (!latest) {
        return;
      }

      switch (latest.type) {
        case 'read':
          if (!latest.notification) return;
          this.handleReadEvent(latest.notification);
          break;
        case 'read_all':
          this.handleBulkReadEvent();
          break;
        default:
          break;
      }
    });
  }

  private async handleReadEvent(notification: Notification): Promise<void> {
    if (this.bulkReadInProgress) {
      return;
    }

    const backendId = this.getBackendNotificationId(notification);
    if (!backendId) {
      return;
    }

    try {
      await firstValueFrom(this.markAsRead(backendId));
    } catch (error) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Error marcando notificación como leída en backend:', error);
    }
  }

  private async handleBulkReadEvent(): Promise<void> {
    if (this.bulkReadInProgress) {
      return;
    }

    this.bulkReadInProgress = true;
    try {
      await firstValueFrom(this.markAllAsRead());
    } catch (error) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Error marcando todas las notificaciones como leídas en backend:', error);
    } finally {
      this.bulkReadInProgress = false;
    }
  }

  private getBackendNotificationId(notification: Notification): number | null {
    const rawId = notification.metadata?.backendId ?? notification.metadata?.notificationId ?? notification.id;
    const id = Number(rawId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  /**
   * Inicializar notificaciones para el usuario actual
   */
  async initializeForUser(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user) {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 No hay usuario autenticado, abortando inicialización');
      return;
    }

    const profile = this.resolveUserProfile(user.role);
    this.currentProfile = profile;
    this.notificationState.setUserProfile(profile);

    const permission = this.checkPermission();
    console.log('[NOTIFICATIONS_SERVICE] 🔔 Permiso actual:', permission);

    if (permission === 'default') {
      await this.requestPermission();
    } else if (permission === 'granted') {
      await this.registerFCMToken();
    } else {
      console.warn('[NOTIFICATIONS_SERVICE] 🔔 Permisos denegados');
    }

    await this.setupForegroundListener();
    this.setupServiceWorkerBridge();
    await this.syncInAppNotifications(profile);
    this.ensureNotificationEventBridge();
  }

  /**
   * Obtener notificaciones del usuario
   */
  getNotifications(limit: number = 20, offset: number = 0, unreadOnly: boolean = false): Observable<any> {
    const params: any = { limit, offset };
    if (unreadOnly) {
      params.unread_only = 'true';
    }

    return this.http.get(
      `${this.apiBase}/notifications`,
      {
        headers: this.authHeaders(),
        params
      }
    );
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  getUnreadCount(): Observable<any> {
    return this.http.get(
      `${this.apiBase}/notifications/unread-count`,
      { headers: this.authHeaders() }
    );
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(
      `${this.apiBase}/notifications/${notificationId}/read`,
      {},
      { headers: this.authHeaders() }
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead(): Observable<any> {
    return this.http.patch(
      `${this.apiBase}/notifications/mark-all-read`,
      {},
      { headers: this.authHeaders() }
    );
  }
}
