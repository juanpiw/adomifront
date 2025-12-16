import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardResumenComponent, DashboardMetric } from '../../../../libs/shared-ui/dashboard-resumen/dashboard-resumen.component';
import { CalendarMensualComponent, CalendarEvent } from '../../../../libs/shared-ui/calendar-mensual/calendar-mensual.component';
import { DayDetailComponent, DayAppointment } from '../../../../libs/shared-ui/day-detail/day-detail.component';
import { DashboardGraficoComponent } from '../../../../libs/shared-ui/dashboard-grafico/dashboard-grafico.component';
import { ModalVerificarServicioComponent } from '../../../../libs/shared-ui/modal-verificar-servicio/modal-verificar-servicio.component';
import { ReviewModalComponent, ReviewData } from '../../../../libs/shared-ui/review-modal/review-modal.component';
import { HorariosConfigComponent, TimeBlock } from '../../../../libs/shared-ui/horarios-config/horarios-config.component';
import { ExcepcionesFeriadosComponent, ExceptionDate } from '../../../../libs/shared-ui/excepciones-feriados/excepciones-feriados.component';
import { ProviderAvailabilityService } from '../../../services/provider-availability.service';
import { AppointmentsService, AppointmentDto } from '../../../services/appointments.service';
import { ProviderClientReviewsService } from '../../../services/provider-client-reviews.service';
import { PaymentsService } from '../../../services/payments.service';
import { FinancesService, FinanceTransactionDto } from '../../../services/finances.service';
import { ProviderEarningsMonthModalComponent } from '../../../../libs/shared-ui/provider-earnings-month-modal/provider-earnings-month-modal.component';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../../libs/shared-ui/notifications/services/notification.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, of, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProviderServicesService, ProviderServiceDto } from '../../../services/provider-services.service';

interface PendingQuoteContext {
  quoteId: string | null;
  appointmentId?: number | null;
  clientId?: string | null;
  clientName?: string | null;
  serviceName?: string | null;
  date: string;
  time?: string | null;
  message?: string | null;
  amount?: string | null;
}

interface QuoteFocusHint {
  appointmentId?: number | null;
  time?: string | null;
  clientName?: string | null;
  serviceName?: string | null;
  message?: string | null;
}

