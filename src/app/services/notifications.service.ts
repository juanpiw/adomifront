import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiBase = environment.apiBaseUrl;
  
  private permissionSubject = new BehaviorSubject<NotificationPermission>('default');
  public permission$ = this.permissionSubject.asObservable();

  constructor() {
    this.checkPermission();
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
    if ('Notification' in window) {
      const permission = Notification.permission;
      this.permissionSubject.next(permission);
      return permission;
    }
    return 'denied';
  }

  /**
   * Solicitar permisos de notificaciones
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionSubject.next(permission);
      
      if (permission === 'granted') {
        console.log('Permisos de notificaciones concedidos');
        // Registrar token FCM si está disponible
        await this.registerFCMToken();
      } else {
        console.log('Permisos de notificaciones denegados');
      }
      
      return permission;
    } catch (error) {
      console.error('Error solicitando permisos de notificaciones:', error);
      return 'denied';
    }
  }

  /**
   * Registrar token FCM para notificaciones push
   */
  async registerFCMToken(): Promise<void> {
    try {
      // Verificar si Firebase está disponible
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        // Intentar obtener el token FCM
        const token = await this.getFCMToken();
        if (token) {
          await this.sendTokenToBackend(token);
        }
      }
    } catch (error) {
      console.error('Error registrando token FCM:', error);
    }
  }

  /**
   * Obtener token FCM (implementación básica)
   */
  private async getFCMToken(): Promise<string | null> {
    try {
      // Esta es una implementación básica
      // En una implementación completa, usarías Firebase SDK
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // Aquí normalmente usarías Firebase Messaging para obtener el token
        // Por ahora, generamos un token simulado
        const simulatedToken = `fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Token FCM simulado generado:', simulatedToken);
        return simulatedToken;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo token FCM:', error);
      return null;
    }
  }

  /**
   * Enviar token al backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) {
        console.warn('Usuario no autenticado, no se puede registrar token');
        return;
      }

      await this.http.post(
        `${this.apiBase}/notifications/device-token`,
        { token, platform: 'web' },
        { headers: this.authHeaders() }
      ).toPromise();

      console.log('Token FCM registrado en el backend');
    } catch (error) {
      console.error('Error enviando token al backend:', error);
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
   * Mostrar notificación local
   */
  showLocalNotification(title: string, body: string, icon?: string): void {
    if (this.permissionSubject.value === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: icon || '/assets/icon-192x192.png',
        badge: '/assets/badge-72x72.png',
        tag: 'adomi-notification',
        requireInteraction: false
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Manejar click en la notificación
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  /**
   * Inicializar notificaciones para el usuario actual
   */
  async initializeForUser(): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    // Verificar permisos
    const permission = this.checkPermission();
    
    if (permission === 'default') {
      // Solicitar permisos
      await this.requestPermission();
    } else if (permission === 'granted') {
      // Registrar token FCM
      await this.registerFCMToken();
    }
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
