import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SolicitudData {
  id: string;
  clientName: string;
  clientAvatar: string;
  service: string;
  when: string;
  time: string;
}

@Component({
  selector: 'app-inicio-solicitudes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-solicitudes.component.html',
  styleUrls: ['./inicio-solicitudes.component.scss']
})
export class InicioSolicitudesComponent {
  @Input() data: SolicitudData = {
    id: '1',
    clientName: 'Marcos Reyes',
    clientAvatar: 'https://placehold.co/48x48/FDE68A/4B5563?text=MR',
    service: 'Maquillaje Profesional',
    when: 'Mañana',
    time: '18:00 PM'
  };

  @Output() acceptClick = new EventEmitter<SolicitudData>();
  @Output() declineClick = new EventEmitter<SolicitudData>();

  onAcceptClick() {
    this.acceptClick.emit(this.data);
  }

  onDeclineClick() {
    this.declineClick.emit(this.data);
  }
}
