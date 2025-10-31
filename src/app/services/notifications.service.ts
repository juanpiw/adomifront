import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

type MessagingModule = typeof import('firebase/messaging');
type Messaging = import('firebase/messaging').Messaging;

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
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
