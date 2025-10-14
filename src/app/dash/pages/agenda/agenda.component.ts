import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardResumenComponent, DashboardMetric } from '../../../../libs/shared-ui/dashboard-resumen/dashboard-resumen.component';
import { CalendarMensualComponent, CalendarEvent } from '../../../../libs/shared-ui/calendar-mensual/calendar-mensual.component';
import { DayDetailComponent, DayAppointment } from '../../../../libs/shared-ui/day-detail/day-detail.component';
import { DashboardGraficoComponent } from '../../../../libs/shared-ui/dashboard-grafico/dashboard-grafico.component';
import { HorariosConfigComponent, TimeBlock } from '../../../../libs/shared-ui/horarios-config/horarios-config.component';
import { ProviderAvailabilityService } from '../../../services/provider-availability.service';

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
  calendarEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Corte de Cabello',
      date: new Date(2025, 9, 15), // Octubre 15, 2025
      time: '10:00',
      type: 'appointment'
    },
    {
      id: '2',
      title: 'Manicura',
      date: new Date(2025, 9, 15),
      time: '14:00',
      type: 'appointment'
    },
    {
      id: '3',
      title: 'Descanso',
      date: new Date(2025, 9, 16),
      time: '12:00',
      type: 'break'
    }
  ];

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

  constructor(private availabilityService: ProviderAvailabilityService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // TODO: Cargar datos reales desde el backend
    console.log('Cargando datos del dashboard...');
  }

  // Event handlers del calendario
  onDateSelected(date: Date) {
    this.selectedDate = date;
    this.loadDayAppointments(date);
  }

  onNewAppointment() {
    console.log('Crear nueva cita');
    // TODO: Abrir modal de nueva cita
  }

  onPreviousMonth() {
    console.log('Mes anterior');
  }

  onNextMonth() {
    console.log('Mes siguiente');
  }

  // Event handlers del día
  onAppointmentClick(appointment: DayAppointment) {
    console.log('Cita seleccionada:', appointment);
    // TODO: Abrir modal de detalles de cita
  }

  onNewAppointmentForDay(date: Date) {
    console.log('Nueva cita para:', date);
    // TODO: Abrir modal de nueva cita con fecha preseleccionada
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

  // Cargar citas del día
  private loadDayAppointments(date: Date) {
    // TODO: Cargar citas reales desde el backend
    this.dayAppointments = this.calendarEvents
      .filter(event => 
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
      )
      .map(event => ({
        id: event.id,
        title: event.title,
        time: event.time,
        duration: 60,
        clientName: 'Cliente Ejemplo',
        clientPhone: '+56 9 1234 5678',
        status: 'scheduled' as const,
        type: event.type,
        notes: 'Notas de la cita'
      }));
  }
}
