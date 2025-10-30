import { Component, inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';
import { TopbarComponent, TopbarConfig } from '../../../libs/shared-ui/topbar/topbar.component';
import { AuthService } from '../../auth/services/auth.service';
import { ClientProfileService } from '../../services/client-profile.service';
import { environment } from '../../../environments/environment';
import { MenuService } from '../services/menu.service';
import { ChatService, MessageDto } from '../../services/chat.service';
import { AppointmentsService, AppointmentDto } from '../../services/appointments.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent, TopbarComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  private menuSubscription?: Subscription;

  // Configuración del topbar para cliente
  topbarConfig: TopbarConfig = {
    showSearch: true,
    showHamburger: true,
    showNotifications: true,
    showSettings: true,
    searchPlaceholder: '¿Necesitas ayuda?',
    helpContext: 'cliente'
  };
  
  private auth = inject(AuthService);
  private router = inject(Router);
  menuService = inject(MenuService);
  private clientProfile = inject(ClientProfileService);
  private platformId = inject(PLATFORM_ID);
  private chat = inject(ChatService);
  private appointmentsService = inject(AppointmentsService);
  private notificationsService = inject(NotificationsService);

  userName: string | null = null;
  userAvatarUrl: string | null = null;
  unreadTotal = 0;
  appointmentBadge = 0;
  private subs: Subscription[] = [];
  switchModalVisible = false;
  switchLoading = false;
  switchError: string | null = null;

  ngOnInit() {
    // Initialize collapsed state based on screen size
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
    }

    // Listen for window resize events (solo en navegador)
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', () => {
        if (window.matchMedia('(max-width: 900px)').matches) {
          this.isCollapsed = true;
        } else {
          this.isCollapsed = false;
        }
      });
    }

    // Suscribirse al servicio de menú para controlar el sidebar desde el chat
    this.menuSubscription = this.menuService.isMenuOpen$.subscribe(isOpen => {
      this.isCollapsed = !isOpen;
    });

    // Cargar datos del cliente (evitar interferir si estamos en onboarding de proveedor)
    if (isPlatformBrowser(this.platformId)) {
      try {
        const po = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('providerOnboarding') : null;
        if (po === '1') {
          console.log('[CLIENT_LAYOUT] Provider onboarding activo - omitiendo cargas/redirecciones de cliente');
          return;
        }
      } catch {}
      this.loadClientData();
      // Inicializar notificaciones push
      this.initializeNotifications();
    }

    // Escuchar cambios de foto de perfil (subida/eliminación) y refrescar avatar
    this.clientProfile.profilePhoto$.subscribe((photoUrl) => {
      if (photoUrl) {
        const full = photoUrl.startsWith('http') ? photoUrl : `${environment.apiBaseUrl}${photoUrl}`;
        this.userAvatarUrl = full;
      } else {
        this.userAvatarUrl = null;
      }
    });

    // Escuchar mensajes para badge (desde sala global de usuario)
    this.subs.push(
      this.chat.onMessageNew().subscribe((msg: MessageDto) => {
        try {
          const me = Number(JSON.parse(localStorage.getItem('adomi_user') || '{}')?.id || 0);
          if (me && Number(msg.receiver_id) === me) {
            this.unreadTotal = Math.min(99, (this.unreadTotal || 0) + 1);
          }
        } catch {}
      })
    );

    // Conectar socket y unirse a sala del usuario
    this.chat.connectSocket();

    // Al navegar al chat/reservas, limpiar badges
    this.router.events.subscribe((ev: any) => {
      if (ev && ev.urlAfterRedirects && typeof ev.urlAfterRedirects === 'string') {
        if (ev.urlAfterRedirects.includes('/client/conversaciones')) {
          this.unreadTotal = 0;
        }
        if (ev.urlAfterRedirects.includes('/client/reservas')) {
          this.appointmentBadge = 0;
        }
      }
    });

    // Conectar socket de citas y escuchar appointment:created
    const me = this.auth.getCurrentUser()?.id;
    if (me) {
      this.appointmentsService.connectSocket(me);
      this.subs.push(
        this.appointmentsService.onAppointmentCreated().subscribe((appt: AppointmentDto) => {
          // Si la cita es del cliente, incrementar badge
          if (appt.client_id === me) {
            this.appointmentBadge = Math.min(99, (this.appointmentBadge || 0) + 1);
          }
        })
      );
      this.subs.push(
        this.appointmentsService.onAppointmentUpdated().subscribe((appt: AppointmentDto) => {
          // Si cambió el estado y es del cliente, incrementar badge
          if (appt.client_id === me) {
            this.appointmentBadge = Math.min(99, (this.appointmentBadge || 0) + 1);
          }
        })
      );
    }
  }

  ngOnDestroy() {
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
    this.subs.forEach(s => s.unsubscribe());
  }

  onNav() {
    if (window && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
      this.menuService.closeMenu();
    }
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src.indexOf('/assets/default-avatar.png') === -1) {
      img.src = '/assets/default-avatar.png';
    }
  }

  switchToProvider(): void {
    this.switchError = null;
    this.switchModalVisible = true;
  }

  closeSwitchModal(): void {
    if (this.switchLoading) return;
    this.switchModalVisible = false;
  }

  confirmSwitchToProvider(): void {
    if (this.switchLoading) return;
    this.switchError = null;
    this.switchLoading = true;

    this.auth.switchAccountToProvider().subscribe({
      next: async () => {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('providerOnboarding', '1');
          }
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('adomi_user');
            if (raw && raw !== 'null' && raw !== 'undefined') {
              try {
                const u = JSON.parse(raw);
                u.intendedRole = 'provider';
                u.pending_role = 'provider';
                u.mode = 'register';
                localStorage.setItem('adomi_user', JSON.stringify(u));
              } catch {}
            }
          }
        } catch {}

        // Refrescar usuario para reflejar pending_role
        this.auth.getCurrentUserInfo().subscribe({ next: () => {}, error: () => {} });

        this.switchLoading = false;
        this.switchModalVisible = false;
        this.router.navigateByUrl('/auth/select-plan');
        this.onNav();
      },
      error: (err) => {
        this.switchLoading = false;
        const message = err?.error?.error || err?.message || 'No pudimos preparar el cambio de cuenta. Intenta nuevamente.';
        this.switchError = message;
      }
    });
  }

  private loadClientData() {
    console.log('[CLIENT_LAYOUT] Cargando datos del cliente...');
    
    // Primero desde localStorage (rápido)
    const stored = localStorage.getItem('adomi_user');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      try {
        const u = JSON.parse(stored);
        this.userName = u?.name || null;
        console.log('[CLIENT_LAYOUT] Nombre desde localStorage:', this.userName);
      } catch (e) {
        console.error('[CLIENT_LAYOUT] Error parseando usuario:', e);
      }
    }
    
    // Luego desde el perfil completo del cliente (datos frescos)
    this.clientProfile.getProfile().subscribe({
      next: (response) => {
        console.log('[CLIENT_LAYOUT] Perfil obtenido:', response);
        if (response.success && response.profile) {
          this.userName = response.profile.full_name || this.userName;
          
          const url = response.profile.profile_photo_url;
          if (url) {
            this.userAvatarUrl = url.startsWith('http') ? url : `${environment.apiBaseUrl}${url}`;
          }
          console.log('[CLIENT_LAYOUT] Datos actualizados:', { 
            name: this.userName, 
            avatar: this.userAvatarUrl 
          });
        }
      },
      error: (error) => {
        console.error('[CLIENT_LAYOUT] Error obteniendo perfil, usando fallback:', error);
        // Fallback: Usar getCurrentUserInfo
        this.auth.getCurrentUserInfo().subscribe({
          next: (res) => {
            const user = (res as any).data?.user || (res as any).user || res.user;
            if (user) {
              this.userName = user.name || this.userName;
              const avatar = user.profile_photo_url;
              if (avatar) {
                this.userAvatarUrl = avatar.startsWith('http') ? avatar : `${environment.apiBaseUrl}${avatar}`;
              }
              console.log('[CLIENT_LAYOUT] Datos desde fallback:', { 
                name: this.userName, 
                avatar: this.userAvatarUrl 
              });
            }
          },
          error: (err) => console.error('[CLIENT_LAYOUT] Error en fallback:', err)
        });
      }
    });
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
    console.log('Client help clicked for context:', helpContext);
    // TODO: Implementar modal de ayuda contextual para cliente
    this.showHelpModal(helpContext);
  }

  private showHelpModal(context: string): void {
    // TODO: Implementar modal de ayuda
    // Por ahora solo un console.log
    const helpContent = this.getHelpContent(context);
    console.log('Mostrando ayuda para cliente:', context, helpContent);
  }

  private getHelpContent(context: string): string {
    const helpContent = {
      'cliente': 'Aquí puedes explorar servicios, gestionar reservas, ver favoritos y más.',
      'explorar': 'Busca y encuentra los mejores profesionales para tus necesidades.',
      'reservas': 'Gestiona tus citas, ve el historial y cancela si es necesario.',
      'favoritos': 'Guarda tus profesionales favoritos para acceso rápido.',
      'perfil': 'Configura tu información personal y preferencias.',
      'general': 'Centro de ayuda para clientes de Adomi.'
    };
    return helpContent[context as keyof typeof helpContent] || helpContent.general;
  }

  onNotificationClick(): void {
    console.log('Client notifications clicked');
    // TODO: Implementar lógica de notificaciones para cliente
  }

  onSettingsClick(): void {
    this.router.navigate(['/client/configuracion']);
    this.onNav();
  }

  private async initializeNotifications(): Promise<void> {
    try {
      console.log('[CLIENT_LAYOUT] Inicializando notificaciones push...');
      await this.notificationsService.initializeForUser();
      console.log('[CLIENT_LAYOUT] Notificaciones push inicializadas');
      
      // Cargar contador de notificaciones in-app
      this.loadUnreadNotificationsCount();
      
      // Actualizar cada 30 segundos
      setInterval(() => {
        this.loadUnreadNotificationsCount();
      }, 30000);
    } catch (error) {
      console.error('[CLIENT_LAYOUT] Error inicializando notificaciones:', error);
    }
  }
  
  private loadUnreadNotificationsCount(): void {
    this.notificationsService.getUnreadCount().subscribe({
      next: (resp: any) => {
        if (resp?.ok && typeof resp.count === 'number') {
          console.log('[CLIENT_LAYOUT] Unread notifications count:', resp.count);
          // TODO: Actualizar UI con el contador
        }
      },
      error: (err) => {
        console.error('[CLIENT_LAYOUT] Error loading unread count:', err);
      }
    });
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
  }
}
