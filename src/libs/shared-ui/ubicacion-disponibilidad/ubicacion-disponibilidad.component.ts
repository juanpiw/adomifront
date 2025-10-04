import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CoverageZone {
  id: string;
  name: string;
}

export interface LocationSettings {
  availableForNewBookings: boolean;
  shareRealTimeLocation: boolean;
  coverageZones: CoverageZone[];
}

@Component({
  selector: 'app-ubicacion-disponibilidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ubicacion-disponibilidad.component.html',
  styleUrls: ['./ubicacion-disponibilidad.component.scss']
})
export class UbicacionDisponibilidadComponent {
  @Input() settings: LocationSettings = {
    availableForNewBookings: true,
    shareRealTimeLocation: false,
    coverageZones: [
      { id: '1', name: 'Providencia' },
      { id: '2', name: 'Las Condes' },
      { id: '3', name: 'Ñuñoa' }
    ]
  };

  @Output() settingsChange = new EventEmitter<LocationSettings>();
  @Output() addCoverageZone = new EventEmitter<string>();
  @Output() removeCoverageZone = new EventEmitter<string>();

  onToggleNewBookings() {
    this.settings = {
      ...this.settings,
      availableForNewBookings: !this.settings.availableForNewBookings
    };
    this.settingsChange.emit(this.settings);
  }

  onToggleRealTimeLocation() {
    this.settings = {
      ...this.settings,
      shareRealTimeLocation: !this.settings.shareRealTimeLocation
    };
    this.settingsChange.emit(this.settings);
  }

  onRemoveZone(zoneId: string) {
    this.removeCoverageZone.emit(zoneId);
  }

  onAddZone() {
    const zoneName = prompt('Ingresa el nombre de la nueva zona:');
    if (zoneName && zoneName.trim()) {
      this.addCoverageZone.emit(zoneName.trim());
    }
  }
}
