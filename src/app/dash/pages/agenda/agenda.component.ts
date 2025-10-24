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
  paidAwaitingAppointments: Array<{ id: number; client_name?: string; service_name?: string; date: string; start_time: string; amount?: number }>=[];
  // Estado modal verificación
  isVerificationModalOpen: boolean = false;
  selectedPaidAppointment: { id: number; client_name?: string; service_name?: string; date: string; start_time: string; amount?: number } | null = null;
  verificationError: string = '';
  remainingAttempts: number = 3;
  verifying: boolean = false;
  
  // 🔔 Contador de citas programadas (scheduled) pendientes de confirmar
  scheduledAppointmentsCount: number = 0;

  private appointments = inject(AppointmentsService);
  private payments = inject(PaymentsService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private currentProviderId: number | null = null;

  // Datos del gráfico
  chartData: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension: number; }[] } | null = null;

  // Datos mock para prototipo de comisiones cash (se reemplazará con API)
  cashDebts: Array<{ time: string; client: string; date: string; commission: number; dueDate: string; status: 'pending'|'overdue'|'paid' }>= [
    { time: '10:00 AM', client: 'Juan Pérez',   date: '2025-10-24', commission: 3000, dueDate: '2025-10-27', status: 'pending' },
    { time: '14:00 PM', client: 'Carlos Ruiz',  date: '2025-10-21', commission: 1500, dueDate: '2025-10-24', status: 'overdue' },
    { time: '11:00 AM', client: 'Sofía Mena',   date: '2025-10-18', commission: 2500, dueDate: '2025-10-21', status: 'paid' }
  ];

  get cashTotal(): number {
    return this.cashDebts.reduce((sum, d) => sum + (d.status !== 'paid' ? d.commission : 0), 0);
  }
  get cashOverdueTotal(): number {
    return this.cashDebts.reduce((sum, d) => sum + (d.status === 'overdue' ? d.commission : 0), 0);
  }

  constructor(private availabilityService: ProviderAvailabilityService) {}

  ngOnInit() {
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
        const msg = `Tienes una nueva cita${who} el ${a.date} a las ${a.start_time.slice(0,5)}`;
        this.notifications.setUserProfile('provider');
        this.notifications.createNotification({
          type: 'appointment',
          profile: 'provider',
          title,
          message: msg,
          priority: 'high',
          actions: ['view'],
          metadata: { appointmentId: String(a.id), clientName: (a as any).client_name }
        });
      } catch {}
    });
    this.appointments.onAppointmentUpdated().subscribe((a: AppointmentDto) => this.onRealtimeUpsert(a));
    this.appointments.onAppointmentDeleted().subscribe((p: { id: number }) => this.onRealtimeDelete(p.id));
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
            amount: a.amount
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

  openVerifyModal(appt: { id: number; client_name?: string; service_name?: string; date: string; start_time: string; amount?: number }) {
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
    this.appointments.verifyCompletion(this.selectedPaidAppointment.id, code).subscribe({
      next: (resp: any) => {
        this.verifying = false;
        if (resp?.success) {
          // Quitar de la lista local y cerrar modal
          this.paidAwaitingAppointments = this.paidAwaitingAppointments.filter(p => p.id !== this.selectedPaidAppointment!.id);
          const idx = this.dashboardMetrics.findIndex(m => m.label === 'Citas por Pagar (esperan código)');
          if (idx >= 0) this.dashboardMetrics[idx] = { ...this.dashboardMetrics[idx], value: this.paidAwaitingAppointments.length };
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
    // Optimistic UI: marcar como confirmada de inmediato
    const index = this.dayAppointments.findIndex(a => Number(a.id) === Number(appointmentId));
    const prev = index >= 0 ? { ...this.dayAppointments[index] } : null;
    if (index >= 0) {
      this.dayAppointments[index] = { ...this.dayAppointments[index], status: 'confirmed' as any };
    }

    this.appointments.updateStatus(appointmentId, 'confirmed' as any).subscribe({
      next: (resp) => {
        if (resp?.success && (resp as any).appointment) {
          // Sincronizar con payload real del backend (también llegará por socket)
          this.onRealtimeUpsert((resp as any).appointment);
        } else if (prev && index >= 0) {
          // Revertir si no fue exitoso
          this.dayAppointments[index] = prev;
        }
      },
      error: (err) => {
        console.error('Error confirmando cita', err);
        if (prev && index >= 0) this.dayAppointments[index] = prev;
      }
    });
  }

  onNewAppointmentForDay(date: Date) {
    console.log('Nueva cita para:', date);
    // El modal se maneja dentro de DayDetail; aquí solo respondemos al evento de creación
  }

  onDeleteAppointment(id: number) {
    // Cambiar a cancelación de cita (no borrado definitivo)
    const idx = this.dayAppointments.findIndex(a => Number(a.id) === Number(id));
    const prev = idx >= 0 ? { ...this.dayAppointments[idx] } : null;
    if (idx >= 0) {
      this.dayAppointments[idx] = { ...this.dayAppointments[idx], status: 'cancelled' as any };
    }

    this.appointments.updateStatus(id, 'cancelled' as any).subscribe({
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

  // Cobro en efectivo
  onCobrarEnEfectivo(id: string) {
    const apptId = Number(id);
    if (!apptId) return;
    if (!confirm('¿Confirmas registrar el cobro en efectivo de esta cita?')) return;
    this.loading = true;
    this.payments.collectCash(apptId).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp?.success) {
          // Refrescar día y panel
          if (this.selectedDate) {
            const iso = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
            this.loadDay(iso);
          }
          this.loadPaidAwaiting();
          alert('✅ Cobro en efectivo registrado.');
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
    // Por ahora creamos una cita simple con status scheduled. El cliente lo define el flujo B2C, así que se omite aquí
    // Se asume que el provider está autenticado; el cliente_id no aplica aquí, por lo que esta acción es placeholder hasta definir UX
    console.log('[AGENDA] citaCreated (UI only placeholder):', evt);
    // Siguiente iteración: abrir selector de cliente y llamar AppointmentsService.create
  }
  
  /**
   * Evento desde DayDetail al bloquear un espacio
   */
  onEspacioBloqueado(evt: { date: string; startTime?: string; endTime?: string; reason: string; blockWholeDay: boolean }): void {
    console.log('🔒 [AGENDA] ==================== BLOQUEANDO ESPACIO ====================');
    console.log('🔒 [AGENDA] Datos:', evt);
    
    this.loading = true;
    
    this.availabilityService.createException(
      evt.date,
      false, // is_available = false (es un bloqueo)
      evt.startTime,
      evt.endTime,
      evt.reason
    ).subscribe({
      next: (resp) => {
        console.log('🔒 [AGENDA] ✅ Espacio bloqueado exitosamente:', resp);
        this.loading = false;
        
        // Recargar el mes actual para reflejar el bloqueo
        if (this.selectedDate) {
          this.loadMonth(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1);
        }
        
        // Mostrar notificación
        this.notifications.createNotification({
          type: 'availability',
          profile: 'provider',
          title: '✅ Espacio bloqueado',
          message: evt.blockWholeDay 
            ? `Todo el día ${evt.date} ha sido bloqueado`
            : `Horario ${evt.startTime}-${evt.endTime} bloqueado para el ${evt.date}`,
          priority: 'medium',
          actions: []
        });
      },
      error: (err) => {
        console.error('🔴 [AGENDA] Error bloqueando espacio:', err);
        this.loading = false;
        alert('Error al bloquear el espacio. Intenta de nuevo.');
      }
    });
  }

  // Event handlers de configuración de horarios
  onAddTimeBlock(timeBlock: Omit<TimeBlock, 'id'>) {
    const newTimeBlock: TimeBlock = {
      ...timeBlock,
      id: Date.now().toString()
    };
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
    // 1) Cargar bloques actuales desde backend para saber ids reales
    this.availabilityService.getWeekly().subscribe({
      next: (resp) => {
        const existing = resp.blocks || [];
        const dayNameToEnum: Record<string, any> = {
          'Lunes': 'monday', 'Martes': 'tuesday', 'Miércoles': 'wednesday', 'Jueves': 'thursday', 'Viernes': 'friday', 'Sábado': 'saturday', 'Domingo': 'sunday'
        };

        // 2) Sincronizar: por cada bloque en UI, crear/actualizar; eliminar los que ya no existan y sí existen en backend
        const tasks: Array<Promise<any>> = [];

        // Mapear existentes por (day,start,end)
        const key = (d: any) => `${d.day_of_week}|${String(d.start_time).slice(0,5)}|${String(d.end_time).slice(0,5)}`;
        const existingMap = new Map(existing.map(b => [key(b), b]));

        // Crear/actualizar
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

        // Eliminar los restantes en existingMap (ya no están en UI)
        existingMap.forEach((b) => {
          tasks.push(this.availabilityService.deleteWeekly(b.id).toPromise());
        });

        return Promise.allSettled(tasks).then(() => {
          this.loading = false;
          console.log('Horario guardado');
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // Navegación
  setView(view: 'dashboard' | 'calendar' | 'cash' | 'config') {
    this.currentView = view;
    // Al cambiar a calendario, recargar mes actual para asegurar datos frescos
    if (view === 'calendar' && this.selectedDate) {
      this.loadMonth(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1);
    }
  }

  // Cargar citas del mes
  private loadMonth(year: number, month: number) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    this.loading = true;
    this.appointments.listByMonth(monthStr).subscribe({
      next: (resp: { success: boolean; appointments: AppointmentDto[] }) => {
        const apps = (resp.appointments || []) as AppointmentDto[];
        console.log(`[AGENDA] Loading month ${monthStr}: ${apps.length} appointments`, apps);
        
        // 🔔 Contar citas programadas (scheduled) pendientes de confirmar
        const scheduledCount = apps.filter(a => a.status === 'scheduled').length;
        this.scheduledAppointmentsCount = scheduledCount;
        console.log(`🔔 [AGENDA] Citas programadas (scheduled) pendientes: ${scheduledCount}`);
        
        this.calendarEvents = apps.map(a => this.mapAppointmentToEvent(a));
        console.log('[AGENDA] Calendar events generated:', this.calendarEvents);

        // 🔔 Contar "citas por pagar (esperan código)": pagadas pero no completadas
        // Actualizar panel de pagadas pendientes (desde endpoint dedicado)
        this.loadPaidAwaiting();
        
        // Debug: verificar eventos para el día 20
        const day20Events = this.calendarEvents.filter(e => e.date.getDate() === 20);
        console.log('[AGENDA] Events for day 20:', day20Events);
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
        this.dayAppointments = apps.map(a => this.mapAppointmentToDay(a));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
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
      clientPhone: '',
      status: a.status as any,
      paymentStatus: (a.payment_status === 'completed' || a.payment_status === 'paid' || a.payment_status === 'succeeded') ? 'paid' : 'unpaid',
      type: 'appointment',
      notes: a.notes || ''
    };
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
      
      // 🔔 Recalcular contador de citas programadas
      this.updateScheduledCount();
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
  
  /**
   * 🔔 Actualizar contador de citas programadas pendientes
   */
  private updateScheduledCount(): void {
    const scheduledCount = this.calendarEvents.filter(e => e.status === 'scheduled').length;
    this.scheduledAppointmentsCount = scheduledCount;
    console.log(`🔔 [AGENDA] Contador actualizado: ${scheduledCount} citas programadas`);
  }

  private onRealtimeDelete(id: number) {
    console.log('🔔 [AGENDA] Eliminando cita:', id);
    this.calendarEvents = this.calendarEvents.filter(e => e.id !== String(id));
    this.dayAppointments = this.dayAppointments.filter(d => d.id !== String(id));
    
    // 🔔 Recalcular contador
    this.updateScheduledCount();
  }
}
