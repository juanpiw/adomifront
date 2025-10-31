import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardResumenComponent, DashboardMetric } from '../../../../libs/shared-ui/dashboard-resumen/dashboard-resumen.component';
import { CalendarMensualComponent, CalendarEvent } from '../../../../libs/shared-ui/calendar-mensual/calendar-mensual.component';
import { DayDetailComponent, DayAppointment } from '../../../../libs/shared-ui/day-detail/day-detail.component';
import { DashboardGraficoComponent } from '../../../../libs/shared-ui/dashboard-grafico/dashboard-grafico.component';
import { ModalVerificarServicioComponent } from '../../../../libs/shared-ui/modal-verificar-servicio/modal-verificar-servicio.component';
import { HorariosConfigComponent, TimeBlock } from '../../../../libs/shared-ui/horarios-config/horarios-config.component';
import { ProviderAvailabilityService } from '../../../services/provider-availability.service';
import { AppointmentsService, AppointmentDto } from '../../../services/appointments.service';
import { PaymentsService } from '../../../services/payments.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../../libs/shared-ui/notifications/services/notification.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


@Component({
  selector: 'app-d-agenda',
  standalone: true,
  imports: [
    CommonModule,
    DashboardResumenComponent,
    CalendarMensualComponent,
    DayDetailComponent,
    DashboardGraficoComponent,
    HorariosConfigComponent,
    ModalVerificarServicioComponent
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class DashAgendaComponent implements OnInit {
  // Datos del dashboard
  dashboardMetrics: DashboardMetric[] = [
    {
      label: 'Citas Pendientes',
      value: 42,
      meta: 'Próximos 7 días'
    },
    {
      label: 'Citas por Pagar (esperan código)',
      value: 0,
      meta: 'Pagadas por clientes',
      onClick: () => this.togglePaidAwaitingPanel()
    },
    {
      label: 'Ingresos (Mes)',
      value: '$12.5k',
      meta: 'Meta: $15k'
    },
    {
      label: 'Nuevos Clientes',
      value: 18,
      meta: 'Este mes'
    },
    {
      label: 'Citas pagadas en efectivo',
      value: 0,
      meta: 'Últimos 7 días'
    },
    {
      label: 'Deuda a la aplicación',
      value: '$0',
      meta: 'Comisiones cash pendientes'
    },
    {
      label: 'Tasa de Ocupación',
      value: '85%',
      meta: 'Semana actual'
    }
  ];

  // Datos del calendario
  calendarEvents: CalendarEvent[] = [];

  // Datos del día seleccionado
  selectedDate: Date | null = null;
  dayAppointments: DayAppointment[] = [];

  // Datos de configuración de horarios
  timeBlocks: TimeBlock[] = [
    {
      id: '1',
      day: 'Lunes',
      startTime: '09:00',
      endTime: '18:00',
      enabled: true
    },
    {
      id: '2',
      day: 'Martes',
      startTime: '09:00',
      endTime: '18:00',
      enabled: true
    },
    {
      id: '3',
      day: 'Miércoles',
      startTime: '09:00',
      endTime: '18:00',
      enabled: true
    },
    {
      id: '4',
      day: 'Jueves',
      startTime: '09:00',
      endTime: '18:00',
      enabled: true
    },
    {
      id: '5',
      day: 'Viernes',
      startTime: '09:00',
      endTime: '18:00',
      enabled: true
    },
    {
      id: '6',
      day: 'Sábado',
      startTime: '10:00',
      endTime: '16:00',
      enabled: true
    }
  ];

  // Estados
  loading = false;
  currentView: 'dashboard' | 'calendar' | 'cash' | 'config' = 'dashboard';
  showPaidAwaitingPanel: boolean = false;
  paidAwaitingAppointments: Array<{ id: number; client_name?: string; service_name?: string; date: string; start_time: string; amount?: number; payment_method?: string }>=[];
  // Estado modal verificación
  isVerificationModalOpen: boolean = false;
  selectedPaidAppointment: { id: number; client_name?: string; service_name?: string; date: string; start_time: string; amount?: number; payment_method?: string } | null = null;
  verificationError: string = '';
  remainingAttempts: number = 3;
  verifying: boolean = false;
  
  // 🔔 Contador de citas programadas (scheduled) pendientes de confirmar
  scheduledAppointmentsCount: number = 0;

  // Cash backend data
  cashDebts: Array<{ time: string; client: string; date: string; commission: number; dueDate: string; status: 'pending'|'overdue'|'paid' }>= [];
  cashTotal = 0;
  cashOverdueTotal = 0;
  cashSummaryLoading = false;
  cashLoading = false;
  cashTableFilter: 'all'|'pending'|'overdue'|'paid' = 'pending';
  cashSummary: {
    total_due: number;
    overdue_due: number;
    pending_count: number;
    overdue_count: number;
    paid_count: number;
    last_debt: {
      id: number;
      commission_amount: number;
      currency: string;
      status: string | null;
      due_date: string | null;
      created_at: string | null;
    } | null;
  } | null = null;

  private appointments = inject(AppointmentsService);
  private payments = inject(PaymentsService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private updatingFromQuery = false;

  private currentProviderId: number | null = null;

  // Datos del gráfico
  chartData: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension: number; }[] } | null = null;

  constructor(private availabilityService: ProviderAvailabilityService) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const viewParam = (params.get('view') || '').toLowerCase();
      if (['dashboard', 'calendar', 'cash', 'config'].includes(viewParam)) {
        this.updatingFromQuery = true;
        this.setView(viewParam as 'dashboard' | 'calendar' | 'cash' | 'config');
        this.updatingFromQuery = false;
      }
    });

    this.loadDashboardData();
    this.refreshEarnings();
    this.loadPaidAwaiting();
    // Cargar mes actual
    const today = new Date();
    // Preseleccionar el día de hoy para mostrar citas sin click
    this.selectedDate = today;
    this.loadMonth(today.getFullYear(), today.getMonth() + 1);
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.loadDay(iso);
    // Cargar datos para el gráfico (últimos 7 días)
    this.loadChartDataLast7Days();
    // Realtime updates (join provider user room)
    this.currentProviderId = this.auth.getCurrentUser()?.id || null;
    if (this.currentProviderId) {
      this.appointments.connectSocket(this.currentProviderId);
    }
    // Escuchar pagos completados para refrescar vista y panel de pagadas
    this.appointments.onPaymentCompleted().subscribe((p: { appointment_id: number; amount?: number }) => {
      console.log('💰 [AGENDA] Pago completado recibido por socket:', p);
      // Refrescar lista de pagadas esperando verificación
      this.loadPaidAwaiting();
      // Refrescar día seleccionado para que muestre "Pagada"
        if (this.selectedDate) {
          const iso = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
          console.log('💰 [AGENDA] Refrescando citas del día por pago:', iso);
        this.loadDay(iso);
      }
    });
    this.appointments.onAppointmentCreated().subscribe((a: AppointmentDto) => {
      this.onRealtimeUpsert(a);
      try {
        const title = 'Nueva cita por confirmar';
        const who = (a as any).client_name ? ` de ${(a as any).client_name}` : '';
        const locationLabel = ((a as any).client_location_label || (a as any).client_location) as string | undefined;
        const msg = `Tienes una nueva cita${who} el ${a.date} a las ${a.start_time.slice(0,5)}` + (locationLabel ? ` • 📍 ${locationLabel}` : '');
        this.notifications.setUserProfile('provider');
        this.notifications.createNotification({
          type: 'appointment',
          profile: 'provider',
          title,
          message: msg,
          priority: 'high',
          actions: ['view'],
          metadata: { appointmentId: String(a.id), clientName: (a as any).client_name, location: locationLabel || null }
        });
      } catch {}
    });
    this.appointments.onAppointmentUpdated().subscribe((a: AppointmentDto) => this.onRealtimeUpsert(a));
    this.appointments.onAppointmentDeleted().subscribe((p: { id: number }) => this.onRealtimeDelete(p.id));

    // Inicializar pestaña cash
    this.loadCashSummary();
    this.loadCashCommissions(this.cashTableFilter);
  }

  // Cargar citas del mes
  private loadMonth(year: number, month: number) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    this.loading = true;
    this.appointments.listByMonth(monthStr).subscribe({
      next: (resp: { success: boolean; appointments: AppointmentDto[] }) => {
        const apps = (resp.appointments || []) as AppointmentDto[];
        this.calendarEvents = apps.map(a => this.mapAppointmentToEvent(a));
        // Contador de programadas
        this.updateScheduledCount();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // Cargar citas del día (YYYY-MM-DD)
  private loadDay(dateIso: string) {
    this.loading = true;
    this.appointments.listByDay(dateIso).subscribe({
      next: (resp: { success: boolean; appointments: (AppointmentDto & { client_name?: string })[] }) => {
        const apps = (resp.appointments || []) as (AppointmentDto & { client_name?: string })[];
        this.dayAppointments = apps.map(a => this.mapAppointmentToDay(a as any));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  private loadCashSummary() {
    this.cashSummaryLoading = true;
    console.log('[TRACE][AGENDA] loadCashSummary start');
    this.payments.refreshCashSummary().subscribe({
      next: (res) => {
        console.log('[TRACE][AGENDA] loadCashSummary response', res);
        if (res?.success && res.summary) {
          this.cashTotal = Number(res.summary.total_due || 0);
          this.cashOverdueTotal = Number(res.summary.overdue_due || 0);
          this.cashSummary = {
            total_due: this.cashTotal,
            overdue_due: this.cashOverdueTotal,
            pending_count: Number(res.summary.pending_count || 0),
            overdue_count: Number(res.summary.overdue_count || 0),
            paid_count: Number(res.summary.paid_count || 0),
            last_debt: res.summary.last_debt || null
          };
          console.log('[TRACE][AGENDA] loadCashSummary parsed', this.cashSummary);
          const debtIdx = this.dashboardMetrics.findIndex(m => m.label === 'Deuda a la aplicación');
          if (debtIdx >= 0) this.dashboardMetrics[debtIdx] = { ...this.dashboardMetrics[debtIdx], value: `$${this.cashTotal.toLocaleString('es-CL')}` } as any;
          const cashIdx = this.dashboardMetrics.findIndex(m => m.label === 'Citas pagadas en efectivo');
          if (cashIdx >= 0) this.dashboardMetrics[cashIdx] = { ...this.dashboardMetrics[cashIdx], value: this.cashTotal > 0 ? 1 : 0 } as any;
        } else {
          this.cashSummary = null;
        }
      },
      error: (err) => {
        console.error('[TRACE][AGENDA] loadCashSummary error', err);
        this.cashSummaryLoading = false;
      },
      complete: () => {
        this.cashSummaryLoading = false;
        console.log('[TRACE][AGENDA] loadCashSummary complete');
      }
    });
  }

  private loadCashCommissions(filter: 'all'|'pending'|'overdue'|'paid' = this.cashTableFilter) {
    this.cashLoading = true;
    this.cashTableFilter = filter;
    const params: any = {};
    if (filter && filter !== 'all') params.status = filter;
    this.http.get<any>(`${this.baseUrl}/provider/cash/commissions`, { headers: this.headers(), params }).subscribe({
      next: (res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        this.cashDebts = rows.map((r: any) => ({
          time: r.start_time ? String(r.start_time).slice(0,5) : '',
          client: r.client_name || '',
          date: r.date,
          commission: Number(r.commission_amount || 0),
          dueDate: r.due_date,
          status: r.status
        }));
      },
      error: () => { this.cashLoading = false; },
      complete: () => { this.cashLoading = false; }
    });
  }

  setCashFilter(filter: 'all'|'pending'|'overdue'|'paid') {
    if (this.cashTableFilter === filter && !this.cashLoading) {
      return;
    }
    this.loadCashCommissions(filter);
  }

  refreshCash() {
    this.loadCashSummary();
    this.loadCashCommissions(this.cashTableFilter);
  }

  private togglePaidAwaitingPanel() {
    this.showPaidAwaitingPanel = !this.showPaidAwaitingPanel;
    if (this.showPaidAwaitingPanel) {
      this.loadPaidAwaiting();
    }
  }

  private loadPaidAwaiting() {
    this.appointments.listPaidAppointments().subscribe({
      next: (resp: any) => {
        if (resp?.success) {
          this.paidAwaitingAppointments = (resp.appointments || []).map((a: any) => ({
            id: a.id,
            client_name: a.client_name,
            service_name: a.service_name,
            date: a.date,
            start_time: a.start_time,
            amount: a.amount,
            payment_method: a.payment_method
          }));
          const idx = this.dashboardMetrics.findIndex(m => m.label === 'Citas por Pagar (esperan código)');
          if (idx >= 0) this.dashboardMetrics[idx] = { ...this.dashboardMetrics[idx], value: this.paidAwaitingAppointments.length };
        }
      },
      error: () => {}
    });
  }

  private loadChartDataLast7Days() {
    try {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 6);

      const month = today.toISOString().slice(0, 7);
      this.appointments.listByMonth(month).subscribe({
        next: (resp) => {
          const seriesMap: Record<string, number> = {};
          for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            seriesMap[key] = 0;
          }
          const list = Array.isArray(resp.appointments) ? resp.appointments : [];
          list.forEach((a: any) => {
            const key = String(a.date || '').slice(0, 10);
            if (seriesMap[key] !== undefined) seriesMap[key] += 1;
          });
          const labels: string[] = [];
          const data: number[] = [];
          const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
          Object.keys(seriesMap).sort().forEach((k) => {
            const d = new Date(k + 'T00:00:00');
            labels.push(dayNames[d.getDay()]);
            data.push(seriesMap[k]);
          });
          this.chartData = {
            labels,
            datasets: [{
              label: 'Citas',
              data,
              borderColor: '#4338ca',
              backgroundColor: 'rgba(67, 56, 202, 0.1)',
              tension: 0.4
            }]
          };
        },
        error: () => { this.chartData = null; }
      });
    } catch {
      this.chartData = null;
    }
  }

  openVerifyModal(appt: { id: number; client_name?: string; service_name?: string; date: string; start_time: string; amount?: number; payment_method?: string }) {
    this.selectedPaidAppointment = appt;
    this.verificationError = '';
    this.remainingAttempts = 3;
    this.isVerificationModalOpen = true;
  }

  onVerificationCancel() {
    this.isVerificationModalOpen = false;
    this.selectedPaidAppointment = null;
    this.verificationError = '';
  }

  onVerificationSubmit(code: string) {
    if (!this.selectedPaidAppointment) return;
    this.verifying = true;
    this.verificationError = '';
    const appointmentId = this.selectedPaidAppointment.id;
    const isCash = String(this.selectedPaidAppointment.payment_method || '').toLowerCase() === 'cash';

    type VerificationResponse = {
      success: boolean;
      error?: string;
      remainingAttempts?: number;
      paymentId?: number | null;
    };

    const verification$: Observable<VerificationResponse> = isCash
      ? this.appointments.verifyCashCode(appointmentId, code).pipe(
          map(cashResp => {
            if (!cashResp?.success) {
              return { success: false, error: cashResp?.error || 'No se pudo registrar el pago en efectivo.' };
            }
            return { success: true, paymentId: cashResp.payment_id ?? null };
          }),
          catchError(err => of({ success: false, error: err?.error?.error || 'Error al registrar el pago en efectivo.' }))
        )
      : this.appointments.verifyCompletion(appointmentId, code).pipe(
          map(resp => ({
            success: !!resp?.success,
            error: resp?.error,
            remainingAttempts: (resp as any)?.remainingAttempts,
            paymentId: (resp as any)?.payment_id ?? null
          })),
          catchError(err => of({ success: false, error: err?.error?.error || 'Error al verificar.' }))
        );

    verification$.subscribe({
      next: (resp: any) => {
        this.verifying = false;
        if (resp?.success) {
          this.paidAwaitingAppointments = this.paidAwaitingAppointments.filter(p => p.id !== this.selectedPaidAppointment!.id);
          const idx = this.dashboardMetrics.findIndex(m => m.label === 'Citas por Pagar (esperan código)');
          if (idx >= 0) this.dashboardMetrics[idx] = { ...this.dashboardMetrics[idx], value: this.paidAwaitingAppointments.length };
          this.loadCashSummary();
          this.loadCashCommissions(this.cashTableFilter);
          this.refreshEarnings();
          if (this.selectedDate) {
            const iso = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
            this.loadDay(iso);
          }
          this.isVerificationModalOpen = false;
          this.selectedPaidAppointment = null;
          alert('✅ Servicio verificado. El pago será liberado próximamente.');
        } else {
          this.verificationError = resp?.error || 'Código incorrecto';
          this.remainingAttempts = typeof resp?.remainingAttempts === 'number' ? resp.remainingAttempts : this.remainingAttempts;
        }
      },
      error: () => {
        this.verifying = false;
        this.verificationError = 'Error al verificar. Intenta nuevamente.';
      }
    });
  }

  private loadDashboardData() {
    console.log('Cargando datos del dashboard...');
  }

  private refreshEarnings(month?: string) {
    try {
      (this.payments as any).getProviderEarningsSummary(month).subscribe({
        next: (resp: any) => {
          if (resp?.success && resp.summary) {
            const { releasable, pending, released } = resp.summary;
            // Actualiza la tarjeta "Ingresos (Mes)" con el monto liberable
            const idx = this.dashboardMetrics.findIndex(m => m.label === 'Ingresos (Mes)');
            if (idx >= 0) {
              this.dashboardMetrics[idx] = {
                ...this.dashboardMetrics[idx],
                value: `$${Number(releasable || 0).toLocaleString('es-CL')}`,
                meta: `Pendiente: $${Number(pending || 0).toLocaleString('es-CL')} · Liberado: $${Number(released || 0).toLocaleString('es-CL')}`
              } as any;
            }
            // Actualiza "Citas pagadas en efectivo" si backend expone métrica (fallback: 0)
            const cashIdx = this.dashboardMetrics.findIndex(m => m.label === 'Citas pagadas en efectivo');
            if (cashIdx >= 0) {
              const cashPaidCount = Number((resp.summary as any).cashPaidCount || 0);
              this.dashboardMetrics[cashIdx] = {
                ...this.dashboardMetrics[cashIdx],
                value: cashPaidCount
              } as any;
            }
        // Actualiza "Deuda a la aplicación" si backend expone métrica de comisiones cash (fallback: 0)
        const debtIdx = this.dashboardMetrics.findIndex(m => m.label === 'Deuda a la aplicación');
            if (debtIdx >= 0) {
              const cashDebt = Number((resp.summary as any).cashCommissionDebt || 0);
              this.dashboardMetrics[debtIdx] = {
                ...this.dashboardMetrics[debtIdx],
                value: `$${cashDebt.toLocaleString('es-CL')}`
              } as any;
            }
          }
        },
        error: (e: any) => {
          console.warn('[AGENDA] earnings summary error', e);
        }
      });
    } catch (err) {
      console.warn('[AGENDA] earnings summary exception', err);
    }
  }

  // Event handlers del calendario
  onDateSelected(date: Date) {
    this.selectedDate = date;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    this.loadDay(`${yyyy}-${mm}-${dd}`);
  }

  onNewAppointment() {
    console.log('Crear nueva cita');
    // El modal se abre desde DayDetail con el botón + del día
  }

  onPreviousMonth() {
    const base = this.selectedDate || new Date();
    const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    this.selectedDate = prev;
    this.loadMonth(prev.getFullYear(), prev.getMonth() + 1);
  }

  onNextMonth() {
    const base = this.selectedDate || new Date();
    const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    this.selectedDate = next;
    this.loadMonth(next.getFullYear(), next.getMonth() + 1);
  }

  // Event handlers del día
  onAppointmentClick(appointment: DayAppointment) {
    console.log('Cita seleccionada:', appointment);
    // TODO(siguiente iteración): Abrir modal para editar/cancelar
  }

  onConfirmAppointment(appointmentId: number) {
    const index = this.dayAppointments.findIndex(a => Number(a.id) === Number(appointmentId));
    const appointment = index >= 0 ? this.dayAppointments[index] : null;

    const performConfirmation = () => {
      const prev = index >= 0 ? { ...this.dayAppointments[index] } : null;
      if (index >= 0) {
        this.dayAppointments[index] = { ...this.dayAppointments[index], status: 'confirmed' as any };
      }

      this.appointments.updateStatus(appointmentId, 'confirmed' as any).subscribe({
        next: (resp) => {
          if (resp?.success && (resp as any).appointment) {
            this.onRealtimeUpsert((resp as any).appointment);
          } else if (prev && index >= 0) {
            this.dayAppointments[index] = prev;
          }
        },
        error: (err) => {
          console.error('Error confirmando cita', err);
          if (prev && index >= 0) this.dayAppointments[index] = prev;
        }
      });
    };

    if (appointment) {
      const hasLocation = Boolean((appointment.locationLabel || '').trim().length);
      if (!hasLocation) {
        const next = prompt('Antes de confirmar, ingresa la dirección donde realizarás esta cita:', appointment.clientAddress || '');
        if (next === null) {
          return;
        }
        const trimmed = next.trim();
        if (!trimmed.length) {
          alert('Debes ingresar una dirección para confirmar la cita.');
          return;
        }

        this.appointments.updateLocation(appointmentId, trimmed).subscribe({
          next: (resp) => {
            if (!resp?.success || !(resp as any).appointment) {
              alert('No se pudo actualizar la dirección de la cita.');
              return;
            }
            const updated = (resp as any).appointment as AppointmentDto;
            this.onRealtimeUpsert(updated);
            if (index >= 0) {
              this.dayAppointments[index] = {
                ...this.dayAppointments[index],
                locationLabel: (updated as any).client_location_label || (updated as any).client_location || trimmed,
                clientAddress: (updated as any).client_address ?? null,
                clientCommune: (updated as any).client_commune ?? null,
                clientRegion: (updated as any).client_region ?? null
              };
            }
            performConfirmation();
          },
          error: (err) => {
            console.error('Error actualizando dirección antes de confirmar', err);
            alert(err?.error?.error || 'No se pudo actualizar la dirección de la cita.');
          }
        });
        return;
      }
    }

    performConfirmation();
  }

  onNewAppointmentForDay(date: Date) {
    console.log('Nueva cita para:', date);
    // El modal se maneja dentro de DayDetail; aquí solo respondemos al evento de creación
  }

  onEspacioBloqueado(evt: { date: string; startTime?: string; endTime?: string; reason: string; blockWholeDay: boolean }) {
    // Delega al handler ya implementado en la misma clase para crear excepción
    this.onEspacioBloqueadoInternal(evt);
  }

  private onEspacioBloqueadoInternal(evt: { date: string; startTime?: string; endTime?: string; reason: string; blockWholeDay: boolean }) {
    // Reutilizar el flujo ya implementado (ver onEspacioBloqueado existente si lo hubiera)
    this.loading = true;
    this.availabilityService.createException(
      evt.date,
      false,
      evt.startTime,
      evt.endTime,
      evt.reason
    ).subscribe({
      next: () => {
        this.loading = false;
        if (this.selectedDate) {
          const y = this.selectedDate.getFullYear();
          const m = this.selectedDate.getMonth() + 1;
          this.loadMonth(y, m);
        }
      },
      error: () => { this.loading = false; }
    });
  }

  onDeleteAppointment(id: number) {
    // Cambiar a cancelación de cita (no borrado definitivo)
    const idx = this.dayAppointments.findIndex(a => Number(a.id) === Number(id));
    const prev = idx >= 0 ? { ...this.dayAppointments[idx] } : null;
    if (idx >= 0) {
      this.dayAppointments[idx] = { ...this.dayAppointments[idx], status: 'cancelled' as any };
    }

    this.appointments.updateStatus(id, 'cancelled' as any, { reason: 'Cancelado por proveedor desde agenda' }).subscribe({
      next: (resp) => {
        if (resp?.success && (resp as any).appointment) {
          this.onRealtimeUpsert((resp as any).appointment);
        } else if (prev && idx >= 0) {
          this.dayAppointments[idx] = prev;
        }
      },
      error: (err) => {
        console.error('Error cancelando cita:', err);
        if (prev && idx >= 0) this.dayAppointments[idx] = prev;
      }
    });
  }

  onCobrarEnEfectivo(id: string) {
    const apptId = Number(id);
    if (!apptId) return;
    if (!confirm('¿Confirmas registrar el cobro en efectivo de esta cita?')) return;
    this.loading = true;
    this.payments.collectCash(apptId).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp?.success) {
          if (this.selectedDate) {
            const iso = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
            this.loadDay(iso);
          }
          alert('? Cobro en efectivo registrado.');
        } else {
          alert('No se pudo registrar el cobro en efectivo.');
        }
      },
      error: (err) => {
        this.loading = false;
        alert(err?.error?.error || 'Error al registrar el cobro en efectivo');
      }
    });
  }

  // Evento desde DayDetail al confirmar nueva cita en el modal
  onDayCitaCreated(evt: { title: string; client?: string; date: string; startTime: string; endTime: string; notes?: string; color: string }) {
    console.log('[AGENDA] citaCreated (UI only placeholder):', evt);
  }
  
  /**
   * ?? Actualizar contador de citas programadas pendientes
   */
  private updateScheduledCount(): void {
    const scheduledCount = this.calendarEvents.filter(e => e.status === 'scheduled').length;
    this.scheduledAppointmentsCount = scheduledCount;
    console.log(`🔔 [AGENDA] Contador actualizado: ${scheduledCount} citas programadas`);
  }

  private onRealtimeUpsert(a: AppointmentDto) {
    console.log('🔔 [AGENDA] Realtime update recibido:', a);
    
    // Si el evento pertenece al mes seleccionado, actualizar calendario
    const [y, m] = a.date.split('-').map(Number);
    const current = this.selectedDate || new Date();
    if (current.getFullYear() === y && (current.getMonth() + 1) === m) {
      // Reemplazar/insertar en calendarEvents
      const ev = this.mapAppointmentToEvent(a);
      const idx = this.calendarEvents.findIndex(e => e.id === String(a.id));
      if (idx >= 0) this.calendarEvents[idx] = ev; else this.calendarEvents.push(ev);
      
      // ?? Recalcular contador de citas programadas
      this.updateScheduledCount();
    }
    if (a.status === 'cancelled') {
      try {
        this.notifications.setUserProfile('provider');
        const cancelledBy = (a as any)?.cancelled_by === 'client' ? 'cliente' : ((a as any)?.cancelled_by === 'provider' ? 'ti' : 'el sistema');
        const reason = (a as any)?.cancellation_reason ? ` Motivo: ${(a as any).cancellation_reason}` : '';
        this.notifications.createNotification({
          type: 'appointment',
          profile: 'provider',
          title: 'Cita cancelada',
          message: `La cita #${a.id} fue cancelada por ${cancelledBy}.${reason}`,
          priority: 'high',
          actions: ['view'],
          metadata: { appointmentId: String(a.id), status: 'cancelled' }
        });
      } catch {}
    }
    
    // Si el día seleccionado coincide, refrescar listado del día
    if (this.selectedDate) {
      const dIso = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth()+1).padStart(2,'0')}-${String(this.selectedDate.getDate()).padStart(2,'0')}`;
      if (dIso === a.date) {
        const da = this.mapAppointmentToDay(a);
        const di = this.dayAppointments.findIndex(x => x.id === String(a.id));
        if (di >= 0) this.dayAppointments[di] = da; else this.dayAppointments.push(da);
      }
    }
  }

  private onRealtimeDelete(id: number) {
    console.log('🔔 [AGENDA] Eliminando cita:', id);
    this.calendarEvents = this.calendarEvents.filter(e => e.id !== String(id));
    this.dayAppointments = this.dayAppointments.filter(d => d.id !== String(id));
    
    // ?? Recalcular contador
    this.updateScheduledCount();
  }

  private mapAppointmentToEvent(a: AppointmentDto): CalendarEvent {
    // Convertir YYYY-MM-DD o ISO string a Date de forma segura
    let eventDate: Date;
    
    try {
      if (!a.date || typeof a.date !== 'string') {
        console.warn(`[AGENDA] Invalid date for appointment ${a.id}:`, a.date);
        eventDate = new Date(); // Usar fecha actual como fallback
      } else {
        // Extraer solo YYYY-MM-DD si viene en formato ISO (2025-10-17T00:00:00.000Z)
        const dateOnly = a.date.includes('T') ? a.date.split('T')[0] : a.date;
        const [y, m, d] = dateOnly.split('-').map(Number);
        
        // Validar que los números sean válidos
        if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
          console.warn(`[AGENDA] Invalid date components for appointment ${a.id}:`, { y, m, d, originalDate: a.date });
          eventDate = new Date(); // Usar fecha actual como fallback
        } else {
          eventDate = new Date(y, m - 1, d);
          
          // Verificar que la fecha sea válida
          if (isNaN(eventDate.getTime())) {
            console.warn(`[AGENDA] Invalid date object for appointment ${a.id}:`, eventDate);
            eventDate = new Date(); // Usar fecha actual como fallback
          }
        }
      }
    } catch (error) {
      console.error(`[AGENDA] Error parsing date for appointment ${a.id}:`, error);
      eventDate = new Date(); // Usar fecha actual como fallback
    }
    
    console.log(`[AGENDA] Mapping event for calendar: appt #${a.id}, date="${a.date}" -> ${eventDate.toISOString()}`);
    console.log(`[AGENDA] Event data: status="${a.status}", payment_status="${(a as any).payment_status}"`);
    
    return {
      id: String(a.id),
      title: 'Cita',
      date: eventDate,
      time: a.start_time ? a.start_time.slice(0, 5) : '00:00',
      type: 'appointment',
      status: a.status,
      paymentStatus: (a as any).payment_status
    };
  }

  private mapAppointmentToDay(a: AppointmentDto & { client_name?: string; service_name?: string }): DayAppointment {
    return {
      id: String(a.id),
      title: a.service_name ? `${a.service_name}` : (a.client_name ? `Cita con ${a.client_name}` : 'Cita'),
      time: a.start_time.slice(0, 5),
      duration: this.diffMinutes(a.start_time, a.end_time),
      clientName: a.client_name || '',
      clientPhone: ((a as any).client_phone || '') as string,
      status: a.status as any,
      paymentStatus: (a.payment_status === 'completed' || a.payment_status === 'paid' || a.payment_status === 'succeeded') ? 'paid' : 'unpaid',
      type: 'appointment',
      notes: a.notes || '',
      paymentMethod: (a as any).payment_method || null,
      closureState: ((a as any).closure_state || 'none') as any,
      closureDueAt: (a as any).closure_due_at || null,
      closureProviderAction: ((a as any).closure_provider_action || 'none') as any,
      closureClientAction: ((a as any).closure_client_action || 'none') as any,
      cancelledBy: ((a as any).cancelled_by || null) as any,
      cancellationReason: (a as any).cancellation_reason || null,
      locationLabel: ((a as any).client_location_label || (a as any).client_location || '') as string,
      clientAddress: ((a as any).client_address ?? null) as string | null,
      clientCommune: ((a as any).client_commune ?? null) as string | null,
      clientRegion: ((a as any).client_region ?? null) as string | null
    };
  }

  onClosureAction(event: { id: string; action: 'no_show'|'issue' }) {
    const appointmentId = Number(event?.id);
    if (!appointmentId) return;
    let notes: string | undefined;
    if (event.action === 'issue') {
      const reason = prompt('Describe el problema detectado en esta cita:');
      if (!reason) {
        return;
      }
      notes = reason;
    }
    this.loading = true;
    this.appointments.submitClosureAction(appointmentId, event.action, notes).subscribe({
      next: (resp) => {
        this.loading = false;
          if (!resp?.success) {
            alert(resp?.error || 'No se pudo registrar la acción.');
          return;
        }
        if (this.selectedDate) {
          const iso = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
          this.loadDay(iso);
        }
        this.loadPaidAwaiting();
          alert('Acción registrada.');
      },
      error: () => {
        this.loading = false;
          alert('No se pudo registrar la acción.');
      }
    });
  }

  onVerifyClosure(appointmentId: string) {
    const id = Number(appointmentId);
    if (!id) return;
    const appointment = this.dayAppointments.find(a => String(a.id) === String(appointmentId));
    if (!appointment) {
      this.openVerifyModal({ id, client_name: '', service_name: '', payment_method: 'cash', date: '', start_time: '', amount: 0 });
      return;
    }
    this.openVerifyModal({
      id,
      client_name: appointment.clientName,
      service_name: appointment.title,
      date: this.selectedDate ? `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}` : '',
      start_time: appointment.time,
      amount: 0,
      payment_method: appointment.paymentMethod || 'cash'
    });
  }

  onUpdateAppointmentLocation(appointment: DayAppointment) {
    const appointmentId = Number(appointment?.id);
    if (!appointmentId) {
      return;
    }

    const currentLocation = appointment.locationLabel || '';
    const promptLabel = currentLocation
      ? 'Confirma o actualiza la dirección donde realizarás esta cita:'
      : 'Ingresa la dirección donde realizarás esta cita:';
    const nextValue = prompt(promptLabel, currentLocation);
    if (nextValue === null) {
      return;
    }

    const trimmed = nextValue.trim();

    this.appointments.updateLocation(appointmentId, trimmed.length ? trimmed : null).subscribe({
      next: (resp) => {
        if (!resp?.success || !(resp as any).appointment) {
          alert('No se pudo actualizar la dirección de la cita.');
          return;
        }
        const updated = (resp as any).appointment as AppointmentDto;
        this.onRealtimeUpsert(updated);
        const idx = this.dayAppointments.findIndex(a => Number(a.id) === appointmentId);
        if (idx >= 0) {
          this.dayAppointments[idx] = {
            ...this.dayAppointments[idx],
            locationLabel: (updated as any).client_location_label || (updated as any).client_location || (trimmed.length ? trimmed : ''),
            clientAddress: (updated as any).client_address ?? null,
            clientCommune: (updated as any).client_commune ?? null,
            clientRegion: (updated as any).client_region ?? null
          };
        }
      },
      error: (err) => {
        console.error('Error actualizando dirección de cita', err);
        alert(err?.error?.error || 'No se pudo actualizar la dirección de la cita.');
      }
    });
  }

  private diffMinutes(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }

  // Utilidades de formato para la vista
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const base = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = base.split('-').map(Number);
    if (!y || !m || !d) return '';
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  formatTime(hhmm: string): string {
    if (!hhmm) return '';
    const parts = hhmm.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return hhmm;
  }

  // Handlers de configuración de horarios (usados por el template)
  onAddTimeBlock(timeBlock: Omit<TimeBlock, 'id'>) {
    const newTimeBlock: TimeBlock = {
      ...timeBlock,
      id: Date.now().toString()
    } as TimeBlock;
    this.timeBlocks.push(newTimeBlock);
    console.log('Bloque de tiempo agregado:', newTimeBlock);
  }

  onRemoveTimeBlock(blockId: string) {
    this.timeBlocks = this.timeBlocks.filter(block => block.id !== blockId);
    console.log('Bloque de tiempo eliminado:', blockId);
  }

  onUpdateTimeBlock(updatedBlock: TimeBlock) {
    const index = this.timeBlocks.findIndex(block => block.id === updatedBlock.id);
    if (index !== -1) {
      this.timeBlocks[index] = updatedBlock;
      console.log('Bloque de tiempo actualizado:', updatedBlock);
    }
  }

  onSaveSchedule() {
    this.loading = true;
    this.availabilityService.getWeekly().subscribe({
      next: (resp) => {
        const existing = resp?.blocks || [];
    const dayNameToEnum: Record<string, any> = {
      'Lunes': 'monday', 'Martes': 'tuesday', 'Miércoles': 'wednesday', 'Jueves': 'thursday', 'Viernes': 'friday', 'Sábado': 'saturday', 'Domingo': 'sunday'
        };

        const tasks: Array<Promise<any>> = [];
        const key = (d: any) => `${d.day_of_week}|${String(d.start_time).slice(0,5)}|${String(d.end_time).slice(0,5)}`;
        const existingMap = new Map(existing.map((b: any) => [key(b), b]));

        this.timeBlocks.forEach(tb => {
          const dayEnum = dayNameToEnum[tb.day];
          const k = `${dayEnum}|${tb.startTime}|${tb.endTime}`;
          const found = existingMap.get(k);
          if (found) {
            tasks.push(this.availabilityService.updateWeekly(found.id, { is_active: tb.enabled }).toPromise());
            existingMap.delete(k);
          } else {
            tasks.push(this.availabilityService.createWeekly(dayEnum, tb.startTime, tb.endTime, tb.enabled).toPromise());
          }
        });

        existingMap.forEach((b: any) => {
          tasks.push(this.availabilityService.deleteWeekly(b.id).toPromise());
        });

        return Promise.allSettled(tasks).then(() => {
          this.loading = false;
          console.log('Horario guardado');
        });
      },
      error: () => { this.loading = false; }
    });
  }

  // Navegación
  setView(view: 'dashboard' | 'calendar' | 'cash' | 'config') {
    if (this.currentView === view) return;
    this.currentView = view;
    if (!this.updatingFromQuery) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { view },
        queryParamsHandling: 'merge'
      }).catch(() => {});
    }
    if (view === 'calendar' && this.selectedDate) {
      this.loadMonth(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1);
    }
    if (view === 'cash') {
      this.loadCashSummary();
      this.loadCashCommissions(this.cashTableFilter);
    }
  }
}


