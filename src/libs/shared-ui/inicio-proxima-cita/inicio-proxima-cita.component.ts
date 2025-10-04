import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProximaCitaData {
  time: string;
  meridiem: string;
  service: string;
  clientName: string;
}

@Component({
  selector: 'app-inicio-proxima-cita',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-proxima-cita.component.html',
  styleUrls: ['./inicio-proxima-cita.component.scss']
})
export class InicioProximaCitaComponent {
  @Input() data: ProximaCitaData = {
    time: '10:00',
    meridiem: 'AM',
    service: 'Corte de Pelo',
    clientName: 'Carlos Rojas'
  };

  @Output() viewDetailsClick = new EventEmitter<ProximaCitaData>();

  onViewDetailsClick() {
    this.viewDetailsClick.emit(this.data);
  }
}
