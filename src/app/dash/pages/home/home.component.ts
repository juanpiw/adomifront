import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InicioHeaderComponent, HeaderData } from '../../../../libs/shared-ui/inicio-header/inicio-header.component';
import {
  InicioProximaCitaComponent,
  ProximaCitaData
} from '../../../../libs/shared-ui/inicio-proxima-cita/inicio-proxima-cita.component';
import {
  CitaDetalleResult,
  CancelCitaResult
} from '../../../../libs/shared-ui/inicio-proxima-cita/modals';
import { InicioIngresosMesComponent, IngresosData } from '../../../../libs/shared-ui/inicio-ingresos-mes/inicio-ingresos-mes.component';
import { InicioIngresosDiaComponent, IngresosDiaData } from '../../../../libs/shared-ui/inicio-ingresos-dia/inicio-ingresos-dia.component';
import {
  InicioSolicitudesComponent,
  SolicitudData,
  AcceptReservaResult,
  RejectReservaResult
} from '../../../../libs/shared-ui/inicio-solicitudes';
import { AuthService } from '../../../auth/services/auth.service';
import { ProviderProfileService } from '../../../services/provider-profile.service';
import { AppointmentsService } from '../../../services/appointments.service';
import { PaymentsService } from '../../../services/payments.service';
import { TbkOnboardingService, TbkOnboardingState } from '../../../services/tbk-onboarding.service';
import { ProviderInviteService, ProviderInvite, ProviderInviteSummary } from '../../../services/provider-invite.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-d-home',
  standalone: true,
  imports: [
    CommonModule,
    InicioHeaderComponent,
    InicioProximaCitaComponent,
    InicioIngresosMesComponent,
    InicioIngresosDiaComponent,
    InicioSolicitudesComponent,
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class DashHomeComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private providerProfile = inject(ProviderProfileService);
  private appointmentsService = inject(AppointmentsService);
  private paymentsService = inject(PaymentsService);
  private tbkOnboarding = inject(TbkOnboardingService);
  private providerInvites = inject(ProviderInviteService);
  private route = inject(ActivatedRoute);
  
  constructor(private router: Router) {}
  
  // Estado online/offline
  isOnline: boolean = true;
  showTbkUrgentBanner = false;
  tbkState: TbkOnboardingState | null = null;
  private tbkStateSub?: Subscription;

  // Invitaciones doradas
  inviteSummary: ProviderInviteSummary | null = null;
  invites: ProviderInvite[] = [];
  inviteLoading = false;
  inviteError: string | null = null;
  inviteEmail: string = '';
  invitePhone: string = '';
  inviteName: string = '';
  inviteSubmitting = false;
  inviteSuccessMessage: string | null = null;
  inviteCardExpanded = false;
  inviteSummaryLoaded = false;

  // Datos para el header
  headerData: HeaderData = {
    userName: 'Usuario',
    hasNotifications: true
  };

  ngOnInit() {
    this.loadProviderName();
    this.loadPendingRequests();
    this.loadNextAppointment();
    this.loadEarningsData();
    this.initializeTbkBanner();
    this.loadInviteData();

    this.route.queryParamMap.subscribe((params) => {
      const view = (params.get('view') || '').toLowerCase();
      if (view === 'invitaciones') {
        this.inviteCardExpanded = true;
        this.loadInviteData(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.tbkStateSub?.unsubscribe();
    this.tbkStateSub = undefined;
  }

  private loadProviderName() {
    console.log('[DASH_HOME] Cargando nombre del provider...');
    
    // Primero intentar desde el AuthService (localStorage)
    const currentUser = this.auth.getCurrentUser();
    if (currentUser && currentUser.name) {
      this.headerData = {
        ...this.headerData,
        userName: currentUser.name
      };
      console.log('[DASH_HOME] Nombre desde caché:', currentUser.name);
    }
    
    // Luego obtener desde el backend (datos frescos)
    this.providerProfile.getProfile().subscribe({
      next: (profile) => {
        console.log('[DASH_HOME] Perfil obtenido:', profile);
        if (profile) {
          const name = profile.full_name || 'Usuario';
          this.headerData = {
            ...this.headerData,
            userName: name
          };
          console.log('[DASH_HOME] Nombre actualizado desde backend:', name);
        }
      },
      error: (error) => {
        console.error('[DASH_HOME] Error obteniendo perfil:', error);
        // Fallback con getCurrentUserInfo si falla el endpoint de perfil
        this.auth.getCurrentUserInfo().subscribe({
          next: (res) => {
            const user = (res as any).data?.user || (res as any).user || res.user;
            if (user && user.name) {
              this.headerData = {
                ...this.headerData,
                userName: user.name
              };
              console.log('[DASH_HOME] Nombre desde fallback:', user.name);
            }
          },
          error: (err) => console.error('[DASH_HOME] Error en fallback:', err)
        });
      }
    });
  }

  private loadPendingRequests() {
    console.log('[DASH_HOME] 🎯 Cargando solicitudes pendientes (citas confirmadas sin pagar)...');
    this.appointmentsService.listPendingRequests().subscribe({
      next: (response) => {
        console.log('[DASH_HOME] 📦 Respuesta completa de solicitudes pendientes:', response);
        if (response.success && response.appointments && response.appointments.length > 0) {
          console.log('[DASH_HOME] 📋 Citas confirmadas sin pagar encontradas:', response.appointments.length);
          this.solicitudesData = response.appointments.map((appt: any) => {
            const solicitud = {
              id: String(appt.id),
              clientName: appt.client_name || 'Cliente',
              clientAvatar: this.getAvatarUrl(appt.client_avatar_url, appt.client_name),
              service: appt.service_name || 'Servicio',
              when: this.formatWhen(appt.date),
              time: this.formatTime(appt.start_time),
              date: appt.date,
              location: 'Ubicación por confirmar',
              estimatedIncome: appt.scheduled_price || appt.price || 0
            };
            console.log('[DASH_HOME] 🔄 Mapeando cita:', appt.id, '->', solicitud);
            return solicitud;
          });
          console.log('[DASH_HOME] ✅ Solicitudes mapeadas exitosamente:', this.solicitudesData);
        } else {
          this.solicitudesData = [];
          console.log('[DASH_HOME] ⚠️ No hay solicitudes pendientes - response:', response);
        }
      },
      error: (error) => {
        console.error('[DASH_HOME] ❌ Error cargando solicitudes pendientes:', error);
        console.error('[DASH_HOME] ❌ Error details:', error.status, error.statusText, error.url);
        this.solicitudesData = [];
      }
    });
  }

  private loadNextAppointment() {
    console.log('[DASH_HOME] 🎯 Cargando próxima cita confirmada...');
    this.appointmentsService.getNextAppointment().subscribe({
      next: (response) => {
        console.log('[DASH_HOME] 📦 Respuesta completa de próxima cita:', response);
        if (response.success && response.appointment) {
          const appt = response.appointment;
          console.log('[DASH_HOME] 📅 Datos de la próxima cita:', appt);
          this.proximaCitaData = {
            id: String(appt.id),
            time: this.formatTime(appt.start_time),
            meridiem: this.getMeridiem(appt.start_time),
            service: appt.service_name || 'Servicio',
            clientName: appt.client_name || 'Cliente',
            date: appt.date,
            duration: '45 minutos', // TODO: calcular desde start_time y end_time
            amount: appt.scheduled_price || appt.price || 0,
            clientAvatar: this.getAvatarUrl(appt.client_avatar_url, appt.client_name, { size: 40 }),
            location: 'Ubicación por confirmar',
            mapUrl: 'https://maps.google.com/?q=Ubicacion'
          };
          console.log('[DASH_HOME] ✅ Próxima cita mapeada exitosamente:', this.proximaCitaData);
        } else {
          this.proximaCitaData = null;
          console.log('[DASH_HOME] ⚠️ No hay próxima cita - response:', response);
        }
      },
      error: (error) => {
        console.error('[DASH_HOME] ❌ Error cargando próxima cita:', error);
        console.error('[DASH_HOME] ❌ Error details:', error.status, error.statusText, error.url);
        this.proximaCitaData = null;
      }
    });
  }

  private loadEarningsData() {
    console.log('[DASH_HOME] Cargando datos de ingresos...');
    
    // Cargar ingresos del mes actual
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    this.paymentsService.getProviderEarningsSummary(month).subscribe({
      next: (response) => {
        console.log('[DASH_HOME] Ingresos del mes recibidos:', response);
        if (response.success && response.summary) {
          const earnings = response.summary;
          this.ingresosData = {
            amount: `$${(earnings.releasable || 0).toLocaleString('es-CL')}`,
            completedAppointments: earnings.paidCount || 0,
            averageRating: 4.9, // TODO: obtener rating real
            chartData: [45, 62, 78, 55, 89, 95, 82] // TODO: datos reales del gráfico
          };
          console.log('[DASH_HOME] Ingresos del mes mapeados:', this.ingresosData);
        }
      },
      error: (error) => {
        console.error('[DASH_HOME] Error cargando ingresos del mes:', error);
      }
    });

    // Cargar ingresos del día actual
    this.paymentsService.getProviderEarningsSummary().subscribe({
      next: (response) => {
        console.log('[DASH_HOME] Ingresos del día recibidos:', response);
        if (response.success && response.summary) {
          const earnings = response.summary;
          this.ingresosDiaData = {
            amount: `$${(earnings.releasable || 0).toLocaleString('es-CL')}`,
            completedAppointments: earnings.paidCount || 0,
            averageRating: 4.8, // TODO: obtener rating real del día
            chartData: [8, 12, 15, 18, 25, 22, 20] // TODO: datos reales del gráfico
          };
          console.log('[DASH_HOME] Ingresos del día mapeados:', this.ingresosDiaData);
        }
      },
      error: (error) => {
        console.error('[DASH_HOME] Error cargando ingresos del día:', error);
      }
    });
  }

  // Métodos auxiliares para formateo
  private formatWhen(dateStr: string): string {
    if (!dateStr) return 'Fecha no disponible';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  }

  private formatTime(timeStr: string): string {
    if (!timeStr) return '00:00';
    return timeStr.substring(0, 5); // HH:mm
  }

  private getMeridiem(timeStr: string): string {
    if (!timeStr) return 'AM';
    const hour = parseInt(timeStr.substring(0, 2));
    return hour >= 12 ? 'PM' : 'AM';
  }

  private getAvatarUrl(
    avatarPath?: string | null,
    name?: string | null,
    options?: { size?: number }
  ): string {
    if (avatarPath && typeof avatarPath === 'string' && avatarPath.trim().length > 0) {
      return avatarPath.trim();
    }

    const letter = (name || 'C').trim().charAt(0).toUpperCase() || 'C';
    const size = Math.max(32, Math.min(options?.size ?? 48, 200));
    const background = '6366F1';
    const color = 'FFFFFF';
    return `https://ui-avatars.com/api/?background=${background}&color=${color}&name=${encodeURIComponent(letter)}&size=${size}`;
  }

  // Datos para la próxima cita (ahora será null inicialmente)
  proximaCitaData: ProximaCitaData | null = null;

  // Datos para ingresos del mes
  ingresosData: IngresosData = {
    amount: '$450.000',
    completedAppointments: 22,
    averageRating: 4.9,
    chartData: [45, 62, 78, 55, 89, 95, 82]
  };

  // Datos para ingresos del día
  ingresosDiaData: IngresosDiaData = {
    amount: '$25.000',
    completedAppointments: 3,
    averageRating: 4.8,
    chartData: [8, 12, 15, 18, 25, 22, 20]
  };

  // Datos para solicitudes (ahora será un array)
  solicitudesData: SolicitudData[] = [];

  private readonly defaultGestionBlocks = [
    { id: '1', day: 'Lunes', startTime: '09:00', endTime: '11:00', status: 'confirmed' as const },
    { id: '2', day: 'Miércoles', startTime: '15:00', endTime: '17:00', status: 'confirmed' as const }
  ];

  gestionData = {
    timeBlocks: [...this.defaultGestionBlocks]
  };

  // Event handlers
  onNotificationClick() {
    console.log('Notificación clickeada');
    // TODO: Implementar lógica de notificaciones
  }

  onPublicProfileClick() {
    console.log('Ver perfil público');
    // Navegar al perfil del trabajador y activar el tab "Ver Perfil Público"
    this.router.navigate(['/dash/perfil'], {
      queryParams: { tab: 'ver-perfil-publico' }
    });
  }


  onViewDetailsClick(data: ProximaCitaData) {
    console.log('Ver detalles de cita:', data);
    // El modal se maneja automáticamente en el componente
  }

  onCitaAction(result: CitaDetalleResult) {
    console.log('Acción en cita:', result);
    switch (result.action) {
      case 'contact':
        console.log('Contactar cliente:', result.data);
        // TODO: Implementar lógica de contacto (chat, llamada, etc.)
        break;
      case 'reschedule':
        console.log('Reprogramar cita:', result.data);
        // TODO: Implementar lógica de reprogramación
        break;
    }
  }

  onCitaCancel(result: CancelCitaResult) {
    console.log('Cancelar cita:', result);
    // TODO: Implementar lógica de API para cancelar cita
    // TODO: Mostrar toast de confirmación
    // TODO: Actualizar lista de citas
  }

  onViewReportClick(data: IngresosData) {
    console.log('Ver reporte completo:', data);
    // TODO: Navegar al reporte completo
  }

  onViewDayReportClick(data: IngresosDiaData) {
    console.log('Ver reporte del día:', data);
    // TODO: Navegar al reporte del día
  }

  onNavigateToReport(navigationData: {period: string, type: string}) {
    console.log('Navegando a reporte:', navigationData);
    
    // Navegar a la página de ingresos con query parameters
    this.router.navigate(['/dash/ingresos'], {
      queryParams: {
        period: navigationData.period,
        type: navigationData.type
      }
    });
  }

  goToTbkSetup(): void {
    this.router.navigate(['/dash/ingresos'], {
      queryParams: { section: 'tbk' }
    });
  }

  onAcceptClick(data: SolicitudData) {
    console.log('Aceptar solicitud:', data);
    // Los modales se manejan automáticamente en el componente
  }

  onDeclineClick(data: SolicitudData) {
    console.log('Rechazar solicitud:', data);
    // Los modales se manejan automáticamente en el componente
  }

  onReservaAccepted(result: AcceptReservaResult) {
    console.log('Reserva aceptada:', result);
    // TODO: Implementar lógica de API para aceptar reserva
    // TODO: Mostrar toast de éxito
    // TODO: Actualizar lista de solicitudes
  }

  onReservaRejected(result: RejectReservaResult) {
    console.log('Reserva rechazada:', result);
    // TODO: Implementar lógica de API para rechazar reserva
    // TODO: Mostrar toast de información
    // TODO: Actualizar lista de solicitudes
  }

  onAddTimeBlock(data: { day: string; startTime: string; endTime: string }) {
    const newBlock = {
      id: Date.now().toString(),
      ...data,
      status: 'confirmed' as const
    };
    this.gestionData.timeBlocks = [...this.gestionData.timeBlocks, newBlock];
    console.log('Bloque de tiempo agregado:', newBlock);
  }

  onRemoveTimeBlock(blockId: string) {
    this.gestionData.timeBlocks = this.gestionData.timeBlocks.filter((block) => block.id !== blockId);
    console.log('Bloque de tiempo eliminado:', blockId);
  }

  private initializeTbkBanner(): void {
    if (!this.tbkStateSub) {
      this.tbkStateSub = this.tbkOnboarding.state$.subscribe((state) => {
        this.tbkState = state;
        this.showTbkUrgentBanner = state?.status === 'none';
      });
    }

    void this.tbkOnboarding.refreshStatus().catch((error) => {
      console.warn('[DASH_HOME] No se pudo refrescar el estado TBK:', error);
    });
  }

  loadInviteData(focus = false) {
    this.inviteLoading = true;
    this.inviteError = null;
    this.providerInvites.list().subscribe({
      next: (response) => {
        if (response?.success) {
          this.applyInviteSummary(response.summary || null);
          this.invites = response.invites || [];
          if (!this.inviteCardExpanded && this.invites.length > 0) {
            this.inviteCardExpanded = true;
          }
        } else {
          this.applyInviteSummary(null);
          this.invites = [];
        }
        this.inviteLoading = false;
        if (focus) {
          setTimeout(() => this.scrollToInvites(), 200);
        }
      },
      error: (error) => {
        this.inviteLoading = false;
        this.inviteError = error?.error?.error || 'No se pudo cargar las invitaciones.';
        this.inviteSummaryLoaded = true;
      }
    });
  }

  private scrollToInvites() {
    try {
      const element = document.getElementById('golden-invite-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch {}
  }

  remainingInvites(): number {
    const summary = this.inviteSummary;
    if (!summary) return 3;
    const quota = Number(summary.quota ?? 3);
    const counts = summary.counts;
    const active = Number(counts.issued ?? 0) + Number(counts.registered ?? 0);
    const verified = Number(counts.verified ?? 0);
    return Math.max(quota - (active + verified), 0);
  }

  onCreateInvite() {
    if (this.inviteSubmitting) return;
    if (!this.inviteEmail && !this.invitePhone) {
      this.inviteError = 'Ingresa correo o teléfono del colega que quieres invitar.';
      return;
    }

    this.inviteSubmitting = true;
    this.inviteError = null;
    this.inviteSuccessMessage = null;

    this.providerInvites.create({
      email: this.inviteEmail || undefined,
      phone: this.invitePhone || undefined,
      name: this.inviteName || undefined
    }).subscribe({
      next: (response) => {
        this.inviteSubmitting = false;
        if (response?.success) {
          this.inviteCardExpanded = true;
          this.inviteSuccessMessage = 'Invitación creada. Comparte el enlace para completar el proceso.';
          this.resetInviteForm();
          this.loadInviteData();
        }
      },
      error: (error) => {
        this.inviteSubmitting = false;
        const backendError = error?.error?.error;
        if (backendError === 'invite_quota_reached') {
          this.inviteError = 'Ya usaste tus invitaciones activas. Espera a que expiren o se verifiquen.';
        } else if (backendError === 'invitee_already_verified') {
          this.inviteError = 'Ese correo ya cuenta con una invitación verificada.';
        } else if (backendError === 'invite_daily_limit_reached') {
          this.inviteError = 'Has alcanzado el límite diario de invitaciones. Inténtalo mañana.';
        } else if (backendError === 'invitee_same_provider') {
          this.inviteError = 'No puedes invitarte a ti mismo.';
        } else {
          this.inviteError = backendError || 'No se pudo crear la invitación. Inténtalo nuevamente.';
        }
      }
    });
  }

  private resetInviteForm() {
    this.inviteEmail = '';
    this.invitePhone = '';
    this.inviteName = '';
  }

  async copyShareUrl(invite: ProviderInvite) {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(invite.share_url);
        this.inviteSuccessMessage = 'Enlace copiado al portapapeles.';
      } else {
        this.inviteError = 'No se pudo copiar el enlace automáticamente.';
      }
    } catch (error) {
      console.error('[DASH_HOME] Error copiando enlace:', error);
      this.inviteError = 'No se pudo copiar el enlace.';
    }
  }

  shareViaWhatsApp(invite: ProviderInvite) {
    const message = `Hola 👋, te comparto una Invitación Dorada para unirte a Adomi. Usa este enlace: ${invite.share_url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    }
  }

  getInviteStatusLabel(status: ProviderInvite['status']): string {
    switch (status) {
      case 'issued':
        return 'Enviada';
      case 'registered':
        return 'En proceso';
      case 'verified':
        return 'Verificada';
      case 'expired':
        return 'Expirada';
      case 'revoked':
        return 'Revocada';
      default:
        return status;
    }
  }

  getInviteStatusClass(status: ProviderInvite['status']): string {
    switch (status) {
      case 'verified':
        return 'status-chip--success';
      case 'registered':
        return 'status-chip--pending';
      case 'expired':
      case 'revoked':
        return 'status-chip--warning';
      default:
        return 'status-chip--default';
    }
  }

  trackInvite = (_index: number, invite: ProviderInvite) => invite.id;

  toggleInviteCard() {
    this.inviteCardExpanded = !this.inviteCardExpanded;
    if (this.inviteCardExpanded && !this.inviteSummary) {
      this.loadInviteData();
    }
  }

  private applyInviteSummary(summary: ProviderInviteSummary | null) {
    this.inviteSummary = summary;
    this.inviteSummaryLoaded = true;
  }
}
