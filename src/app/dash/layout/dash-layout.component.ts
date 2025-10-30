import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { OnlineStatusSwitchComponent } from '../../../libs/shared-ui/online-status-switch/online-status-switch.component';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';
import { PlanUpgradeAlertComponent, PlanInfo } from '../../../libs/shared-ui/plan-upgrade-alert/plan-upgrade-alert.component';
import { TopbarComponent, TopbarConfig } from '../../../libs/shared-ui/topbar/topbar.component';
import { PlanService } from '../../services/plan.service';
import { SessionService } from '../../auth/services/session.service';
import { AuthService } from '../../auth/services/auth.service';
import { ProviderProfileService } from '../../services/provider-profile.service';
import { environment } from '../../../environments/environment';
import { ChatService, MessageDto } from '../../services/chat.service';
import { AppointmentsService, AppointmentDto } from '../../services/appointments.service';
import { NotificationService } from '../../../libs/shared-ui/notifications/services/notification.service';
import { NotificationsService } from '../../services/notifications.service';
import { AdminPaymentsService } from '../pages/admin-pagos/admin-payments.service';
import { PaymentsService } from '../../services/payments.service';

@Component({
  selector: 'app-dash-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent, PlanUpgradeAlertComponent, TopbarComponent, OnlineStatusSwitchComponent],
  templateUrl: './dash-layout.component.html',
  styleUrls: ['./dash-layout.component.scss']
})
export class DashLayoutComponent implements OnInit {
  isCollapsed = false;
  planInfo: PlanInfo | null = null;
  showPlanAlert = false;
  providerName: string | null = null;
  providerAvatarUrl: string | null = null;
  isOnline: boolean | null = null;
  unreadTotal: number = 0; // 🔔 Contador de citas pendientes
  pendingAppointmentsCount: number = 0; // 🔔 Contador de citas pendientes
  hasNewAppointment: boolean = false; // ✨ Para animar el avatar cuando hay nueva cita
  adminPendingCount: number = 0;
  cashNotice: { amount: number; currency: string; dueDateLabel?: string; status?: string } | null = null;
  
  get isAdmin(): boolean {
    try {
      const user = this.sessionService.getUser();
      return !!user && user.email?.toLowerCase() === 'juanpablojpw@gmail.com';
    } catch { return false; }
  }

  // Configuración del topbar
  topbarConfig: TopbarConfig = {
    showSearch: true,
    showHamburger: true,
    showNotifications: true,
    showSettings: true,
    searchPlaceholder: '¿Necesitas ayuda con el dashboard?',
    helpContext: 'dashboard',
    userProfile: 'provider'
  };

  private planService = inject(PlanService);
  private sessionService = inject(SessionService);
  private auth = inject(AuthService);
  private providerProfile = inject(ProviderProfileService);
  private router = inject(Router);
  private chat = inject(ChatService);
  private appointments = inject(AppointmentsService);
  private notifications = inject(NotificationService);
  private pushNotifications = inject(NotificationsService);
  private adminPayments = inject(AdminPaymentsService);
  private payments = inject(PaymentsService);

  ngOnInit() {
    this.loadPlanInfo();
    this.loadProviderProfile();
    this.initializeNotifications();

    const user = this.sessionService.getUser();
    if (user && user.role === 'provider') {
      this.payments.cashSummary$.subscribe((summary) => {
        if (summary && summary.last_debt && ['pending', 'overdue'].includes(summary.last_debt.status)) {
          const amount = Number(summary.last_debt.commission_amount || 0);
          if (amount > 0) {
            this.cashNotice = {
              amount,
              currency: summary.last_debt.currency || 'CLP',
              dueDateLabel: summary.last_debt.due_date ? this.formatDueDateLabel(summary.last_debt.due_date) : undefined,
              status: summary.last_debt.status
            };
            return;
          }
        }
        this.cashNotice = null;
      });

      this.payments.refreshCashSummary().subscribe({ error: () => {} });
    }

    // Inicializar estado online desde localStorage (fallback: true)
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('provider:isOnline') : null;
      if (saved === 'true') this.isOnline = true; else if (saved === 'false') this.isOnline = false; else this.isOnline = true;
    } catch { this.isOnline = true; }

