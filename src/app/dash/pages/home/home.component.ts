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
import { AppointmentsService, ProviderPaymentPipelineSummary } from '../../../services/appointments.service';
import { PaymentsService, ProviderEarningsSummary } from '../../../services/payments.service';
import { TbkOnboardingService, TbkOnboardingState } from '../../../services/tbk-onboarding.service';
import { ProviderInviteService, ProviderInvite, ProviderInviteSummary } from '../../../services/provider-invite.service';
import { ProviderAvailabilityService } from '../../../services/provider-availability.service';
import { Subscription } from 'rxjs';
import { SessionService } from '../../../auth/services/session.service';
import { environment } from '../../../../environments/environment';

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
  private session = inject(SessionService);
  private providerProfile = inject(ProviderProfileService);
  private appointmentsService = inject(AppointmentsService);
  private paymentsService = inject(PaymentsService);
  private tbkOnboarding = inject(TbkOnboardingService);
  private providerInvites = inject(ProviderInviteService);
  private availabilityService = inject(ProviderAvailabilityService);
  private route = inject(ActivatedRoute);
  private providerRatingAverage: number | null = null;
  private readonly debug = !environment.production;
  private readonly clpFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  constructor(private router: Router) {}
  
  // Estado online/offline
  isOnline: boolean = true;
  showTbkUrgentBanner = false;
  tbkState: TbkOnboardingState | null = null;
  private tbkStateSub?: Subscription;
  showAvailabilityAlert = false;
  availabilityBlocksCount = 0;

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
  pioneerUnlockedAt: string | null = null;
  readonly pioneerTooltip =
    'Beneficios Pionero: prioridad en resultados de búsqueda, insignia destacada para clientes y acceso a invitaciones extra cuando tus colegas se verifican.';
  showAnalyticsUpgradeCta = false;

  // Datos para el header
  headerData: HeaderData = {
    userName: 'Usuario',
    hasNotifications: true
  };

  // Citas pagadas (próximas) - para que el proveedor vea de inmediato cuál va primero
  paidUpcomingLoading = false;
  paidUpcomingError: string | null = null;
  paidUpcoming: Array<{
    id: string;
    clientName: string;
    clientAvatar: string;
    service: string;
    when: string;
    time: string;
    date: string;
    estimatedIncome: number;
    location?: string;
  }> = [];

  ngOnInit() {
    this.loadProviderName();
    this.loadPendingRequests();
    this.loadPaidUpcoming();
    this.loadNextAppointment();
    this.loadEarningsData();
    this.loadPaymentPipelineSummary();
    this.initializeTbkBanner();
    this.checkAvailabilitySetup();
    this.loadInviteData();
    this.evaluateAnalyticsUpgradeCta();

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
    if (this.debug) console.log('[DASH_HOME] Cargando nombre del provider...');
    
    // Primero intentar desde el AuthService (localStorage)
    const currentUser = this.auth.getCurrentUser();
    if (currentUser && currentUser.name) {
      this.headerData = {
        ...this.headerData,
        userName: currentUser.name
      };
      if (this.debug) console.log('[DASH_HOME] Nombre desde caché:', currentUser.name);
    }
    
    // Luego obtener desde el backend (datos frescos)
    this.providerProfile.getProfile().subscribe({
      next: (profile) => {
        if (this.debug) console.log('[DASH_HOME] Perfil obtenido:', profile);
        if (profile) {
          const name = profile.full_name || 'Usuario';
          this.headerData = {
            ...this.headerData,
            userName: name
          };
          if (this.debug) console.log('[DASH_HOME] Nombre actualizado desde backend:', name);
          this.applyProviderRating(profile.rating_average);
        }
      },
      error: (error) => {
        if (this.debug) console.error('[DASH_HOME] Error obteniendo perfil:', error);
        // Fallback con getCurrentUserInfo si falla el endpoint de perfil
        this.auth.getCurrentUserInfo().subscribe({
          next: (res) => {
            const user = (res as any).data?.user || (res as any).user || res.user;
            if (user && user.name) {
              this.headerData = {
                ...this.headerData,
                userName: user.name
              };
              if (this.debug) console.log('[DASH_HOME] Nombre desde fallback:', user.name);
            }
          },
          error: (err) => {
            if (this.debug) console.error('[DASH_HOME] Error en fallback:', err);
          }
        });
      }
    });
  }

  private applyProviderRating(value?: string | number | null) {
    if (value === null || value === undefined) return;
    const parsed =
      typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(',', '.'));
    if (!Number.isFinite(parsed)) return;
    const rounded = Math.round(parsed * 10) / 10;
    this.providerRatingAverage = rounded;
    this.ingresosData = {
      ...this.ingresosData,
      averageRating: rounded
    };
    this.ingresosDiaData = {
      ...this.ingresosDiaData,
      averageRating: rounded
    };
  }

  private loadPendingRequests() {
    if (this.debug) console.log('[DASH_HOME] 🎯 Cargando solicitudes pendientes (citas confirmadas sin pagar)...');
    this.appointmentsService.listPendingRequests().subscribe({
      next: (response) => {
        if (this.debug) console.log('[DASH_HOME] 📦 Respuesta completa de solicitudes pendientes:', response);
        const raw = (response && response.success && Array.isArray((response as any).appointments))
          ? (response as any).appointments
          : [];

        // Filtro defensivo: nunca mostrar solicitudes con fecha/hora pasada
        const now = new Date();
        const upcoming = raw.filter((appt: any) => {
          const dateStr = String(appt?.date || '').slice(0, 10);
          const timeStr = String(appt?.start_time || '').slice(0, 5); // HH:mm
          if (!dateStr || dateStr.length !== 10 || !timeStr) return false;
          const dt = new Date(`${dateStr}T${timeStr}:00`);
          if (Number.isNaN(dt.getTime())) return false;
          return dt >= now;
        });

        if (upcoming.length > 0) {
          if (this.debug) console.log('[DASH_HOME] 📋 Citas confirmadas sin pagar encontradas (filtradas):', upcoming.length);
          this.solicitudesData = upcoming.map((appt: any) => {
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
            if (this.debug) console.log('[DASH_HOME] 🔄 Mapeando cita:', appt.id, '->', solicitud);
            return solicitud;
          });
          if (this.debug) console.log('[DASH_HOME] ✅ Solicitudes mapeadas exitosamente:', this.solicitudesData);
        } else {
          this.solicitudesData = [];
          if (this.debug) console.log('[DASH_HOME] ⚠️ No hay solicitudes pendientes - response:', response);
        }
      },
      error: (error) => {
        if (this.debug) {
          console.error('[DASH_HOME] ❌ Error cargando solicitudes pendientes:', error);
          console.error('[DASH_HOME] ❌ Error details:', error.status, error.statusText, error.url);
        }
        this.solicitudesData = [];
      }
    });
  }

  private loadPaidUpcoming() {
    this.paidUpcomingLoading = true;
    this.paidUpcomingError = null;
    this.paidUpcoming = [];

    this.appointmentsService.listPaidAppointments().subscribe({
      next: (resp: any) => {
        this.paidUpcomingLoading = false;
        const rows = resp?.success && Array.isArray(resp?.appointments) ? resp.appointments : [];
        const now = new Date();

        // Solo futuras (o hoy, hora >= ahora) y con pago completado
        const upcomingPaid = rows
          .filter((a: any) => {
            const dateStr = String(a?.date || '').slice(0, 10);
            const timeStr = String(a?.start_time || '').slice(0, 5);
            const payStatus = String(a?.payment_status || '').toLowerCase();
            const isPaid = payStatus === 'completed' || payStatus === 'paid' || payStatus === 'succeeded';
            if (!dateStr || !timeStr || !isPaid) return false;
            const dt = new Date(`${dateStr}T${timeStr}:00`);
            if (Number.isNaN(dt.getTime())) return false;
            return dt >= now;
          })
          .sort((a: any, b: any) => {
            const adt = new Date(`${String(a.date).slice(0, 10)}T${String(a.start_time).slice(0, 5)}:00`).getTime();
            const bdt = new Date(`${String(b.date).slice(0, 10)}T${String(b.start_time).slice(0, 5)}:00`).getTime();
            return adt - bdt;
          })
          .slice(0, 5);

        this.paidUpcoming = upcomingPaid.map((appt: any) => ({
          id: String(appt.id),
          clientName: appt.client_name || 'Cliente',
          clientAvatar: this.getAvatarUrl(appt.client_avatar_url, appt.client_name),
          service: appt.service_name || 'Servicio',
          when: this.formatWhen(appt.date),
          time: this.formatTime(appt.start_time),
          date: String(appt.date || '').slice(0, 10),
          estimatedIncome: appt.scheduled_price || appt.price || appt.amount || 0,
          location: appt.client_location_label || appt.client_location || 'Dirección por confirmar'
        }));
      },
      error: (err: any) => {
        this.paidUpcomingLoading = false;
        this.paidUpcomingError = err?.error?.error || 'No se pudieron cargar tus citas pagadas.';
        this.paidUpcoming = [];
      }
    });
  }

  goToAgenda(): void {
    this.router.navigate(['/dash/agenda']);
  }

  private loadNextAppointment() {
    if (this.debug) console.log('[DASH_HOME] 🎯 Cargando próxima cita confirmada...');
    this.appointmentsService.getNextAppointment().subscribe({
      next: (response) => {
        if (this.debug) console.log('[DASH_HOME] 📦 Respuesta completa de próxima cita:', response);
        if (response.success && response.appointment) {
          const appt = response.appointment;
          if (this.debug) console.log('[DASH_HOME] 📅 Datos de la próxima cita:', appt);
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
          if (this.debug) console.log('[DASH_HOME] ✅ Próxima cita mapeada exitosamente:', this.proximaCitaData);
        } else {
          this.proximaCitaData = null;
          if (this.debug) console.log('[DASH_HOME] ⚠️ No hay próxima cita - response:', response);
        }
      },
      error: (error) => {
        if (this.debug) {
          console.error('[DASH_HOME] ❌ Error cargando próxima cita:', error);
          console.error('[DASH_HOME] ❌ Error details:', error.status, error.statusText, error.url);
        }
        this.proximaCitaData = null;
      }
    });
  }

  private loadEarningsData() {
    if (this.debug) console.log('[DASH_HOME] Cargando datos de ingresos...');
    const today = new Date();
    const monthParam = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const dayParam = `${monthParam}-${String(today.getDate()).padStart(2, '0')}`;

    this.paymentsService.getProviderEarningsSummary({ month: monthParam }).subscribe({
      next: (response) => {
        if (this.debug) console.log('[DASH_HOME] Ingresos del mes recibidos:', response);
        if (response.success && response.summary) {
          this.ingresosData = this.buildMonthlyEarnings(response.summary);
          if (this.debug) console.log('[DASH_HOME] Ingresos del mes mapeados:', this.ingresosData);
        }
      },
      error: (error) => {
        if (this.debug) console.error('[DASH_HOME] Error cargando ingresos del mes:', error);
        this.ingresosData = this.buildFallbackEarnings(this.ingresosData);
      }
    });

    this.paymentsService.getProviderEarningsSummary({ day: dayParam }).subscribe({
      next: (response) => {
        if (this.debug) console.log('[DASH_HOME] Ingresos del día recibidos:', response);
        if (response.success && response.summary) {
          this.ingresosDiaData = this.buildDailyEarnings(response.summary);
          if (this.debug) console.log('[DASH_HOME] Ingresos del día mapeados:', this.ingresosDiaData);
        }
      },
      error: (error) => {
        if (this.debug) console.error('[DASH_HOME] Error cargando ingresos del día:', error);
        this.ingresosDiaData = this.buildFallbackEarnings(this.ingresosDiaData);
      }
    });
  }

  private buildMonthlyEarnings(summary: ProviderEarningsSummary): IngresosData {
    const chart = this.mapSummaryToChart(summary);
    return {
      amount: this.formatCurrencyCLP(summary.releasable || 0),
      completedAppointments: summary.paidCount || 0,
      averageRating: this.providerRatingAverage ?? this.ingresosData.averageRating,
      chartData: chart.values,
      chartLabels: chart.labels
    };
  }

  private loadPaymentPipelineSummary() {
    this.appointmentsService.getPaymentPipelineSummary().subscribe({
      next: (resp) => {
        if (!resp?.success || !resp.summary) {
          this.releaseSummary = {
            pending: this.formatCurrencyCLP(0),
            releasable: this.formatCurrencyCLP(0),
            released: this.formatCurrencyCLP(0)
          };
          return;
        }
        this.applyPaymentPipelineSummary(resp.summary);
      },
      error: (err) => {
        console.error('[DASH_HOME] Error cargando payment pipeline summary:', err);
        this.releaseSummary = {
          pending: this.formatCurrencyCLP(0),
          releasable: this.formatCurrencyCLP(0),
          released: this.formatCurrencyCLP(0)
        };
      }
    });
  }

  private applyPaymentPipelineSummary(summary: ProviderPaymentPipelineSummary) {
    // UI (mantener estructura existente `releaseSummary` para no rearmar layout)
    this.releaseSummary = {
      // Pendiente de pago
      pending: this.formatCurrencyCLP(summary.pending_unpaid_amount || 0),
      // Pagadas (por atender)
      releasable: this.formatCurrencyCLP(summary.paid_upcoming_amount || 0),
      // Pagadas este mes
      released: this.formatCurrencyCLP(summary.paid_month_amount || 0)
    };
  }

  private buildDailyEarnings(summary: ProviderEarningsSummary): IngresosDiaData {
    const chart = this.mapSummaryToChart(summary);
    const seriesTotal = (summary.series || []).reduce((acc, p: any) => acc + Number(p.total || 0), 0);
    const chosenAmount = (summary.releasable || 0) > 0 ? summary.releasable : seriesTotal;
    const dateLabel = summary.day
      ? this.formatDateLong(summary.day)
      : this.formatDateLong(new Date().toISOString().slice(0, 10));
    return {
      amount: this.formatCurrencyCLP(chosenAmount),
      completedAppointments: summary.paidCount || 0,
      averageRating: this.providerRatingAverage ?? this.ingresosDiaData.averageRating,
      chartData: chart.values,
      chartLabels: chart.labels,
      dateLabel
    };
  }

  private mapSummaryToChart(summary: ProviderEarningsSummary): { labels: string[]; values: number[] } {
    const entries = summary.series || [];
    if (!entries.length) {
      return { labels: [], values: [] };
    }
    if (summary.scope === 'day') {
      return {
        labels: entries.map((point) => point.bucket),
        values: entries.map((point) => point.total)
      };
    }
    return {
      labels: entries.map((point) => this.formatChartDayLabel(point.bucket)),
      values: entries.map((point) => point.total)
    };
  }

  private formatChartDayLabel(bucket: string): string {
    const date = new Date(bucket);
    if (Number.isNaN(date.getTime())) {
      return bucket;
    }
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  }

  private formatCurrencyCLP(value: number): string {
    return this.clpFormatter.format(Math.max(0, Math.round(Number(value) || 0)));
  }

  private formatDateLong(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private buildFallbackEarnings<T extends IngresosData | IngresosDiaData>(current: T): T {
    return {
      ...current,
      amount: this.formatCurrencyCLP(0),
      completedAppointments: 0,
      chartData: [],
      chartLabels: []
    };
  }

  private checkAvailabilitySetup() {
    if (this.debug) console.log('[DASH_HOME] Verificando configuración de disponibilidad...');

    this.availabilityService.getWeekly().subscribe({
      next: (response) => {
        const activeBlocks = (response?.blocks || []).filter(block => block.is_active);
        this.availabilityBlocksCount = activeBlocks.length;
        this.showAvailabilityAlert = activeBlocks.length === 0;
        if (this.debug) console.log('[DASH_HOME] Bloques activos:', this.availabilityBlocksCount);
      },
      error: (error) => {
        if (this.debug) console.error('[DASH_HOME] Error obteniendo disponibilidad semanal:', error);
        this.showAvailabilityAlert = false;
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
    amount: '$0',
    completedAppointments: 0,
    averageRating: 4.9,
    chartData: [],
    chartLabels: []
  };

  // Datos para ingresos del día
  ingresosDiaData: IngresosDiaData = {
    amount: '$0',
    completedAppointments: 0,
    averageRating: 4.8,
    chartData: [],
    chartLabels: []
  };

  releaseSummary = {
    pending: '$0',
    releasable: '$0',
    released: '$0'
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
  onNotificationClick(notification: any) {
    if (this.debug) console.log('Notificación clickeada', notification);
    // TODO: Implementar lógica de notificaciones en home si se requiere
  }

  onPublicProfileClick() {
    if (this.debug) console.log('Ver perfil público');
    // Navegar al perfil del trabajador y activar el tab "Ver Perfil Público"
    this.router.navigate(['/dash/perfil'], {
      queryParams: { tab: 'ver-perfil-publico' }
    });
  }


  onViewDetailsClick(data: ProximaCitaData) {
    if (this.debug) console.log('Ver detalles de cita:', data);
    // El modal se maneja automáticamente en el componente
  }

  onCitaAction(result: CitaDetalleResult) {
    if (this.debug) console.log('Acción en cita:', result);
    switch (result.action) {
      case 'contact':
        if (this.debug) console.log('Contactar cliente:', result.data);
        // TODO: Implementar lógica de contacto (chat, llamada, etc.)
        break;
      case 'reschedule':
        if (this.debug) console.log('Reprogramar cita:', result.data);
        // TODO: Implementar lógica de reprogramación
        break;
    }
  }

  onCitaCancel(result: CancelCitaResult) {
    if (this.debug) console.log('Cancelar cita:', result);
    // TODO: Implementar lógica de API para cancelar cita
    // TODO: Mostrar toast de confirmación
    // TODO: Actualizar lista de citas
  }

  onViewReportClick(data: IngresosData) {
    if (this.debug) console.log('Ver reporte completo:', data);
    // TODO: Navegar al reporte completo
  }

  onViewDayReportClick(data: IngresosDiaData) {
    if (this.debug) console.log('Ver reporte del día:', data);
    // TODO: Navegar al reporte del día
  }

  onNavigateToReport(navigationData: {period: string, type: string}) {
    if (this.debug) console.log('Navegando a reporte:', navigationData);
    
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
    if (this.debug) console.log('Aceptar solicitud:', data);
    // Los modales se manejan automáticamente en el componente
  }

  onDeclineClick(data: SolicitudData) {
    if (this.debug) console.log('Rechazar solicitud:', data);
    // Los modales se manejan automáticamente en el componente
  }

  onReservaAccepted(result: AcceptReservaResult) {
    if (this.debug) console.log('Reserva aceptada:', result);
    // TODO: Implementar lógica de API para aceptar reserva
    // TODO: Mostrar toast de éxito
    // TODO: Actualizar lista de solicitudes
  }

  onReservaRejected(result: RejectReservaResult) {
    if (this.debug) console.log('Reserva rechazada:', result);
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
    if (this.debug) console.log('Bloque de tiempo agregado:', newBlock);
  }

  onRemoveTimeBlock(blockId: string) {
    this.gestionData.timeBlocks = this.gestionData.timeBlocks.filter((block) => block.id !== blockId);
    if (this.debug) console.log('Bloque de tiempo eliminado:', blockId);
  }

  private initializeTbkBanner(): void {
    if (!this.tbkStateSub) {
      this.tbkStateSub = this.tbkOnboarding.state$.subscribe((state) => {
        this.tbkState = state;
        this.showTbkUrgentBanner = state?.status === 'none';
      });
    }

    void this.tbkOnboarding.refreshStatus().catch((error) => {
      if (this.debug) console.warn('[DASH_HOME] No se pudo refrescar el estado TBK:', error);
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
          const attempted = !!(response as any)?.email?.attempted;
          const sent = !!(response as any)?.email?.sent;
          if (attempted && sent) {
            this.inviteSuccessMessage = 'Invitación enviada por correo. También puedes compartir el enlace.';
          } else if (attempted && !sent) {
            this.inviteError = 'La invitación se creó, pero no se pudo enviar el correo. Copia el enlace y compártelo por WhatsApp.';
            this.inviteSuccessMessage = null;
          } else {
            this.inviteSuccessMessage = 'Invitación creada. Copia el enlace y compártelo con tu colega.';
          }
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
    this.pioneerUnlockedAt = summary?.pioneer_unlocked_at ?? null;
  }

  get isPioneerUnlocked(): boolean {
    return !!this.pioneerUnlockedAt;
  }

  get pioneerUnlockedLabel(): string | null {
    if (!this.pioneerUnlockedAt) return null;
    try {
      return new Date(this.pioneerUnlockedAt).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  }
  goToAvailabilitySettings() {
    this.router.navigate(['/dash/agenda'], { queryParams: { view: 'config' } });
  }

  goToAnalyticsUpgrade() {
    this.router.navigate(['/auth/select-plan'], {
      queryParams: { source: 'analytics-upgrade' }
    });
  }

  private evaluateAnalyticsUpgradeCta() {
    this.showAnalyticsUpgradeCta = this.session.getSubscriptionStatus() === 'founder';
  }
}
