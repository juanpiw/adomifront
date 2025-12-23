import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { ProviderVerificationService, VerificationStatus } from '../../services/provider-verification.service';
import { TbkOnboardingService, TbkOnboardingState } from '../../services/tbk-onboarding.service';
import { GlobalSearchService } from '../../../libs/shared-ui/global-search/services/global-search.service';
import { FeatureFlagsService } from '../../../libs/core/services/feature-flags.service';
import { GoldenInviteModalComponent } from '../../../libs/shared-ui/golden-invite-modal/golden-invite-modal.component';
import { ProviderInviteService, ProviderInviteSummary } from '../../services/provider-invite.service';
import { Notification } from '../../../libs/shared-ui/notifications/models/notification.model';

interface PlanTierDescriptor {
  chip: string;
  detail: string;
  variant: 'founder' | 'basic' | 'pro' | 'premium';
}

@Component({
  selector: 'app-dash-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent, PlanUpgradeAlertComponent, TopbarComponent, OnlineStatusSwitchComponent, GoldenInviteModalComponent],
  templateUrl: './dash-layout.component.html',
  styleUrls: ['./dash-layout.component.scss']
})
export class DashLayoutComponent implements OnInit, OnDestroy {
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
  cashNotice: {
    amount: number;
    currency: string;
    dueDateLabel?: string;
    status: 'pending' | 'overdue' | 'under_review' | 'rejected';
    overdueAmount?: number;
    manualStatus?: 'under_review' | 'paid' | 'rejected' | null;
    manualUpdatedAt?: string | null;
  } | null = null;
  isFounderAccount: boolean = false;
  planTierInfo: PlanTierDescriptor | null = null;
  planProgress: { percent: number; startLabel: string; endLabel: string; remainingLabel: string } | null = null;
  
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
    userProfile: 'provider',
    planBadge: null,
    verificationBadge: null
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
  private providerVerification = inject(ProviderVerificationService);
  private tbkOnboarding = inject(TbkOnboardingService);
  private globalSearch = inject(GlobalSearchService);
  private providerInvites = inject(ProviderInviteService);
  private featureFlags = inject(FeatureFlagsService);

  private pushMessageSub?: Subscription;
  private unreadIntervalId: ReturnType<typeof setInterval> | null = null;
  private topbarPlanBadge: TopbarConfig['planBadge'] = null;
  private topbarVerificationBadge: TopbarConfig['verificationBadge'] = null;
  private tbkStateSub?: Subscription;

  verificationStatus: VerificationStatus = 'none';
  verificationRejectionReason: string | null = null;
  verificationBanner: { message: string; variant: 'info' | 'warning' | 'danger'; actionLabel?: string; actionLink?: string } | null = null;
  showVerificationPrompt = false;
  tbkState: TbkOnboardingState | null = null;
  tbkBlockingActive = false;
  private currentUrl: string | null = null;
  private readonly TBK_BLOCKER_DISMISSED_KEY = 'provider:tbkBlockerDismissed';
  private readonly GOLDEN_INVITE_DISMISSED_KEY = 'provider:goldenInviteModalDismissed';

  showGoldenInviteModal = false;
  goldenInviteSummary: ProviderInviteSummary | null = null;
  private lastVerificationStatus: VerificationStatus | null = null;
  isPioneer = false;
  private inviteSummaryLoaded = false;
  hasQuotesFeature = false;
  showPromotionsMenu = false;

