import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChileLocationsService, Region } from '../../../app/services/chile-locations.service';
import { environment } from '../../../environments/environment';

export interface CoverageZone {
  id: string;
  name: string;
  isPrimary?: boolean;
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
  styleUrls: ['./ubicacion-disponibilidad.component.scss'],
  // Permitir Web Components de Google (gmpx-*)
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
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
  @Output() requestCurrentLocation = new EventEmitter<void>();
  // Nuevo: establecer coordenadas para una zona específica
  @Output() setZoneLocation = new EventEmitter<{ zoneId: string; lat: number; lng: number }>();
  @Output() setZonePrimary = new EventEmitter<string>();

  // Google API key
  googleKey: string = (environment as any)?.googleMapsApiKey || '';

  // Picker modal state
  showMapModal: boolean = false;
  activeZoneId: string | null = null;
  activeZoneName: string | null = null;
  addressQuery: string = '';
  pickerLat: number | null = null;
  pickerLng: number | null = null;

  // Map refs
  @ViewChild('pickerMap', { static: false }) pickerMapRef?: ElementRef<HTMLDivElement>;
  private pickerMap: any = null;
  private pickerMarker: any = null;

  // Loader de Google Maps JS (compartido)
  private static mapsLoaderPromise: Promise<void> | null = null;
  private ensureGoogleMapsLoaded(): Promise<void> {
    if ((window as any).google?.maps) return Promise.resolve();
    if (UbicacionDisponibilidadComponent.mapsLoaderPromise) return UbicacionDisponibilidadComponent.mapsLoaderPromise;
    UbicacionDisponibilidadComponent.mapsLoaderPromise = new Promise<void>((resolve, reject) => {
      try {
        const existing = document.querySelector('script[data-google-maps-js]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('Google Maps JS failed to load')));
          return;
        }
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(this.googleKey)}&v=weekly`;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-google-maps-js', 'true');
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google Maps JS failed to load'));
        document.head.appendChild(script);
      } catch (e) {
        reject(e as any);
      }
    });
    return UbicacionDisponibilidadComponent.mapsLoaderPromise;
  }

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

  // Emitir petición para actualizar ubicación actual
  updateCurrentLocation() {
    this.requestCurrentLocation.emit();
  }

  // Emitir evento para guardar coordenadas de una zona
  saveZoneCoordinates(zoneId: string, lat: number, lng: number) {
    this.setZoneLocation.emit({ zoneId, lat, lng });
    this.closeMapModal();
  }

  // Abrir modal del picker para una zona
  openZonePicker(zoneId: string, zoneName: string) {
    this.activeZoneId = zoneId;
    this.activeZoneName = zoneName;
    this.addressQuery = zoneName;
    this.showMapModal = true;
    // Esperar a que google.maps esté disponible (lo carga gmpx-api-loader en la plantilla)
    setTimeout(() => {
      this.waitForGoogleMaps().then(() => this.initPickerMap());
    }, 0);
  }

  closeMapModal() {
    this.showMapModal = false;
    this.activeZoneId = null;
    this.activeZoneName = null;
    this.addressQuery = '';
    this.pickerLat = null;
    this.pickerLng = null;
  }

  private waitForGoogleMaps(timeoutMs: number = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const id = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(id);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(id);
          reject(new Error('Google Maps JS not loaded in time'));
        }
      }, 100);
    });
  }

  private initPickerMap() {
    try {
      const el = this.pickerMapRef?.nativeElement;
      if (!el || !(window as any).google?.maps) return;
      // Centro por defecto: Santiago
      const center = { lat: -33.4489, lng: -70.6693 };
      this.pickerMap = new (window as any).google.maps.Map(el, {
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
      this.pickerMarker = new (window as any).google.maps.Marker({
        position: center,
        map: this.pickerMap,
        draggable: true
      });
      this.pickerLat = center.lat;
      this.pickerLng = center.lng;

      this.pickerMarker.addListener('dragend', (e: any) => {
        const pos = e.latLng;
        this.pickerLat = pos.lat();
        this.pickerLng = pos.lng();
      });

      // Intentar centrar por nombre de comuna
      const query = (this.activeZoneName || '').trim();
      if (query && (window as any).google?.maps?.Geocoder) {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ address: query }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location;
            this.moveMarker(loc.lat(), loc.lng());
          }
        });
      }
    } catch {}
  }

  onAutocompleteChange(evt: any) {
    try {
      const place = evt?.detail?.place;
      const loc = place?.location || place?.position || place?.geometry?.location;
      const lat = typeof loc?.lat === 'function' ? loc.lat() : Number(loc?.lat);
      const lng = typeof loc?.lng === 'function' ? loc.lng() : Number(loc?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      this.moveMarker(lat, lng);
    } catch {}
  }

  onFindAddress() {
    const query = (this.addressQuery || '').trim();
    if (!query) return;
    const g = (window as any).google;
    if (g?.maps?.Geocoder) {
      const geocoder = new g.maps.Geocoder();
      geocoder.geocode({ address: query }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          this.moveMarker(loc.lat(), loc.lng());
        }
      });
    }
  }

  private moveMarker(lat: number, lng: number) {
    if (this.pickerMap && this.pickerMarker) {
      const pos = { lat, lng };
      this.pickerMarker.setPosition(pos);
      this.pickerMap.setCenter(pos);
      this.pickerMap.setZoom(15);
      this.pickerLat = lat;
      this.pickerLng = lng;
    }
  }
}



