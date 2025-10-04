import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InicioHeaderComponent, HeaderData } from '../../../../libs/shared-ui/inicio-header/inicio-header.component';
import { InicioProximaCitaComponent, ProximaCitaData } from '../../../../libs/shared-ui/inicio-proxima-cita/inicio-proxima-cita.component';
import { InicioIngresosMesComponent, IngresosData } from '../../../../libs/shared-ui/inicio-ingresos-mes/inicio-ingresos-mes.component';
import { InicioIngresosDiaComponent, IngresosDiaData } from '../../../../libs/shared-ui/inicio-ingresos-dia/inicio-ingresos-dia.component';
import { InicioSolicitudesComponent, SolicitudData } from '../../../../libs/shared-ui/inicio-solicitudes/inicio-solicitudes.component';
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
  // Estado online/offline
  isOnline: boolean = true;

  // Datos para el header
  headerData: HeaderData = {
    userName: 'Elena',
    hasNotifications: true
  };

  // Datos para la próxima cita
  proximaCitaData: ProximaCitaData = {
    time: '10:00',
    meridiem: 'AM',
    service: 'Corte de Pelo',
    clientName: 'Carlos Rojas'
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
    time: '18:00 PM'
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
    // TODO: Navegar al perfil público
  }


  onViewDetailsClick(data: ProximaCitaData) {
    console.log('Ver detalles de cita:', data);
    // TODO: Implementar modal de detalles
  }

  onViewReportClick(data: IngresosData) {
    console.log('Ver reporte completo:', data);
    // TODO: Navegar al reporte completo
  }

  onViewDayReportClick(data: IngresosDiaData) {
    console.log('Ver reporte del día:', data);
    // TODO: Navegar al reporte del día
  }

  onAcceptClick(data: SolicitudData) {
    console.log('Aceptar solicitud:', data);
    // TODO: Implementar lógica de aceptación
  }

  onDeclineClick(data: SolicitudData) {
    console.log('Rechazar solicitud:', data);
    // TODO: Implementar lógica de rechazo
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