  ngOnInit() {
    this.loadPlanInfo();
    this.loadProviderProfile();
    this.loadVerificationState();
    this.initializeNotifications();
    this.initializeTbkOnboarding();
    this.globalSearch.setContext({
      userRole: 'provider',
      currentPage: this.router.url
    });
    this.refreshFeatureFlags();

    const user = this.sessionService.getUser();
    if (user && user.role === 'provider') {
      this.payments.cashSummary$.subscribe((summary) => {
        console.log('[TRACE][TOPBAR] cashSummary$ emission', summary);
        if (summary) {
          const totalDue = Number(summary.total_due || 0);
          const overdueAmount = Number(summary.overdue_due || 0);
          const underReviewCount = Number(summary.under_review_count || 0);
          const rejectedCount = Number(summary.rejected_count || 0);
          const manualStatus = (summary.last_debt?.manual_payment_status || null) as ('under_review' | 'paid' | 'rejected' | null);
          const manualUpdatedAt = summary.last_debt?.manual_payment_updated_at || null;
          const currency = summary.last_debt?.currency || 'CLP';
          const dueForLabel = summary.next_due_date || summary.last_debt?.due_date || null;

          let status: 'pending' | 'overdue' | 'under_review' | 'rejected' = 'pending';
          if (overdueAmount > 0) {
            status = 'overdue';
          } else if (manualStatus === 'rejected' || rejectedCount > 0) {
            status = 'rejected';
          } else if (manualStatus === 'under_review' || underReviewCount > 0) {
            status = 'under_review';
          }

          if (totalDue > 0 || status === 'under_review' || status === 'rejected') {
            this.cashNotice = {
              amount: totalDue,
              currency,
              overdueAmount: overdueAmount > 0 ? overdueAmount : undefined,
              dueDateLabel: dueForLabel ? this.formatDueDateLabel(dueForLabel) : undefined,
              status,
              manualStatus,
              manualUpdatedAt: manualUpdatedAt || null
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
      // Realtime: cuando se actualiza la deuda (pago o revisión), refrescar resumen cash para banners/CTA
      this.appointments.onDebtUpdated().subscribe(() => {
        try {
          this.payments.refreshCashSummary().subscribe({ error: () => {} });
        } catch {}
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
    this.currentUrl = this.router.url;
    this.evaluateTbkBlocking();

    this.router.events.subscribe((ev: any) => {
      if (ev && ev.urlAfterRedirects && typeof ev.urlAfterRedirects === 'string') {
        this.currentUrl = ev.urlAfterRedirects;
        this.evaluateTbkBlocking();

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
          this.isFounderAccount = this.isFounderAccount || false;
          this.evaluateVerificationStatus(profile.verification_status as VerificationStatus | undefined, this.verificationRejectionReason);
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
              this.evaluateVerificationStatus((user as any)?.verification_status as VerificationStatus | undefined, this.verificationRejectionReason);
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
          this.planService.updatePlanInfo(this.planInfo);
            this.showPlanAlert = this.planService.shouldShowUpgradeAlert();
            this.planProgress = this.computePlanProgress(this.planInfo);

          const planId = response.currentPlan.id;
          const planName = String(response.currentPlan.name || '').toLowerCase();
          const planType = String((response.currentPlan as any).plan_type || '').toLowerCase();
          const planKey = String((response.currentPlan as any)?.plan_key || '').toLowerCase();
          console.log('[DASH_LAYOUT] PlanInfo loaded', {
            id: planId,
            planKey,
            planType,
            name: response.currentPlan.name,
            is_founder: (response.currentPlan as any)?.is_founder,
            founder_expires_at: (response.currentPlan as any)?.founder_expires_at
          });
          const planIsFounder =
            planKey === 'founder' ||
            planType.includes('founder') || planType.includes('fundador') ||
            planName.includes('founder') || planName.includes('fundador');
          const isFounder = !!planId && planIsFounder;
          this.isFounderAccount = isFounder;
          this.topbarPlanBadge = isFounder ? { label: 'Cuenta Fundador', variant: 'founder' } : null;
            this.refreshPlanTierDescriptor();
            this.refreshTopbarBadges();
          } else {
            this.isFounderAccount = false;
            this.topbarPlanBadge = null;
            this.refreshPlanTierDescriptor();
            this.refreshTopbarBadges();
          }
          this.refreshFeatureFlags();
        },
        error: (error) => {
          console.error('Error loading plan info:', error);
          this.isFounderAccount = false;
          this.topbarPlanBadge = null;
          this.refreshTopbarBadges();
          this.refreshFeatureFlags();
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

  goToSelectPlan(event: Event) {
    try { event?.preventDefault(); } catch {}
    this.router.navigateByUrl('/auth/select-plan').catch(() => {
      try { window.location.assign('/auth/select-plan'); } catch {}
    });
    this.onNav();
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

  onNotificationClick(notification?: Notification | void): void {
    if (!notification) {
      this.router.navigateByUrl('/notificaciones');
      return;
    }
    const target = this.resolveNotificationRoute(notification as Notification, 'provider');
    if (target.redirectToLogin) {
      this.router.navigate(['/auth/login'], {
        queryParams: { redirect: target.url, ...target.queryParams }
      });
      return;
    }
    if (target.url) {
      this.router.navigate([target.url], { queryParams: target.queryParams, state: target.state });
    } else {
      this.router.navigateByUrl('/notificaciones');
    }
  }

  private resolveNotificationRoute(
    notification: Notification,
    role: 'client' | 'provider'
  ): { url: string | null; queryParams?: Record<string, any>; state?: any; redirectToLogin?: boolean } {
    const hasToken = !!this.auth.getAccessToken();
    if (!hasToken) {
      return { url: '/auth/login', queryParams: { redirect: this.router.url }, redirectToLogin: true };
    }

    const routeHint = notification.routeHint || notification.link;
    const params = notification.params || {};
    const metadata = notification.metadata || {};
    const entityType = notification.entityType || metadata['entity_type'] || notification.type;
    const entityId =
      notification.entityId ||
      metadata['entity_id'] ||
      metadata['appointment_id'] ||
      metadata['quote_id'] ||
      metadata['thread_id'] ||
      null;

    // Si ya viene un route_hint explícito, úsalo
    if (routeHint) {
      return { url: routeHint, queryParams: params };
    }

    // Resolver por tipo
    if (entityType === 'appointment' || notification.type === 'appointment' || notification.type === 'booking') {
      return {
        url: role === 'provider' ? '/dash/agenda' : '/client/reservas',
        queryParams: entityId ? { appointmentId: entityId, ...params } : params
      };
    }

    if (entityType === 'quote') {
      return {
        url: role === 'provider' ? '/dash/cotizaciones' : '/client/cotizaciones',
        queryParams: entityId ? { quoteId: entityId, ...params } : params
      };
    }

    if (entityType === 'message' || notification.type === 'message') {
      return {
        url: role === 'provider' ? '/dash/chat' : '/client/chat',
        queryParams: entityId ? { threadId: entityId, ...params } : params
      };
    }

    if (entityType === 'verification') {
      return { url: '/dash/perfil/identidad', queryParams: params };
    }

    if (entityType === 'payment') {
      return { url: '/dash/caja', queryParams: params };
    }

    return { url: role === 'provider' ? '/dash/home' : '/client/home', queryParams: params };
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

  private loadVerificationState(): void {
    this.providerVerification.getStatus().subscribe({
      next: (payload) => {
        const status = (payload.profile?.verification_status as VerificationStatus | undefined) || (payload.verification?.status as VerificationStatus | undefined) || 'none';
        this.verificationRejectionReason = payload.verification?.rejection_reason || null;
        this.evaluateVerificationStatus(status, this.verificationRejectionReason);
      },
      error: () => {
        this.evaluateVerificationStatus('none', null);
      }
    });
  }

  private evaluateVerificationStatus(status: VerificationStatus | undefined, rejectionReason: string | null) {
    if (!status) status = 'none';
    const previousStatus = this.lastVerificationStatus;
    this.lastVerificationStatus = status;
    this.verificationStatus = status;
    this.verificationRejectionReason = rejectionReason;

    const hasDismissed = typeof localStorage !== 'undefined' && localStorage.getItem('provider:verificationPromptDismissed') === 'true';
    this.showVerificationPrompt = (status === 'none' || status === 'rejected') && !hasDismissed;

    if (status === 'pending') {
      this.verificationBanner = {
        message: 'Estamos revisando tus documentos. Te avisaremos cuando la verificación esté lista.',
        variant: 'info',
        actionLabel: 'Ver estado',
        actionLink: '/dash/perfil?tab=verificacion'
      };
    } else if (status === 'rejected') {
      this.verificationBanner = {
        message: 'Tu verificación fue rechazada. Sube nuevamente tus documentos para generar confianza.',
        variant: 'warning',
        actionLabel: 'Reintentar verificación',
        actionLink: '/dash/perfil?tab=verificacion'
      };
    } else if (status === 'approved') {
      this.verificationBanner = null;
    } else {
      this.verificationBanner = {
        message: 'Completa la verificación de identidad para destacar tu perfil con clientes.',
        variant: 'info',
        actionLabel: 'Iniciar verificación',
        actionLink: '/dash/perfil?tab=verificacion'
      };
    }

    this.updateVerificationBadge();
    if (status === 'approved') {
      this.loadInviteSummaryIfNeeded();
    }

    if (
      status === 'approved' &&
      previousStatus !== 'approved' &&
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(this.GOLDEN_INVITE_DISMISSED_KEY) !== 'true'
    ) {
      this.openGoldenInviteModal();
    }
  }

  private updateVerificationBadge() {
    if (this.verificationStatus === 'approved') {
      this.topbarVerificationBadge = {
        label: 'Identidad verificada',
        variant: 'verified',
        tooltip: 'Tus clientes verán la insignia de identidad verificada',
        link: '/dash/perfil?tab=verificacion'
      };
    } else if (this.verificationStatus === 'pending') {
      this.topbarVerificationBadge = {
        label: 'Verificación en proceso',
        variant: 'pending',
        tooltip: 'Nuestro equipo está revisando tus documentos',
        link: '/dash/perfil?tab=verificacion'
      };
    } else if (this.verificationStatus === 'rejected') {
      this.topbarVerificationBadge = {
        label: 'Verificación rechazada',
        variant: 'rejected',
        tooltip: 'Vuelve a subir tus documentos para completar la verificación',
        link: '/dash/perfil?tab=verificacion'
      };
    } else {
      this.topbarVerificationBadge = {
        label: 'Verificar identidad',
        variant: 'pending',
        tooltip: 'Completa la verificación para mejorar tu reputación',
        link: '/dash/perfil?tab=verificacion'
      };
    }

    this.refreshTopbarBadges();
  }

  private openGoldenInviteModal() {
    this.providerInvites.list().subscribe({
      next: (response) => {
        if (response?.success) {
          this.applyInviteSummary(response.summary || null);
        }
        this.showGoldenInviteModal = true;
      },
      error: () => {
        this.goldenInviteSummary = null;
        this.showGoldenInviteModal = true;
      }
    });
  }

  onGoldenInvitePrimary() {
    this.dismissGoldenInviteModal();
    this.router.navigate(['/dash/home'], { queryParams: { view: 'invitaciones' } });
  }

  dismissGoldenInviteModal() {
    this.showGoldenInviteModal = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.GOLDEN_INVITE_DISMISSED_KEY, 'true');
      }
    } catch {}
  }

  private applyInviteSummary(summary: ProviderInviteSummary | null) {
    this.goldenInviteSummary = summary;
    const unlocked = !!summary?.pioneer_unlocked_at;
    if (unlocked !== this.isPioneer) {
      this.isPioneer = unlocked;
      this.updatePlanBadge();
    }
    this.inviteSummaryLoaded = true;
  }

  private loadInviteSummaryIfNeeded(force = false) {
    if (!force && this.inviteSummaryLoaded) return;
    this.providerInvites.list().subscribe({
      next: (response) => {
        if (response?.success) {
          this.applyInviteSummary(response.summary || null);
        } else {
          this.inviteSummaryLoaded = true;
        }
      },
      error: () => {
        this.inviteSummaryLoaded = true;
      }
    });
  }

  private updatePlanBadge() {
    if (this.isFounderAccount && this.isPioneer) {
      this.topbarPlanBadge = { label: 'Fundador · Pionero', variant: 'founder' };
    } else if (this.isFounderAccount) {
      this.topbarPlanBadge = { label: 'Cuenta Fundador', variant: 'founder' };
    } else if (this.isPioneer) {
      this.topbarPlanBadge = { label: 'Pionero', variant: 'founder' };
    } else {
      this.topbarPlanBadge = null;
    }
    this.refreshPlanTierDescriptor();
    this.refreshTopbarBadges();
  }

  private refreshTopbarBadges() {
    this.topbarConfig = {
      ...this.topbarConfig,
      planBadge: this.topbarPlanBadge,
      verificationBadge: this.topbarVerificationBadge
    };
  }

  private refreshFeatureFlags() {
    this.hasQuotesFeature = this.sessionService.isProvider();
    this.showPromotionsMenu = false;
  }

  dismissVerificationPrompt() {
    this.showVerificationPrompt = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('provider:verificationPromptDismissed', 'true');
      }
    } catch {}
  }

  goToVerification() {
    this.dismissVerificationPrompt();
    this.router.navigate(['/dash/perfil'], { queryParams: { tab: 'verificacion' } });
  }

  onVerificationBannerAction() {
    if (!this.verificationBanner?.actionLink) {
      this.router.navigate(['/dash/perfil'], { queryParams: { tab: 'verificacion' } });
      return;
    }
    const link = this.verificationBanner.actionLink;
    if (link.startsWith('http')) {
      if (typeof window !== 'undefined') {
        window.open(link, '_blank');
      }
      return;
    }
    this.router.navigateByUrl(link);
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

  private refreshPlanTierDescriptor(): void {
    this.planTierInfo = this.resolvePlanTierDescriptor(this.planInfo, this.isFounderAccount);
  }

  private computePlanProgress(plan: PlanInfo | null): { percent: number; startLabel: string; endLabel: string; remainingLabel: string } | null {
    if (!plan?.expires_at) return null;
    const end = new Date(plan.expires_at);
    if (Number.isNaN(end.getTime())) return null;

    const start = (() => {
      if (plan.current_period_start) {
        const s = new Date(plan.current_period_start);
        if (!Number.isNaN(s.getTime())) return s;
      }
      const billing = String(plan.billing_period || '').toLowerCase();
      const months = billing === 'year' || billing === 'yearly' ? 12 : 1;
      const s = new Date(end);
      s.setMonth(s.getMonth() - months);
      return s;
    })();

    if (!start || Number.isNaN(start.getTime())) return null;
    const total = end.getTime() - start.getTime();
    if (total <= 0) return null;

    const now = new Date();
    const elapsed = Math.min(Math.max(now.getTime() - start.getTime(), 0), total);
    const percent = Math.round((elapsed / total) * 100);

    const formatShort = (d: Date) =>
      d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
    const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      percent,
      startLabel: formatShort(start),
      endLabel: formatShort(end),
      remainingLabel: `${remainingDays} días restantes`
    };
  }

  private resolvePlanTierDescriptor(plan: any | null, isFounder: boolean): PlanTierDescriptor | null {
    if (!plan) return null;

    const planKey = String(plan?.plan_key || '').toLowerCase();
    const planName = String(plan?.name || '').trim();
    const planType = String(plan?.plan_type || '').toLowerCase();
    const billing = String(plan?.billing_period || '').toLowerCase();
    const planId = plan?.id;
    const priceNum = plan?.price !== null && plan?.price !== undefined ? Number(plan.price) : null;
    const effectiveRate = plan?.effective_commission_rate !== null && plan?.effective_commission_rate !== undefined
      ? Number(plan.effective_commission_rate)
      : null;
    const founderDiscountActive = !!plan?.founder_discount_active;
    const isFounderPlanType =
      !!planId &&
      (
        planKey === 'founder' ||
        planType.includes('founder') ||
        planType.includes('fundador') ||
        planName.toLowerCase().includes('founder') ||
        planName.toLowerCase().includes('fundador')
      );

    const formatClp = (n: number) =>
      new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));
    const priceLabel = (() => {
      if (!(priceNum !== null && Number.isFinite(priceNum)) || priceNum <= 0) return 'Gratis';
      const suffix = billing === 'year' ? '/año' : '/mes';
      return `$${formatClp(priceNum)}${suffix}`;
    })();
    const commissionLabel = effectiveRate !== null && Number.isFinite(effectiveRate)
      ? `${Math.round(effectiveRate * 10) / 10}% comisión`
      : 'Comisión';

    if (isFounderPlanType) {
      if (founderDiscountActive) {
        return {
          chip: '💎 Fundador',
          detail: `Descuento Fundador · -15% fee por 6 meses · ${commissionLabel}`,
          variant: 'founder'
        };
      }
      return {
        chip: '💎 Fundador',
        detail: `Plan promocional · 0% comisión por 3 meses`,
        variant: 'founder'
      };
    }

    // Map por plan_key cuando existe
    if (planKey === 'scale' || planName.toLowerCase().includes('scale')) {
      return {
        chip: '🚀 Plan Scale',
        detail: `Para escalar · ${priceLabel} · ${commissionLabel}`,
        variant: 'premium'
      };
    }
    if (planKey === 'pro' || planName.toLowerCase().includes('pro')) {
      return {
        chip: '⭐ Plan Pro',
        detail: `Para crecer · ${priceLabel} · ${commissionLabel}`,
        variant: 'pro'
      };
    }
    if (planKey === 'starter' || planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('básico') || planName.toLowerCase().includes('basico') || planName.toLowerCase().includes('basic')) {
      if (founderDiscountActive) {
        return {
          chip: 'Plan Starter',
          detail: `Gratis · Descuento Fundador (-15% fee por 6 meses) · ${commissionLabel}`,
          variant: 'basic'
        };
      }
      return {
        chip: 'Plan Starter',
        detail: `Para empezar · ${priceLabel} · ${commissionLabel}`,
        variant: 'basic'
      };
    }

    // Fallback genérico
    return {
      chip: planName || 'Plan',
      detail: `${priceLabel} · ${commissionLabel}`,
      variant: 'basic'
    };
  }

  private async initializeNotifications(): Promise<void> {
    try {
      console.log('[DASH_LAYOUT] Inicializando notificaciones push...');
      await this.pushNotifications.initializeForUser();
      console.log('[DASH_LAYOUT] Notificaciones push inicializadas');

      if (!this.pushMessageSub) {
        this.pushMessageSub = this.pushNotifications.foregroundMessages$.subscribe(() => {
          this.loadUnreadNotificationsCount();
        });
      }
      
      // Cargar contador de notificaciones in-app
      this.loadUnreadNotificationsCount();
      
      // Actualizar cada 30 segundos
      if (!this.unreadIntervalId) {
        this.unreadIntervalId = setInterval(() => {
          this.loadUnreadNotificationsCount();
        }, 30000);
      }
    } catch (error) {
      console.error('[DASH_LAYOUT] Error inicializando notificaciones:', error);
    }
  }

  private initializeTbkOnboarding(): void {
    if (!this.tbkStateSub) {
      this.tbkStateSub = this.tbkOnboarding.state$.subscribe((state) => {
        this.tbkState = state;
        this.evaluateTbkBlocking();
      });
    }

    void this.tbkOnboarding.refreshStatus().catch((error) => {
      console.warn('[DASH_LAYOUT] No se pudo refrescar el estado TBK:', error);
    });
  }

  onForceTbkSetup(): void {
    this.router.navigate(['/dash/ingresos'], {
      queryParams: { section: 'tbk', onboarding: '1' }
    });
  }

  private evaluateTbkBlocking(): void {
    const shouldBlock = this.tbkOnboarding.requiresBlocking();
    let dismissed = false;
    try {
      dismissed = typeof localStorage !== 'undefined' && localStorage.getItem(this.TBK_BLOCKER_DISMISSED_KEY) === 'true';
    } catch {}
    this.tbkBlockingActive = shouldBlock && !dismissed && !this.isOnTbkSetupRoute();
  }

  private isOnTbkSetupRoute(): boolean {
    const url = this.currentUrl || this.router.url || '';
    return url.includes('/dash/ingresos');
  }

  ngOnDestroy(): void {
    this.pushMessageSub?.unsubscribe();
    this.pushMessageSub = undefined;
    if (this.unreadIntervalId) {
      clearInterval(this.unreadIntervalId);
      this.unreadIntervalId = null;
    }
    this.tbkStateSub?.unsubscribe();
    this.tbkStateSub = undefined;
  }

  // Permite cerrar temporalmente el modal de TBK hasta próxima sesión/cambio de estado
  dismissTbkBlocker(): void {
    this.tbkBlockingActive = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.TBK_BLOCKER_DISMISSED_KEY, 'true');
      }
    } catch {}
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
