import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { InicioGestionDisponibilidadComponent, GestionDisponibilidadData } from '../../../../libs/shared-ui/inicio-gestion-disponibilidad/inicio-gestion-disponibilidad.component';
import { OnlineStatusSwitchComponent } from '../../../../libs/shared-ui/online-status-switch/online-status-switch.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ProviderProfileService } from '../../../services/provider-profile.service';
import { AppointmentsService } from '../../../services/appointments.service';
import { PaymentsService } from '../../../services/payments.service';

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
    InicioGestionDisponibilidadComponent,
    OnlineStatusSwitchComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class DashHomeComponent implements OnInit {
  private auth = inject(AuthService);
  private providerProfile = inject(ProviderProfileService);
  private appointmentsService = inject(AppointmentsService);
  private paymentsService = inject(PaymentsService);
  
  constructor(private router: Router) {}
  
  // Estado online/offline
  isOnline: boolean = true;

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
    console.log('[DASH_HOME] Cargando solicitudes pendientes...');
    this.appointmentsService.listPendingRequests().subscribe({
      next: (response) => {
        console.log('[DASH_HOME] Solicitudes pendientes recibidas:', response);
        if (response.success && response.appointments) {
          this.solicitudesData = response.appointments.map((appt: any) => ({
            id: String(appt.id),
            clientName: appt.client_name || 'Cliente',
            clientAvatar: 'https://placehold.co/48x48/FDE68A/4B5563?text=' + (appt.client_name || 'C').charAt(0),
            service: appt.service_name || 'Servicio',
            when: this.formatWhen(appt.date),
            time: this.formatTime(appt.start_time),
            date: appt.date,
            location: 'Ubicación por confirmar',
            estimatedIncome: appt.scheduled_price || 0
          }));
          console.log('[DASH_HOME] Solicitudes mapeadas:', this.solicitudesData);
        } else {
          this.solicitudesData = [];
          console.log('[DASH_HOME] No hay solicitudes pendientes');
        }
      },
      error: (error) => {
        console.error('[DASH_HOME] Error cargando solicitudes pendientes:', error);
        this.solicitudesData = [];
      }
    });
  }

  private loadNextAppointment() {
    console.log('[DASH_HOME] Cargando próxima cita...');
    this.appointmentsService.getNextAppointment().subscribe({
      next: (response) => {
        console.log('[DASH_HOME] Próxima cita recibida:', response);
        if (response.success && response.appointment) {
          const appt = response.appointment;
          this.proximaCitaData = {
            id: String(appt.id),
            time: this.formatTime(appt.start_time),
            meridiem: this.getMeridiem(appt.start_time),
            service: appt.service_name || 'Servicio',
            clientName: appt.client_name || 'Cliente',
            date: appt.date,
            duration: '45 minutos', // TODO: calcular desde start_time y end_time
            amount: appt.scheduled_price || 0,
            clientAvatar: 'https://placehold.co/40x40/E0E7FF/4338CA?text=' + (appt.client_name || 'C').charAt(0),
            location: 'Ubicación por confirmar',
            mapUrl: 'https://maps.google.com/?q=Ubicacion'
          };
          console.log('[DASH_HOME] Próxima cita mapeada:', this.proximaCitaData);
        } else {
          this.proximaCitaData = null;
          console.log('[DASH_HOME] No hay próxima cita');
        }
      },
      error: (error) => {
        console.error('[DASH_HOME] Error cargando próxima cita:', error);
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
        if (response.success && response.data) {
          const earnings = response.data;
          this.ingresosData = {
            amount: `$${(earnings.releasable || 0).toLocaleString('es-CL')}`,
            completedAppointments: earnings.completed_appointments || 0,
            averageRating: earnings.average_rating || 0,
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
        if (response.success && response.data) {
          const earnings = response.data;
          this.ingresosDiaData = {
            amount: `$${(earnings.today_earnings || 0).toLocaleString('es-CL')}`,
            completedAppointments: earnings.today_appointments || 0,
            averageRating: earnings.average_rating || 0,
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

  // Datos para gestión de disponibilidad
  gestionData: GestionDisponibilidadData = {
    timeBlocks: [
      { id: '1', day: 'Lunes y Jueves', startTime: '15:00', endTime: '16:30', status: 'confirmed' },
      { id: '2', day: 'Miércoles', startTime: '09:00', endTime: '11:00', status: 'confirmed' }
    ]
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
    this.gestionData.timeBlocks.push(newBlock);
    console.log('Bloque de tiempo agregado:', newBlock);
  }

  onRemoveTimeBlock(blockId: string) {
    this.gestionData.timeBlocks = this.gestionData.timeBlocks.filter(block => block.id !== blockId);
    console.log('Bloque de tiempo eliminado:', blockId);
  }

  onStatusChange(isOnline: boolean) {
    this.isOnline = isOnline;
    console.log('Estado cambiado a:', isOnline ? 'Online' : 'Offline');
    // TODO: Implementar lógica para actualizar estado en el backend
  }
}
