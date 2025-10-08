import { Component } from '@angular/core';
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
export class DashHomeComponent {
  constructor(private router: Router) {}
  // Estado online/offline
  isOnline: boolean = true;

  // Datos para el header
  headerData: HeaderData = {
    userName: 'Elena',
    hasNotifications: true
  };

  // Datos para la próxima cita
  proximaCitaData: ProximaCitaData = {
    id: '1',
    time: '10:00',
    meridiem: 'AM',
    service: 'Corte de Pelo',
    clientName: 'Carlos Rojas',
    date: '2025-10-10',
    duration: '45 minutos',
    amount: 15000,
    clientAvatar: 'https://placehold.co/40x40/E0E7FF/4338CA?text=CR',
    location: 'Av. Providencia 123, Depto 45, Santiago',
    mapUrl: 'https://maps.google.com/?q=Av.+Providencia+123,+Santiago'
  };

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

  // Datos para solicitudes
  solicitudData: SolicitudData = {
    id: '1',
    clientName: 'Marcos Reyes',
    clientAvatar: 'https://placehold.co/48x48/FDE68A/4B5563?text=MR',
    service: 'Maquillaje Profesional',
    when: 'Mañana',
    time: '18:00 PM',
    date: '2025-10-11',
    location: 'Av. Providencia 123, Depto 45, Santiago',
    estimatedIncome: 45000
  };

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
