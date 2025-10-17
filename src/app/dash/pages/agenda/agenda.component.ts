import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardResumenComponent, DashboardMetric } from '../../../../libs/shared-ui/dashboard-resumen/dashboard-resumen.component';
import { CalendarMensualComponent, CalendarEvent } from '../../../../libs/shared-ui/calendar-mensual/calendar-mensual.component';
import { DayDetailComponent, DayAppointment } from '../../../../libs/shared-ui/day-detail/day-detail.component';
import { DashboardGraficoComponent } from '../../../../libs/shared-ui/dashboard-grafico/dashboard-grafico.component';
import { HorariosConfigComponent, TimeBlock } from '../../../../libs/shared-ui/horarios-config/horarios-config.component';
import { ProviderAvailabilityService } from '../../../services/provider-availability.service';
import { AppointmentsService, AppointmentDto } from '../../../services/appointments.service';

@Component({
  selector: 'app-d-agenda',
  standalone: true,
  imports: [
    CommonModule,
    DashboardResumenComponent,
    CalendarMensualComponent,
    DayDetailComponent,
    DashboardGraficoComponent,
    HorariosConfigComponent
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
  currentView: 'dashboard' | 'calendar' | 'config' = 'dashboard';

  private appointments = inject(AppointmentsService);

  constructor(private availabilityService: ProviderAvailabilityService) {}

  ngOnInit() {
    this.loadDashboardData();
    // Cargar mes actual
    const today = new Date();
    // Preseleccionar el día de hoy para mostrar citas sin click
    this.selectedDate = today;
    this.loadMonth(today.getFullYear(), today.getMonth() + 1);
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.loadDay(iso);
    // Realtime updates
    this.appointments.connectSocket();
    this.appointments.onAppointmentCreated().subscribe((a: AppointmentDto) => this.onRealtimeUpsert(a));
    this.appointments.onAppointmentUpdated().subscribe((a: AppointmentDto) => this.onRealtimeUpsert(a));
    this.appointments.onAppointmentDeleted().subscribe((p: { id: number }) => this.onRealtimeDelete(p.id));
  }

  private loadDashboardData() {
    // TODO: Cargar datos reales desde el backend
    console.log('Cargando datos del dashboard...');
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

  onNewAppointmentForDay(date: Date) {
    console.log('Nueva cita para:', date);
    // El modal se maneja dentro de DayDetail; aquí solo respondemos al evento de creación
  }

  // Evento desde DayDetail al confirmar nueva cita en el modal
  onDayCitaCreated(evt: { title: string; client?: string; date: string; startTime: string; endTime: string; notes?: string; color: string }) {
    // Por ahora creamos una cita simple con status scheduled. El cliente lo define el flujo B2C, así que se omite aquí
    // Se asume que el provider está autenticado; el cliente_id no aplica aquí, por lo que esta acción es placeholder hasta definir UX
    console.log('[AGENDA] citaCreated (UI only placeholder):', evt);
    // Siguiente iteración: abrir selector de cliente y llamar AppointmentsService.create
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
  setView(view: 'dashboard' | 'calendar' | 'config') {
    this.currentView = view;
  }

  // Cargar citas del mes
  private loadMonth(year: number, month: number) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    this.loading = true;
    this.appointments.listByMonth(monthStr).subscribe({
      next: (resp: { success: boolean; appointments: AppointmentDto[] }) => {
        const apps = (resp.appointments || []) as AppointmentDto[];
        this.calendarEvents = apps.map(a => this.mapAppointmentToEvent(a));
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
    // Convertir YYYY-MM-DD a Date
    const [y, m, d] = a.date.split('-').map(Number);
    return {
      id: String(a.id),
      title: 'Cita',
      date: new Date(y, m - 1, d),
      time: a.start_time.slice(0, 5),
      type: 'appointment'
    };
  }

  private mapAppointmentToDay(a: AppointmentDto & { client_name?: string }): DayAppointment {
    return {
      id: String(a.id),
      title: a.client_name ? `Cita con ${a.client_name}` : 'Cita',
      time: a.start_time.slice(0, 5),
      duration: this.diffMinutes(a.start_time, a.end_time),
      clientName: a.client_name || '',
      clientPhone: '',
      status: a.status as any,
      type: 'appointment',
      notes: a.notes || ''
    };
  }

  private diffMinutes(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }

  private onRealtimeUpsert(a: AppointmentDto) {
    // Si el evento pertenece al mes seleccionado, actualizar calendario
    const [y, m] = a.date.split('-').map(Number);
    const current = this.selectedDate || new Date();
    if (current.getFullYear() === y && (current.getMonth() + 1) === m) {
      // Reemplazar/insertar en calendarEvents
      const ev = this.mapAppointmentToEvent(a);
      const idx = this.calendarEvents.findIndex(e => e.id === String(a.id));
      if (idx >= 0) this.calendarEvents[idx] = ev; else this.calendarEvents.push(ev);
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
    this.calendarEvents = this.calendarEvents.filter(e => e.id !== String(id));
    this.dayAppointments = this.dayAppointments.filter(d => d.id !== String(id));
  }
}