    // Conectar socket y escuchar mensajes para badge
    this.chat.connectSocket();
    // Conectar socket de citas y crear notificaciones a nivel dashboard
    const me = this.sessionService.getUser()?.id;
    if (me) {
      this.appointments.connectSocket(me);
      this.appointments.onAppointmentCreated().subscribe((a: AppointmentDto) => {
        try {
          console.log('🔔 [DASH_LAYOUT] ==================== NUEVA CITA RECIBIDA ====================');
          console.log('🔔 [DASH_LAYOUT] Appointment:', a);
          console.log('🔔 [DASH_LAYOUT] Status:', a.status);
          
          // Incrementar contador de citas pendientes (solo las que están 'scheduled')
          if (a.status === 'scheduled') {
            this.pendingAppointmentsCount = Math.min(99, (this.pendingAppointmentsCount || 0) + 1);
            console.log('🔔 [DASH_LAYOUT] ✅ Contador incrementado a:', this.pendingAppointmentsCount);
            
            // ✨ Activar animación del avatar
            this.hasNewAppointment = true;
            console.log('🔔 [DASH_LAYOUT] ✨ Animación de avatar activada');
            
            // Desactivar la animación después de 5 segundos
            setTimeout(() => {
              this.hasNewAppointment = false;
              console.log('🔔 [DASH_LAYOUT] ✨ Animación de avatar desactivada');
            }, 5000);
            
            // 🔊 Reproducir sonido de notificación
            this.playNotificationSound();
          }
          
          // Crear notificación visual detallada
          this.notifications.setUserProfile('provider');
          
          const clientName = (a as any).client_name || 'Un cliente';
          const serviceName = (a as any).service_name || 'tu servicio';
          const appointmentDate = this.formatDate(a.date);
          const appointmentTime = a.start_time.slice(0,5);
          
          const notificationMessage = `${clientName} quiere agendar "${serviceName}" para el ${appointmentDate} a las ${appointmentTime}`;
          
          console.log('🔔 [DASH_LAYOUT] Creando notificación con mensaje:', notificationMessage);
          
          this.notifications.createNotification({
            type: 'appointment',
            profile: 'provider',
            title: '📅 Nueva cita por confirmar',
            message: notificationMessage,
            description: `Cliente: ${clientName} • ${appointmentDate} ${appointmentTime}`,
            priority: 'high',
            actions: ['view'],
            metadata: { 
              appointmentId: String(a.id), 
              clientName,
              serviceName,
              date: a.date,
              time: appointmentTime
            }
          });
          
          console.log('🔔 [DASH_LAYOUT] ✅ Notificación creada en campana');
        } catch (err) {
          console.error('🔴 [DASH_LAYOUT] Error procesando nueva cita:', err);
        }
      });
    }
    this.chat.onMessageNew().subscribe((msg: MessageDto) => {
      try {
        const me = this.sessionService.getUser()?.id;
        if (me && Number(msg.receiver_id) === Number(me)) {
          this.unreadTotal = Math.min(99, (this.unreadTotal || 0) + 1);
        }
      } catch {}
    });

    // Cargar contador de pagos pendientes/eligibles (solo admin)
    if (this.isAdmin) {
      const token = this.sessionService.getAccessToken?.() as any;
      const secret = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin:secret') : null;
      if (secret) {
        this.adminPayments.pendingCount(secret, token).subscribe({
          next: (r: any) => {
            this.adminPendingCount = Number(r?.pending || 0) + Number(r?.eligible || 0);
          },
          error: () => {}
        });
      }
    }

