import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChileLocationsService, Region } from '../../../app/services/chile-locations.service';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './ubicacion-disponibilidad.component.html',
  styleUrls: ['./ubicacion-disponibilidad.component.scss']
})
export class UbicacionDisponibilidadComponent {
  private locationsService = inject(ChileLocationsService);

  @Input() settings: LocationSettings = {
    availableForNewBookings: true,
    shareRealTimeLocation: false,
    coverageZones: []
  };

  @Output() settingsChange = new EventEmitter<LocationSettings>();
  @Output() addCoverageZone = new EventEmitter<string>();
  @Output() removeCoverageZone = new EventEmitter<string>();

  // Estado del selector
  selectedRegion: string = '';
  selectedComuna: string = '';
  searchText: string = '';
  showLocationSelector: boolean = false;

  // Datos de regiones y comunas
  regions: Region[] = [];
  comunasOfSelectedRegion: string[] = [];
  searchResults: {region: string, comuna: string}[] = [];

  ngOnInit() {
    this.regions = this.locationsService.getRegions();
  }

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

  toggleLocationSelector() {
    this.showLocationSelector = !this.showLocationSelector;
    if (!this.showLocationSelector) {
      this.resetSelector();
    }
  }

  onRegionChange() {
    this.comunasOfSelectedRegion = this.locationsService.getComunasByRegion(this.selectedRegion);
    this.selectedComuna = '';
  }

  onAddZoneFromSelector() {
    if (this.selectedComuna && this.selectedComuna.trim()) {
      this.addCoverageZone.emit(this.selectedComuna.trim());
      this.resetSelector();
      this.showLocationSelector = false;
    }
  }

  onSearchTextChange() {
    if (this.searchText.length >= 2) {
      this.searchResults = this.locationsService.searchComunas(this.searchText);
    } else {
      this.searchResults = [];
    }
  }

  selectSearchResult(result: {region: string, comuna: string}) {
    this.addCoverageZone.emit(result.comuna);
    this.searchText = '';
    this.searchResults = [];
  }

  private resetSelector() {
    this.selectedRegion = '';
    this.selectedComuna = '';
    this.comunasOfSelectedRegion = [];
    this.searchText = '';
    this.searchResults = [];
  }
}