interface QuoteDraftContext {
  serviceName?: string | null;
  clientName?: string | null;
  date?: string | null;
  time?: string | null;
  message?: string | null;
  serviceId?: number | null;
  quoteId?: number | null;
  clientId?: number | null;
}


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
    ExcepcionesFeriadosComponent,
    ModalVerificarServicioComponent,
    ReviewModalComponent,
    ProviderEarningsMonthModalComponent,
    FormsModule
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class DashAgendaComponent implements OnInit {
  // Datos del dashboard
  dashboardMetrics: DashboardMetric[] = [];

  // Datos del calendario
  calendarEvents: CalendarEvent[] = [];

  // Datos del día seleccionado
  selectedDate: Date | null = null;
  dayAppointments: DayAppointment[] = [];
  // Enfoque desde notificaciones
  focusAppointmentId: string | null = null;
  focusTime: string | null = null;
  private pendingQuoteContext: PendingQuoteContext | null = null;
  quoteFocusHint: QuoteFocusHint | null = null;
  quoteAppointmentDraft: QuoteDraftContext | null = null;
  providerServices: ProviderServiceDto[] = [];
  servicesLoading = false;
  private activeQuoteLink: { quoteId: number | null; clientId: number | null } | null = null;
  private creatingAppointment = false;

  // Datos de configuración de horarios
  timeBlocks: TimeBlock[] = [];
  exceptions: ExceptionDate[] = [];
  exceptionsLoading = false;
  private readonly dayEnumToLabel: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  private readonly dayLabelToEnum: Record<string, string> = {
    Lunes: 'monday',
    Martes: 'tuesday',
    Miércoles: 'wednesday',
    Jueves: 'thursday',
    Viernes: 'friday',
    Sábado: 'saturday',
    Domingo: 'sunday'
  };
  private weeklyBlockIndex = new Map<number, { dayEnum: string; start: string; end: string; enabled: boolean }>();

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
  cashDebts: Array<{ time: string; client: string; date: string; commission: number; dueDate: string; status: 'pending'|'overdue'|'under_review'|'rejected'|'paid' }>= [];
  cashTotal = 0;
  cashOverdueTotal = 0;
  cashNextDueDate: string | null = null;
  cashNextDueDateLabel: string | null = null;
  cashSummaryLoading = false;
  cashLoading = false;
  cashTableFilter: 'all'|'pending'|'overdue'|'under_review'|'rejected'|'paid' = 'pending';
  cashSummary: {
    total_due: number;
    overdue_due: number;
    pending_count: number;
    overdue_count: number;
    under_review_count: number;
    rejected_count: number;
    paid_count: number;
    next_due_date: string | null;
    last_debt: {
      id: number;
      commission_amount: number;
      currency: string;
      status: string | null;
      due_date: string | null;
      created_at: string | null;
      manual_payment_id?: number | null;
      manual_payment_status?: string | null;
      manual_payment_reference?: string | null;
      manual_payment_receipt_url?: string | null;
      manual_payment_bucket?: string | null;
      manual_payment_key?: string | null;
      manual_payment_filename?: string | null;
      manual_payment_updated_at?: string | null;
    } | null;
  } | null = null;

  @ViewChild('cashReceiptInput') cashReceiptInput?: ElementRef<HTMLInputElement>;
  @ViewChild('clientReviewModal') clientReviewModal?: ReviewModalComponent;

  cashPaymentModalOpen = false;
  cashPaymentSubmitting = false;
  cashPaymentFeedback: { type: 'success' | 'error'; message: string } | null = null;
  cashPaymentFileError = '';
  cashPaymentReceiptFile: File | null = null;
  cashPaymentReceiptName: string | null = null;
  cashPaymentMaxFileMb: number = Number(((environment as any)?.cashPaymentMaxMb ?? 5));
  cashPaymentForm: { reference: string; notes: string } = { reference: '', notes: '' };
  cashPaymentLocalState: 'idle' | 'under_review' | 'approved' | 'rejected' = 'idle';
  cashBankAccount = {
    bank: this.getEnv('cashBankName', 'Banco de Chile'),
    holder: this.getEnv('cashBankHolder', 'Adomi SpA'),
    rut: this.getEnv('cashBankRut', '77.123.456-K'),
    accountType: this.getEnv('cashBankAccountType', 'Cuenta Corriente'),
    accountNumber: this.getEnv('cashBankAccountNumber', '00-123-45678-9'),
    email: this.getEnv('cashBankNotificationEmail', 'pagos@adomi.app')
  };

  reviewModalOpen = false;
  reviewModalSubmitting = false;
  reviewModalError: string | null = null;
  reviewTargetAppointment: DayAppointment | null = null;

  rescheduleRequestsLoading = false;
  rescheduleRequests: Array<(AppointmentDto & { client_name?: string; service_name?: string; reschedule_target_date?: string | null; reschedule_target_start_time?: string | null; reschedule_reason?: string | null })> = [];
  rescheduleDecisionLoadingId: number | null = null;

  currentProviderName: string | null = null;
  availabilityLoading = false;
  private appointments = inject(AppointmentsService);
  private payments = inject(PaymentsService);
  private finances = inject(FinancesService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientReviews = inject(ProviderClientReviewsService);
  private providerServicesService = inject(ProviderServicesService);

  private updatingFromQuery = false;

  private currentProviderId: number | null = null;

  // Dashboard derived metrics
  private newClientsCount = 0;
  private occupancyRateValue = 85;

  // Datos del gráfico
  chartData: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension: number; }[] } | null = null;

  // Modal: detalle de ingresos del mes
  earningsModalOpen = false;
  earningsModalLoading = false;
  earningsModalError: string | null = null;
  earningsSummary: any | null = null;
  earningsTransactions: FinanceTransactionDto[] = [];
  earningsTransactionsTotal = 0;
  earningsTransactionsLimit = 50;
  earningsTransactionsOffset = 0;

  constructor(private availabilityService: ProviderAvailabilityService) {}

  ngOnInit() {
    this.currentProviderName = this.auth.getCurrentUser()?.name || null;
    this.loadProviderServices();

    this.route.queryParamMap.subscribe((params) => {
      const viewParam = (params.get('view') || '').toLowerCase();
      if (['dashboard', 'calendar', 'cash', 'config'].includes(viewParam)) {
        this.updatingFromQuery = true;
        this.setView(viewParam as 'dashboard' | 'calendar' | 'cash' | 'config');
        this.updatingFromQuery = false;
      }
      const quoteContext = this.buildPendingQuoteContext(params);
      if (quoteContext) {
        this.pendingQuoteContext = quoteContext;
      }
      const dateParam = quoteContext?.date ?? params.get('date');
      const timeParam = quoteContext?.time ?? params.get('time');
      const quoteIdParam = quoteContext?.quoteId ?? params.get('quoteId');
      const focusApptIdRaw = params.get('appointmentId') ?? params.get('appointment_id');
      this.focusAppointmentId = focusApptIdRaw ? String(focusApptIdRaw) : null;
      this.focusTime = timeParam ? String(timeParam) : null;
      if (dateParam) {
        this.focusDateFromQuery(dateParam, timeParam, quoteIdParam);
      } else if (this.focusAppointmentId) {
        // Si viene solo appointmentId (sin date), al menos llevar a vista calendario.
        if (this.currentView !== 'calendar') {
          this.updatingFromQuery = true;
          this.setView('calendar');
          this.updatingFromQuery = false;
        }
      }
    });

    this.loadDashboardData();
    this.refreshEarnings();
    this.loadPaidAwaiting();
    this.loadRescheduleRequests();
    this.loadWeeklyAvailability();
    this.loadExceptions();
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
    this.appointments.onAppointmentUpdated().subscribe((a: AppointmentDto) => {
      this.onRealtimeUpsert(a);
      this.loadRescheduleRequests();
    });
    this.appointments.onAppointmentDeleted().subscribe((p: { id: number }) => this.onRealtimeDelete(p.id));

    // Inicializar pestaña cash
    this.loadCashSummary();
    this.loadCashCommissions(this.cashTableFilter);
    this.loadWeeklyAvailability();
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
        this.applyPendingQuoteContext(dateIso);
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
          this.cashNextDueDate = res.summary.next_due_date || null;
          this.cashNextDueDateLabel = this.cashNextDueDate ? this.formatDueDateLabel(this.cashNextDueDate) : null;
          this.cashSummary = {
            total_due: this.cashTotal,
            overdue_due: this.cashOverdueTotal,
            pending_count: Number(res.summary.pending_count || 0),
            overdue_count: Number(res.summary.overdue_count || 0),
            under_review_count: Number(res.summary.under_review_count || 0),
            rejected_count: Number(res.summary.rejected_count || 0),
            paid_count: Number(res.summary.paid_count || 0),
            next_due_date: this.cashNextDueDate,
            last_debt: res.summary.last_debt || null
          };
          const lastStatus = this.cashSummary?.last_debt?.status as string | undefined;
          if (lastStatus === 'under_review') {
            this.cashPaymentLocalState = 'under_review';
          } else if (lastStatus === 'paid') {
            this.cashPaymentLocalState = 'approved';
          } else if (lastStatus === 'rejected') {
            this.cashPaymentLocalState = 'rejected';
          } else {
            this.cashPaymentLocalState = 'idle';
          }
          console.log('[TRACE][AGENDA] loadCashSummary parsed', this.cashSummary);
          const debtIdx = this.dashboardMetrics.findIndex(m => m.label === 'Deuda a la aplicación');
          if (debtIdx >= 0) {
            this.dashboardMetrics[debtIdx] = { ...this.dashboardMetrics[debtIdx], value: `$${this.cashTotal.toLocaleString('es-CL')}` } as any;
          }
          const cashIdx = this.dashboardMetrics.findIndex(m => m.label === 'Citas pagadas en efectivo');
          if (cashIdx >= 0) {
            this.dashboardMetrics[cashIdx] = { ...this.dashboardMetrics[cashIdx], value: this.cashTotal > 0 ? 1 : 0 } as any;
          }
        } else {
          this.cashSummary = null;
          this.cashTotal = 0;
          this.cashOverdueTotal = 0;
          this.cashNextDueDate = null;
          this.cashNextDueDateLabel = null;
          this.cashPaymentLocalState = 'idle';
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

  private loadCashCommissions(filter: 'all'|'pending'|'overdue'|'under_review'|'rejected'|'paid' = this.cashTableFilter) {
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
          status: (r.status || 'pending') as 'pending'|'overdue'|'under_review'|'rejected'|'paid'
        }));
      },
      error: () => { this.cashLoading = false; },
      complete: () => { this.cashLoading = false; }
    });
  }

  private loadWeeklyAvailability() {
    this.availabilityLoading = true;
    this.availabilityService.getWeekly().subscribe({
      next: (resp) => {
        const blocks = Array.isArray(resp?.blocks) ? resp.blocks : [];
        this.weeklyBlockIndex.clear();
        this.timeBlocks = blocks.map((block: any) => {
          const id = Number(block.id);
          const dayEnum = String(block.day_of_week || '').toLowerCase();
          const dayLabel = this.dayEnumToLabel[dayEnum] || this.capitalize(dayEnum);
          const start = String(block.start_time || '').slice(0, 5);
          const end = String(block.end_time || '').slice(0, 5);
          const enabled = block.is_active !== false;
          if (Number.isFinite(id)) {
            this.weeklyBlockIndex.set(id, { dayEnum, start, end, enabled });
          }
          return {
            id: String(block.id),
            day: dayLabel,
            startTime: start,
            endTime: end,
            enabled
          };
        });
        this.availabilityLoading = false;
      },
      error: (err) => {
        console.error('[AGENDA] Error cargando disponibilidad semanal', err);
        this.timeBlocks = [];
        this.weeklyBlockIndex.clear();
        this.availabilityLoading = false;
      }
    });
  }

  private loadExceptions(): void {
    this.exceptionsLoading = true;
    this.availabilityService.listExceptions().subscribe({
      next: (resp) => {
        const list = Array.isArray(resp?.exceptions) ? resp.exceptions : [];
        this.exceptions = list
          .map((exc: any) => ({
            id: String(exc.id),
            date: exc.exception_date || exc.date || '',
            reason: exc.reason || undefined
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        this.exceptionsLoading = false;
      },
      error: (err) => {
        console.error('[AGENDA] Error cargando excepciones de disponibilidad', err);
        this.exceptions = [];
        this.exceptionsLoading = false;
      }
    });
  }

  private loadProviderServices(): void {
    this.servicesLoading = true;
    this.providerServicesService.list().subscribe({
      next: (resp) => {
        this.providerServices = resp?.services ?? [];
        this.servicesLoading = false;
        this.ensureQuoteDraftServiceId();
      },
      error: (err) => {
        console.error('[AGENDA] Error cargando servicios del proveedor', err);
        this.providerServices = [];
        this.servicesLoading = false;
      }
    });
  }

  private ensureQuoteDraftServiceId(): void {
    if (!this.quoteAppointmentDraft || this.quoteAppointmentDraft.serviceId) {
      return;
    }
    const matched = this.matchServiceIdByName(this.quoteAppointmentDraft.serviceName);
    if (matched) {
      this.quoteAppointmentDraft = {
        ...this.quoteAppointmentDraft,
        serviceId: matched
      };
    }
  }

  private matchServiceIdByName(name?: string | null): number | null {
    if (!this.providerServices?.length) {
      return null;
    }
    if (!name) {
      return this.providerServices[0]?.id ?? null;
    }
    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return this.providerServices[0]?.id ?? null;
    }
    const exact = this.providerServices.find((svc) => svc.name?.trim().toLowerCase() === normalized);
    if (exact) {
      return exact.id;
    }
    const partial = this.providerServices.find((svc) => normalized.includes((svc.name || '').trim().toLowerCase()));
    return partial ? partial.id : this.providerServices[0]?.id ?? null;
  }

  setCashFilter(filter: 'all'|'pending'|'overdue'|'under_review'|'rejected'|'paid') {
    if (this.cashTableFilter === filter && !this.cashLoading) {
      return;
    }
    this.loadCashCommissions(filter);
  }

  refreshCash() {
    this.loadCashSummary();
    this.loadCashCommissions(this.cashTableFilter);
  }

  openCashPaymentModal(): void {
    if (this.cashTotal <= 0) {
      return;
    }
    const status = this.cashPaymentStatusKey;
    if (status === 'under_review' || status === 'paid') {
      return;
    }
    this.cashPaymentModalOpen = true;
    this.cashPaymentSubmitting = false;
    this.cashPaymentFeedback = null;
    this.cashPaymentFileError = '';
    this.cashPaymentForm = { reference: '', notes: '' };
    this.clearCashReceiptFile();
  }

  closeCashPaymentModal(): void {
    if (this.cashPaymentSubmitting) {
      return;
    }
    this.cashPaymentModalOpen = false;
    this.cashPaymentFeedback = null;
    this.cashPaymentFileError = '';
    this.clearCashReceiptFile();
  }

  onCashReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input?.files?.length) {
      return;
    }
    const file = input.files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.cashPaymentFileError = 'Formato no permitido. Usa PDF, JPG o PNG.';
      this.clearCashReceiptFile();
      return;
    }
    const maxBytes = this.cashPaymentMaxFileMb * 1024 * 1024;
    if (file.size > maxBytes) {
      this.cashPaymentFileError = `El archivo supera el máximo de ${this.cashPaymentMaxFileMb} MB.`;
      this.clearCashReceiptFile();
      return;
    }
    this.cashPaymentReceiptFile = file;
    this.cashPaymentReceiptName = file.name;
    this.cashPaymentFileError = '';
  }

  clearCashReceiptFile(): void {
    this.cashPaymentReceiptFile = null;
    this.cashPaymentReceiptName = null;
    this.cashPaymentFileError = '';
    if (this.cashReceiptInput?.nativeElement) {
      this.cashReceiptInput.nativeElement.value = '';
    }
  }

  async submitCashPayment(): Promise<void> {
    if (this.cashPaymentSubmitting) {
      return;
    }
    if (!this.cashPaymentReceiptFile) {
      this.cashPaymentFileError = 'Debes adjuntar el comprobante antes de continuar.';
      return;
    }
    if (!this.cashSummary || this.cashTotal <= 0) {
      this.cashPaymentFeedback = { type: 'error', message: 'No encontramos comisiones pendientes para registrar.' };
      return;
    }

    const file = this.cashPaymentReceiptFile;
    const amount = Number(this.cashTotal || 0);
    const currency = this.cashSummary?.last_debt?.currency || 'CLP';
    const reference = this.cashPaymentForm.reference?.trim() || undefined;
    const notes = this.cashPaymentForm.notes?.trim() || undefined;

    this.cashPaymentSubmitting = true;
    this.cashPaymentFeedback = null;
    this.cashPaymentFileError = '';

    try {
      const signResponse: any = await firstValueFrom(this.payments.signManualCashPaymentReceipt({
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        fileName: this.cashPaymentReceiptName || file.name
      }));

      if (!signResponse?.success || !signResponse.uploadUrl || !signResponse.key) {
        throw new Error(signResponse?.error || 'No se pudo preparar la subida del comprobante.');
      }

      const uploadResp = await fetch(signResponse.uploadUrl, {
        method: 'PUT',
        headers: signResponse.headers || { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      });

      if (!uploadResp.ok) {
        const errorText = await uploadResp.text().catch(() => '');
        throw new Error(`No se pudo subir el comprobante (${uploadResp.status}). ${errorText}`.trim());
      }

      const finalizeResponse: any = await firstValueFrom(this.payments.submitManualCashPayment({
        amount,
        currency,
        key: signResponse.key,
        bucket: signResponse.bucket,
        reference,
        notes,
        fileName: this.cashPaymentReceiptName || file.name
      }));

      if (!finalizeResponse?.success) {
        throw new Error(finalizeResponse?.error || 'No se pudo registrar el pago manual.');
      }

      const difference = Number(finalizeResponse?.difference || 0);
      const differenceNote = Math.abs(difference) > 0.01
        ? ` (registramos diferencia de ${difference.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP)`
        : '';

      this.cashPaymentLocalState = 'under_review';
      this.cashPaymentFeedback = {
        type: 'success',
        message: `Comprobante enviado correctamente${differenceNote}. Revisaremos tu pago dentro de las próximas horas.`
      };
      this.cashPaymentForm = { reference: '', notes: '' };
      this.clearCashReceiptFile();
      this.refreshCash();
    } catch (error: any) {
      console.error('[AGENDA] submitCashPayment error', error);
      const message = error?.error?.error || error?.message || 'No se pudo registrar el pago manual. Intenta nuevamente.';
      this.cashPaymentFeedback = { type: 'error', message };
      this.cashPaymentLocalState = 'idle';
    } finally {
      this.cashPaymentSubmitting = false;
    }
  }

  get cashPaymentStatusLabel(): string | null {
    const status = this.cashPaymentStatusKey;
    if (status === 'paid') {
      return 'Pago confirmado';
    }
    if (status === 'under_review') {
      return 'Comprobante en revisión';
    }
    if (status === 'rejected') {
      return 'Comprobante rechazado. Revisa el correo y vuelve a subir otro comprobante.';
    }
    return null;
  }

  get cashPaymentStatusStyle(): 'review' | 'success' | 'error' | null {
    const status = this.cashPaymentStatusKey;
    if (status === 'paid') {
      return 'success';
    }
    if (status === 'under_review') {
      return 'review';
    }
    if (status === 'rejected') {
      return 'error';
    }
    return null;
  }

  get cashPaymentButtonLabel(): string {
    const status = this.cashPaymentStatusKey;
    if (status === 'paid') {
      return 'Pago confirmado';
    }
    if (status === 'under_review') {
      return 'En revisión';
    }
    if (status === 'rejected') {
      return 'Reenviar comprobante';
    }
    if (this.cashTotal > 0) {
      return `Pagar ${this.formatCurrencyCLP(this.cashTotal)}`;
    }
    return 'Pagar Total Adeudado';
  }

  get isCashPaymentButtonDisabled(): boolean {
    const status = this.cashPaymentStatusKey;
    if (status === 'under_review' || status === 'paid') {
      return true;
    }
    return this.cashSummaryLoading || this.cashTotal === 0;
  }

  private get cashPaymentStatusKey(): 'under_review' | 'paid' | 'rejected' | null {
    const summaryStatus = this.cashSummary?.last_debt?.status as string | undefined;
    if (summaryStatus === 'paid') {
      return 'paid';
    }
    if (summaryStatus === 'under_review') {
      return 'under_review';
    }
    if (summaryStatus === 'rejected') {
      return 'rejected';
    }
    if (this.cashPaymentLocalState === 'approved') {
      return 'paid';
    }
    if (this.cashPaymentLocalState === 'under_review') {
      return 'under_review';
    }
    if (this.cashPaymentLocalState === 'rejected') {
      return 'rejected';
    }
    return null;
  }

  private formatCurrencyCLP(amount: number): string {
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
      return `$${Math.round(amount || 0).toLocaleString('es-CL')}`;
    }
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

  private loadRescheduleRequests() {
    this.rescheduleRequestsLoading = true;
    this.appointments.listProviderRescheduleRequests().subscribe({
      next: (resp) => {
        this.rescheduleRequests = Array.isArray(resp?.appointments) ? resp.appointments : [];
        this.rescheduleRequestsLoading = false;
      },
      error: (err) => {
        this.rescheduleRequestsLoading = false;
        console.error('[AGENDA] Error cargando solicitudes de reprogramación', err);
      }
    });
  }

  respondRescheduleRequest(appointmentId: number, decision: 'accept'|'reject'): void {
    if (!appointmentId) return;
    if (this.rescheduleDecisionLoadingId === appointmentId) return;
    let reason: string | null = null;
    if (decision === 'reject') {
      const confirmReject = window.confirm('¿Deseas rechazar la reprogramación solicitada por el cliente?');
      if (!confirmReject) return;
      const input = window.prompt('Motivo para el cliente (opcional)');
      reason = input && input.trim().length ? input.trim() : null;
    }
    this.rescheduleDecisionLoadingId = appointmentId;
    this.appointments.respondReschedule(appointmentId, decision, { reason }).subscribe({
      next: (resp: any) => {
        this.rescheduleDecisionLoadingId = null;
        if (!resp?.success) {
          console.warn('[AGENDA] respondRescheduleRequest sin success', resp);
          const errCode = resp?.error;
          if (errCode === 'SLOT_TAKEN') {
            alert('Ese horario ya no está disponible (alguien ya lo tomó). Elige otro horario y vuelve a intentar.');
          } else {
            alert(errCode || 'No se pudo procesar la solicitud de reprogramación.');
          }
          return;
        }
        this.loadRescheduleRequests();
        if (this.selectedDate) {
          const iso = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
          this.loadDay(iso);
        }
      },
      error: (err) => {
        this.rescheduleDecisionLoadingId = null;
        console.error('[AGENDA] Error al responder solicitud de reprogramación', err);
        const errCode = err?.error?.error;
        if (err?.status === 409 && errCode === 'SLOT_TAKEN') {
          alert('Ese horario ya no está disponible (alguien ya lo tomó). Elige otro horario y vuelve a intentar.');
          return;
        }
        alert(errCode || 'No se pudo procesar la respuesta de reprogramación.');
      }
    });
  }

  formatRescheduleRequestLabel(appt: AppointmentDto & { reschedule_target_date?: string | null; reschedule_target_start_time?: string | null }): string {
    const date = appt?.reschedule_target_date || appt?.date;
    const time = (appt?.reschedule_target_start_time || appt?.start_time || '').toString();
    const formattedDate = this.formatDateLabel(date || '');
    const formattedTime = this.formatTimeLabel(time);
    return `${formattedDate} a las ${formattedTime}`;
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
    this.dashboardMetrics = [
      {
        label: 'Citas Pendientes',
        value: this.calendarEvents.length,
        meta: 'Próximos 7 días'
      },
      {
        label: 'Citas por Pagar (esperan código)',
        value: this.paidAwaitingAppointments.length,
        meta: 'Pagadas por clientes',
        onClick: () => this.togglePaidAwaitingPanel()
      },
      {
        label: 'Ingresos (Mes)',
        value: '$0',
        meta: 'Pendiente: $0 · Liberado: $0',
        onClick: () => this.openEarningsModal()
      },
      this.recentClientsMetric,
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
      this.occupancyMetric
    ];
  }

  private get recentClientsMetric() {
    return {
      label: 'Nuevos Clientes',
      value: this.newClientsCount,
      meta: 'Este mes'
    };
  }

  private get occupancyMetric() {
    return {
      label: 'Tasa de Ocupación',
      value: `${this.occupancyRateValue}%`,
      meta: 'Semana actual'
    };
  }

  private refreshEarnings(month?: string) {
    try {
      (this.payments as any).getProviderEarningsSummary({ month }).subscribe({
        next: (resp: any) => {
          if (resp?.success && resp.summary) {
            this.earningsSummary = resp.summary;
            const { releasable, pending, released } = resp.summary;
            // Actualiza la tarjeta "Ingresos (Mes)" con el monto liberable
            const idx = this.dashboardMetrics.findIndex(m => m.label === 'Ingresos (Mes)');
            if (idx >= 0) {
              this.dashboardMetrics[idx] = {
                ...this.dashboardMetrics[idx],
                value: `$${Number(releasable || 0).toLocaleString('es-CL')}`,
                meta: `Pendiente: $${Number(pending || 0).toLocaleString('es-CL')} · Liberado: $${Number(released || 0).toLocaleString('es-CL')}`,
                onClick: () => this.openEarningsModal()
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

  openEarningsModal(): void {
    this.earningsModalOpen = true;
    this.earningsModalError = null;
    this.earningsTransactions = [];
    this.earningsTransactionsTotal = 0;
    this.earningsTransactionsOffset = 0;

    // Si no tenemos summary aún, lo cargamos primero
    if (!this.earningsSummary?.range?.start || !this.earningsSummary?.range?.end) {
      this.earningsModalLoading = true;
      (this.payments as any).getProviderEarningsSummary({}).subscribe({
        next: (resp: any) => {
          this.earningsModalLoading = false;
          if (resp?.success && resp.summary) {
            this.earningsSummary = resp.summary;
            this.loadEarningsTransactions(true);
            return;
          }
          this.earningsModalError = resp?.error || 'No se pudo cargar el resumen del mes.';
        },
        error: (err: any) => {
          this.earningsModalLoading = false;
          this.earningsModalError = err?.error?.error || 'No se pudo cargar el resumen del mes.';
        }
      });
      return;
    }

    this.loadEarningsTransactions(true);
  }

  closeEarningsModal(): void {
    if (this.earningsModalLoading) {
      // Permitir cerrar igual para no quedar bloqueado
      this.earningsModalLoading = false;
    }
    this.earningsModalOpen = false;
  }

  loadMoreEarningsTransactions(): void {
    if (this.earningsModalLoading) return;
    if (this.earningsTransactions.length >= this.earningsTransactionsTotal) return;
    this.loadEarningsTransactions(false);
  }

  private loadEarningsTransactions(reset: boolean): void {
    const from = String(this.earningsSummary?.range?.start || '').slice(0, 10);
    const to = String(this.earningsSummary?.range?.end || '').slice(0, 10);
    if (!from || !to) {
      this.earningsModalError = 'Rango inválido para cargar transacciones.';
      return;
    }
    if (reset) {
      this.earningsTransactionsOffset = 0;
      this.earningsTransactions = [];
    }
    this.earningsModalLoading = true;
    this.earningsModalError = null;
    this.finances.getTransactions(from, to, this.earningsTransactionsLimit, this.earningsTransactionsOffset).subscribe({
      next: (resp: any) => {
        this.earningsModalLoading = false;
        if (!resp?.success) {
          this.earningsModalError = resp?.error || 'No se pudieron cargar las transacciones.';
          return;
        }
        const rows = Array.isArray(resp?.transactions) ? resp.transactions : [];
        this.earningsTransactionsTotal = Number(resp?.total || 0);
        this.earningsTransactions = [...this.earningsTransactions, ...rows] as FinanceTransactionDto[];
        this.earningsTransactionsOffset = this.earningsTransactions.length;
      },
      error: (err) => {
        this.earningsModalLoading = false;
        this.earningsModalError = err?.error?.error || 'No se pudieron cargar las transacciones.';
      }
    });
  }

  private focusDateFromQuery(dateParam: string, timeParam: string | null, quoteIdParam: string | null) {
    const normalizedDate = this.normalizeDateParam(dateParam);
    if (!normalizedDate) {
      console.warn('[AGENDA] Fecha inválida recibida desde cotizaciones', dateParam);
      return;
    }
    const parsed = this.parseIsoDate(normalizedDate);
    if (!parsed) {
      console.warn('[AGENDA] No se pudo interpretar la fecha recibida desde cotizaciones', normalizedDate);
      return;
    }
    if (this.currentView !== 'calendar') {
      this.updatingFromQuery = true;
      this.setView('calendar');
      this.updatingFromQuery = false;
    }
    this.selectedDate = parsed;
    this.loadMonth(parsed.getFullYear(), parsed.getMonth() + 1);
    this.loadDay(normalizedDate);
    if (quoteIdParam) {
      console.debug('[AGENDA] Navegando desde cotización aceptada', { quoteId: quoteIdParam, dateParam: normalizedDate, timeParam });
    }
  }

  private applyPendingQuoteContext(dateIso: string) {
    if (!this.pendingQuoteContext || this.pendingQuoteContext.date !== dateIso) {
      return;
    }
    const quoteId = this.normalizeNumberParam(this.pendingQuoteContext.quoteId);
    const clientId = this.normalizeNumberParam(this.pendingQuoteContext.clientId);
    const matchedServiceId = this.matchServiceIdByName(this.pendingQuoteContext.serviceName);

    this.quoteFocusHint = {
      appointmentId: this.pendingQuoteContext.appointmentId ?? null,
      time: this.pendingQuoteContext.time ?? null,
      clientName: this.pendingQuoteContext.clientName ?? null,
      serviceName: this.pendingQuoteContext.serviceName ?? null,
      message: this.pendingQuoteContext.message ?? null
    };
    this.quoteAppointmentDraft = {
      serviceName: this.pendingQuoteContext.serviceName ?? null,
      clientName: this.pendingQuoteContext.clientName ?? null,
      date: this.pendingQuoteContext.date,
      time: this.pendingQuoteContext.time ?? null,
      message: this.pendingQuoteContext.message ?? null,
      serviceId: matchedServiceId,
      quoteId,
      clientId
    };
    this.activeQuoteLink = { quoteId, clientId };
    this.pendingQuoteContext = null;
  }

  onQuoteFocusHandled(): void {
    this.quoteFocusHint = null;
  }

  onQuoteDraftHandled(): void {
    this.quoteAppointmentDraft = null;
  }

  private parseIsoDate(raw: string): Date | null {
    if (!raw) return null;
    const direct = new Date(raw);
    if (!Number.isNaN(direct.getTime())) return direct;
    const fallback = new Date(`${raw}T00:00:00`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  private buildPendingQuoteContext(params: ParamMap): PendingQuoteContext | null {
    const normalizedDate = this.normalizeDateParam(params.get('date'));
    if (!normalizedDate) return null;
    return {
      quoteId: params.get('quoteId'),
      appointmentId: this.normalizeNumberParam(params.get('appointmentId')),
      clientId: params.get('clientId'),
      clientName: params.get('clientName'),
      serviceName: params.get('service'),
      amount: params.get('amount'),
      message: params.get('message'),
      date: normalizedDate,
      time: this.normalizeTimeParam(params.get('time'))
    };
  }

  private normalizeDateParam(raw: string | null): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private normalizeTimeParam(raw: string | null): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed.slice(0, 5);
    }
    return null;
  }

  private normalizeNumberParam(raw: string | number | null | undefined): number | null {
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Event handlers del calendario
  onDateSelected(date: Date) {
    this.quoteFocusHint = null;
    this.pendingQuoteContext = null;
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

  onViewClientProfile(appointment: DayAppointment) {
    if (!appointment || !appointment.clientId) {
      console.warn('[AGENDA] No se pudo navegar al perfil del cliente: faltan datos', appointment);
      return;
    }
    const tree = this.router.createUrlTree(['/dash/clientes', appointment.clientId]);
    const serializedUrl = this.router.serializeUrl(tree);
    console.log('[AGENDA] Navegando al perfil del cliente dentro de la app', {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      serializedUrl,
      currentLocation: typeof window !== 'undefined' ? window.location.href : 'server'
    });
    this.router.navigateByUrl(serializedUrl).catch((err) => {
      console.error('[AGENDA] Error navegando al perfil del cliente', err);
    });
  }

  onReviewClient(appointment: DayAppointment) {
    if (!appointment || !appointment.clientId) {
      console.warn('[AGENDA] No se puede calificar al cliente: faltan datos de la cita', appointment);
      alert('No se pudo abrir la calificación porque faltan datos del cliente.');
      return;
    }
    this.reviewModalError = null;
    this.reviewModalSubmitting = false;
    this.reviewTargetAppointment = appointment;
    this.reviewModalOpen = true;
  }

  onReviewModalClose() {
    this.reviewModalOpen = false;
    this.reviewModalError = null;
    this.reviewModalSubmitting = false;
    this.reviewTargetAppointment = null;
  }

  onReviewModalSubmit(data: ReviewData) {
    const appointment = this.reviewTargetAppointment;
    if (!appointment || !appointment.clientId) {
      this.clientReviewModal?.showError('No se pudo identificar la cita que deseas calificar.');
      return;
    }

    const clientId = Number(appointment.clientId);
    const appointmentId = Number(appointment.id);

    if (!Number.isFinite(clientId) || clientId <= 0 || !Number.isFinite(appointmentId) || appointmentId <= 0) {
      this.clientReviewModal?.showError('Datos de la cita inválidos. Intenta nuevamente.');
      return;
    }

    this.reviewModalSubmitting = true;
    const payload = {
      appointment_id: appointmentId,
      rating: data.rating,
      comment: data.comment?.trim() ? data.comment.trim() : null
    };

    this.clientReviews.createReview(clientId, payload).subscribe({
      next: (resp) => {
        this.reviewModalSubmitting = false;
        if (!resp?.success) {
          const message = resp?.error || 'No se pudo registrar tu reseña.';
          this.clientReviewModal?.showError(message);
          return;
        }

        const reviewId = resp.review && 'id' in resp.review ? Number((resp.review as any).id) : null;

        const idx = this.dayAppointments.findIndex((a) => String(a.id) === String(appointment.id));
        if (idx >= 0) {
          this.dayAppointments[idx] = {
            ...this.dayAppointments[idx],
            clientReviewId: reviewId ?? this.dayAppointments[idx].clientReviewId ?? appointmentId,
            canReviewClient: false
          };
        }

        this.reviewTargetAppointment = this.dayAppointments[idx] || appointment;
        this.clientReviewModal?.showSuccess();
      },
      error: (err) => {
        console.error('[AGENDA] Error creando reseña de cliente', err);
        this.reviewModalSubmitting = false;
        const message = err?.error?.error || 'No se pudo registrar tu reseña. Intenta nuevamente.';
        this.clientReviewModal?.showError(message);
      }
    });
  }

  get reviewModalClientName(): string {
    return this.reviewTargetAppointment?.clientName || '';
  }

  get reviewModalServiceName(): string {
    return this.reviewTargetAppointment?.title || '';
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
  onDayCitaCreated(evt: { title: string; client?: string; date: string; startTime: string; endTime: string; notes?: string; color: string; serviceId?: number }) {
    console.log('[AGENDA] citaCreated (desde modal):', evt);
    const providerId = this.currentProviderId;
    const clientId = this.activeQuoteLink?.clientId ?? null;
    const quoteId = this.activeQuoteLink?.quoteId ?? null;
    const serviceId = evt.serviceId ?? this.matchServiceIdByName(evt.title);

    if (!providerId) {
      console.error('[AGENDA] No hay providerId para crear la cita');
      alert('No pudimos determinar tu cuenta de proveedor. Intenta recargar la página.');
      return;
    }
    if (!clientId) {
      console.error('[AGENDA] No hay clientId asociado a la cotización aceptada');
      alert('No encontramos al cliente asociado a esta cotización. Vuelve a abrir la cotización desde el panel.');
      return;
    }
    if (!serviceId) {
      console.error('[AGENDA] No hay serviceId disponible para la cita', { titulo: evt.title });
      alert('Debes tener al menos un servicio configurado para poder agendar esta cita.');
      return;
    }

    this.creatingAppointment = true;
    this.appointments.create({
      provider_id: providerId,
      client_id: clientId,
      service_id: serviceId,
      date: evt.date,
      start_time: evt.startTime,
      end_time: evt.endTime,
      notes: evt.notes,
      quote_id: quoteId ?? undefined
    }).subscribe({
      next: (resp) => {
        console.log('[AGENDA] Cita creada y vinculada a la cotización', resp);
        this.creatingAppointment = false;
        this.activeQuoteLink = null;
        this.quoteAppointmentDraft = null;
        const refreshDate = this.selectedDate ?? new Date(`${evt.date}T00:00:00`);
        if (refreshDate) {
          const iso = `${refreshDate.getFullYear()}-${String(refreshDate.getMonth() + 1).padStart(2, '0')}-${String(refreshDate.getDate()).padStart(2, '0')}`;
          this.loadDay(iso);
        }
        this.loadMonth(refreshDate.getFullYear(), refreshDate.getMonth() + 1);
        alert('La cita se creó correctamente y quedó vinculada a la cotización aceptada.');
      },
      error: (err) => {
        this.creatingAppointment = false;
        console.error('[AGENDA] Error creando cita desde cotización', err);
        alert(err?.error?.error || 'No pudimos agendar la cita. Por favor intenta nuevamente.');
      }
    });
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
      clientId: String(a.client_id),
      clientName: a.client_name || '',
      clientAvatarUrl: ((a as any).client_avatar_url || null) as string | null,
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
      clientRegion: ((a as any).client_region ?? null) as string | null,
      clientReviewId: (a as any).client_review_id !== undefined && (a as any).client_review_id !== null
        ? Number((a as any).client_review_id)
        : null,
      canReviewClient: String(a.status) === 'completed' && !(a as any).client_review_id
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

  private getEnv(key: string, fallback: string): string {
    const raw = (environment as any)?.[key];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw;
    }
    return fallback;
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

  private formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const base = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = base.split('-').map(Number);
    if (!y || !m || !d) return '';
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  private formatTimeLabel(hhmm: string): string {
    if (!hhmm) return '';
    const parts = hhmm.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return hhmm;
  }

  private capitalize(value: string): string {
    if (!value) {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatExceptionDate(value: string): string {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return value;
    }
  }

  // Handlers de configuración de horarios (usados por el template)
  onAddTimeBlock(timeBlock: Omit<TimeBlock, 'id'>) {
    const dayEnum = this.dayLabelToEnum[timeBlock.day];
    if (!dayEnum) {
      console.warn('[AGENDA] Día inválido al crear bloque', timeBlock.day);
      return;
    }
    this.availabilityLoading = true;
    this.availabilityService.createWeekly(dayEnum as any, timeBlock.startTime, timeBlock.endTime, timeBlock.enabled).subscribe({
      next: () => {
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Horario actualizado',
            message: `Se agregó un bloque ${timeBlock.day} ${timeBlock.startTime} - ${timeBlock.endTime}`,
            priority: 'medium'
          });
        } catch {}
        this.loadWeeklyAvailability();
      },
      error: (err) => {
        console.error('[AGENDA] Error creando bloque de horario', err);
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Error al crear horario',
            message: 'No pudimos guardar el nuevo bloque. Intenta nuevamente.',
            priority: 'high'
          });
        } catch {}
        this.availabilityLoading = false;
      }
    });
  }

  onRemoveTimeBlock(blockId: string) {
    const numericId = Number(blockId);
    if (!Number.isFinite(numericId)) {
      return;
    }
    if (!this.weeklyBlockIndex.has(numericId)) {
      console.warn('[AGENDA] Bloque no encontrado en el índice local al eliminar:', blockId);
      return;
    }
    this.availabilityLoading = true;
    this.availabilityService.deleteWeekly(numericId).subscribe({
      next: () => {
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Bloque eliminado',
            message: 'El bloque de horario fue eliminado correctamente.',
            priority: 'medium'
          });
        } catch {}
        this.loadWeeklyAvailability();
      },
      error: (err) => {
        console.error('[AGENDA] Error eliminando bloque de horario', err);
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Error al eliminar',
            message: 'No pudimos eliminar el bloque. Vuelve a intentarlo.',
            priority: 'high'
          });
        } catch {}
        this.availabilityLoading = false;
      }
    });
  }

  onUpdateTimeBlock(updatedBlock: TimeBlock) {
    const numericId = Number(updatedBlock.id);
    if (!Number.isFinite(numericId)) {
      return;
    }
    if (!this.weeklyBlockIndex.has(numericId)) {
      console.warn('[AGENDA] Bloque no encontrado en el índice local al actualizar:', updatedBlock);
      return;
    }
    this.availabilityLoading = true;
    this.availabilityService.updateWeekly(numericId, { is_active: updatedBlock.enabled }).subscribe({
      next: () => {
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Horario actualizado',
            message: `Actualizaste el bloque ${updatedBlock.day} ${updatedBlock.startTime} - ${updatedBlock.endTime}`,
            priority: 'medium'
          });
        } catch {}
        this.loadWeeklyAvailability();
      },
      error: (err) => {
        console.error('[AGENDA] Error actualizando bloque de horario', err);
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Error al actualizar',
            message: 'Tus cambios no se guardaron. Intenta de nuevo.',
            priority: 'high'
          });
        } catch {}
        this.availabilityLoading = false;
      }
    });
  }

  async onSaveSchedule() {
    this.loading = true;
    try {
      const resp = await firstValueFrom(this.availabilityService.getWeekly());
      const existing = Array.isArray(resp?.blocks) ? resp.blocks : [];
      const existingMap = new Map<string, any>();
      const key = (day: string, start: string, end: string) => `${day}|${start}|${end}`;

      existing.forEach((block: any) => {
        const dayEnum = String(block.day_of_week || '').toLowerCase();
        const start = String(block.start_time || '').slice(0, 5);
        const end = String(block.end_time || '').slice(0, 5);
        existingMap.set(key(dayEnum, start, end), block);
      });

      const tasks: Array<Promise<any>> = [];

      this.timeBlocks.forEach(tb => {
        const dayEnum = this.dayLabelToEnum[tb.day];
        if (!dayEnum) {
          return;
        }
        const k = key(dayEnum, tb.startTime, tb.endTime);
        const found = existingMap.get(k);
        if (found) {
          tasks.push(firstValueFrom(this.availabilityService.updateWeekly(found.id, {
            is_active: tb.enabled
          })));
          existingMap.delete(k);
        } else {
          tasks.push(firstValueFrom(this.availabilityService.createWeekly(
            dayEnum as any,
            tb.startTime,
            tb.endTime,
            tb.enabled
          )));
        }
      });

      existingMap.forEach((block) => {
        tasks.push(firstValueFrom(this.availabilityService.deleteWeekly(block.id)));
      });

      if (tasks.length) {
        await Promise.allSettled(tasks);
      }

      try {
        this.notifications.setUserProfile('provider');
        this.notifications.createNotification({
          type: 'availability',
          profile: 'provider',
          title: 'Horario sincronizado',
          message: 'Tus horarios quedaron actualizados.',
          priority: 'medium'
        });
      } catch {}
      this.loadWeeklyAvailability();
    } catch (err) {
      console.error('[AGENDA] Error al guardar horario semanal', err);
      try {
        this.notifications.setUserProfile('provider');
        this.notifications.createNotification({
          type: 'availability',
          profile: 'provider',
          title: 'Error al guardar horario',
          message: 'No se pudo guardar tu horario. Intenta de nuevo.',
          priority: 'high'
        });
      } catch {}
    } finally {
      this.loading = false;
    }
  }

  onAddException(data: { date: string; reason?: string }) {
    if (!data?.date) {
      return;
    }
    this.exceptionsLoading = true;
    this.availabilityService.createException(data.date, false, undefined, undefined, data.reason).subscribe({
      next: () => {
        try {
          this.notifications.setUserProfile('provider');
          const label = this.formatExceptionDate(data.date);
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Fecha bloqueada',
            message: `Bloqueaste el ${label || data.date}.`,
            priority: 'medium'
          });
        } catch {}
        this.loadExceptions();
      },
      error: (err) => {
        console.error('[AGENDA] Error creando excepción de disponibilidad', err);
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Error al bloquear fecha',
            message: 'No pudimos registrar la excepción. Intenta nuevamente.',
            priority: 'high'
          });
        } catch {}
        this.exceptionsLoading = false;
      }
    });
  }

  onRemoveException(exceptionId: string) {
    const numericId = Number(exceptionId);
    if (!Number.isFinite(numericId)) {
      return;
    }
    this.exceptionsLoading = true;
    this.availabilityService.deleteException(numericId).subscribe({
      next: () => {
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Excepción eliminada',
            message: 'La fecha bloqueada fue eliminada.',
            priority: 'medium'
          });
        } catch {}
        this.loadExceptions();
      },
      error: (err) => {
        console.error('[AGENDA] Error eliminando excepción de disponibilidad', err);
        try {
          this.notifications.setUserProfile('provider');
          this.notifications.createNotification({
            type: 'availability',
            profile: 'provider',
            title: 'Error al eliminar fecha',
            message: 'No se pudo eliminar la excepción.',
            priority: 'high'
          });
        } catch {}
        this.exceptionsLoading = false;
      }
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
    if (view === 'dashboard') {
      this.loadRescheduleRequests();
    }
    if (view === 'calendar' && this.selectedDate) {
      this.loadMonth(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1);
    }
    if (view === 'cash') {
      this.loadCashSummary();
      this.loadCashCommissions(this.cashTableFilter);
    }
  }

  private formatDueDateLabel(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(date.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Vencido hoy';
    } else if (diffDays === 1) {
      return 'Vencido mañana';
    } else if (diffDays < 7) {
      return `Vencido en ${diffDays} días`;
    } else {
      return `Vencido el ${date.toLocaleDateString('es-CL', { month: 'numeric', day: 'numeric' })}`;
    }
  }
}