    // Al navegar al chat o agenda, limpiar badges
    this.router.events.subscribe((ev: any) => {
      if (ev && ev.urlAfterRedirects && typeof ev.urlAfterRedirects === 'string') {
        if (ev.urlAfterRedirects.includes('/dash/mensajes')) {
          this.unreadTotal = 0;
        }
        if (ev.urlAfterRedirects.includes('/dash/agenda')) {
          console.log('🔔 [DASH_LAYOUT] Navegando a Agenda - Limpiando contador de citas');
          this.pendingAppointmentsCount = 0;
        }
      }
    });
  }

  onOnlineToggle(next: boolean) {
    this.isOnline = !!next;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem('provider:isOnline', String(this.isOnline)); } catch {}
  }
  
  /**
   * 🔊 Reproducir sonido de notificación
   * Método preparado para cuando agregues el archivo de audio
   */
  private playNotificationSound(): void {
    try {
      // Crear un elemento de audio dinámicamente
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5; // Volumen al 50%
      audio.play().catch(err => {
        console.warn('🔴 [DASH_LAYOUT] No se pudo reproducir el sonido:', err);
        // Los navegadores bloquean audio automático sin interacción del usuario
        // Este es el comportamiento esperado en la primera carga
      });
    } catch (err) {
      console.error('🔴 [DASH_LAYOUT] Error reproduciendo sonido:', err);
    }
  }

  private loadProviderProfile() {
    console.log('[DASH_LAYOUT] Cargando perfil de provider...');
    
    // Primero intentar desde localStorage
    const u = this.sessionService.getUser();
    if (u) {
      this.providerName = u.name || null;
      this.providerAvatarUrl = u.profile_photo_url ? 
        `${environment.apiBaseUrl}${u.profile_photo_url}` : null;
      // no siempre viene is_online en sesión; se obtiene del perfil
      console.log('[DASH_LAYOUT] Datos desde sesión:', { name: this.providerName, avatar: this.providerAvatarUrl });
    }
    
    // Luego obtener desde el backend (datos frescos y completos)
    this.providerProfile.getProfile().subscribe({
      next: (profile) => {
        console.log('[DASH_LAYOUT] Perfil obtenido del backend:', profile);
        if (profile) {
          this.providerName = profile.full_name || 'Provider';
          this.providerAvatarUrl = profile.profile_photo_url ? 
            `${environment.apiBaseUrl}${profile.profile_photo_url}` : null;
          this.isOnline = profile.is_online ?? null;
          console.log('[DASH_LAYOUT] Datos actualizados desde backend:', { 
            name: this.providerName, 
            avatar: this.providerAvatarUrl,
            isOnline: this.isOnline
          });
        }
      },
      error: (error) => {
        console.error('[DASH_LAYOUT] Error obteniendo perfil:', error);
        // Si falla, intentar con getCurrentUserInfo como fallback
        this.auth.getCurrentUserInfo().subscribe({
          next: (res) => {
            const user = (res as any).data?.user || (res as any).user || res.user;
            if (user) {
              this.providerName = user.name || this.providerName;
              this.providerAvatarUrl = user.profile_photo_url ? 
                `${environment.apiBaseUrl}${user.profile_photo_url}` : this.providerAvatarUrl;
              console.log('[DASH_LAYOUT] Datos desde fallback:', { name: this.providerName, avatar: this.providerAvatarUrl });
            }
          },
          error: (err) => console.error('[DASH_LAYOUT] Error en fallback:', err)
        });
      }
    });
  }

  onNav() {
    if (window && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
    }
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src.indexOf('/assets/default-avatar.png') === -1) {
      img.src = '/assets/default-avatar.png';
    }
  }

  private loadPlanInfo() {
    const user = this.sessionService.getUser();
    if (user && user.role === 'provider') {
      this.planService.getCurrentPlan(user.id).subscribe({
        next: (response) => {
          if (response.ok && response.currentPlan) {
            this.planInfo = response.currentPlan;
            this.showPlanAlert = this.planService.shouldShowUpgradeAlert();
          }
        },
        error: (error) => {
          console.error('Error loading plan info:', error);
        }
      });
    }
  }

  onPlanUpgrade() {
    // El componente ya redirige a /auth/select-plan
    console.log('Upgrading plan...');
  }

  onPlanAlertDismiss() {
    this.showPlanAlert = false;
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        // Logout exitoso, redirigir al home
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Aunque falle el logout en el servidor, ya se limpiaron los datos localmente
        // Redirigir al home de todas formas
        this.router.navigateByUrl('/');
      }
    });
  }

  // Event handlers del topbar
  onHelpClick(helpContext: string): void {
    console.log('Help clicked for context:', helpContext);
    // TODO: Implementar modal de ayuda contextual
    this.showHelpModal(helpContext);
  }

  private showHelpModal(context: string): void {
    // TODO: Implementar modal de ayuda
    // Por ahora solo un console.log
    const helpContent = this.getHelpContent(context);
    console.log('Mostrando ayuda para:', context, helpContent);
  }

  private getHelpContent(context: string): string {
    const helpContent = {
      'dashboard': 'Aquí puedes gestionar tu perfil, ver estadísticas, configurar servicios y más.',
      'perfil': 'Configura tu información personal, servicios, horarios y disponibilidad.',
      'agenda': 'Gestiona tus citas, horarios disponibles y configuración del calendario.',
      'general': 'Centro de ayuda general de Adomi.'
    };
    return helpContent[context as keyof typeof helpContent] || helpContent.general;
  }

  onNotificationClick(): void {
    console.log('Notifications clicked');
    // TODO: Implementar lógica de notificaciones
  }

  onSettingsClick(): void {
    console.log('Settings clicked');
    
    // Si estamos en la página de perfil, navegar al tab de configuración
    if (this.router.url.includes('/dash/perfil')) {
      this.router.navigate(['/dash/perfil'], {
        queryParams: { tab: 'configuracion' }
      });
    } else {
      // Para otras páginas, navegar al perfil con el tab de configuración
      this.router.navigate(['/dash/perfil'], {
        queryParams: { tab: 'configuracion' }
      });
    }
  }

  /**
   * Formatear fecha en español (ej: "lunes 20 de octubre")
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString + 'T00:00:00');
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      };
      return date.toLocaleDateString('es-CL', options);
    } catch {
      return dateString;
    }
  }

  private formatDueDateLabel(due: string): string {
    try {
      const date = new Date(due);
      const formatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' });
      return formatter.format(date);
    } catch {
      return due;
    }
  }

  private async initializeNotifications(): Promise<void> {
    try {
      console.log('[DASH_LAYOUT] Inicializando notificaciones push...');
      await this.pushNotifications.initializeForUser();
      console.log('[DASH_LAYOUT] Notificaciones push inicializadas');
      
      // Cargar contador de notificaciones in-app
      this.loadUnreadNotificationsCount();
      
      // Actualizar cada 30 segundos
      setInterval(() => {
        this.loadUnreadNotificationsCount();
      }, 30000);
    } catch (error) {
      console.error('[DASH_LAYOUT] Error inicializando notificaciones:', error);
    }
  }
  
  private loadUnreadNotificationsCount(): void {
    console.log('[DASH_LAYOUT] 🔔 Loading unread notifications count...');
    this.pushNotifications.getUnreadCount().subscribe({
      next: (resp: any) => {
        console.log('[DASH_LAYOUT] 🔔 Unread count response:', resp);
        if (resp?.ok && typeof resp.count === 'number') {
          this.notifications.updateUnreadCount(resp.count);
          console.log('[DASH_LAYOUT] 🔔 Unread notifications count updated:', resp.count);
        } else {
          console.warn('[DASH_LAYOUT] 🔔 Invalid response format:', resp);
        }
      },
      error: (err) => {
        console.error('[DASH_LAYOUT] 🔔 Error loading unread count:', err);
      }
    });
  }
}
