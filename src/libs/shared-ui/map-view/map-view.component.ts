import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

interface MapMarker {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  type: 'provider' | 'service' | 'location';
  data?: any;
  icon?: string;
  color?: string;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

@Component({
  selector: 'ui-map-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="map-container" [class]="containerClass">
      <!-- Map Header -->
      <div class="map-header" [class]="headerClass">
        <div class="map-title-section">
          <h3 class="map-title" [class]="titleClass">{{ title }}</h3>
          <p class="map-subtitle" [class]="subtitleClass">{{ subtitle }}</p>
        </div>
        <div class="map-controls" [class]="controlsClass">
          <!-- View Toggle -->
          <div class="view-toggle" [class]="viewToggleClass">
            <button
              type="button"
              class="view-btn"
              [class]="viewButtonClass"
              [class.active]="viewMode === 'map'"
              (click)="setViewMode('map')"
              [attr.aria-label]="mapViewLabel"
            >
              <ui-icon name="map-pin" [class]="viewIconClass"></ui-icon>
              <span class="view-label" [class]="viewLabelClass">{{ mapViewLabel }}</span>
            </button>
            <button
              type="button"
              class="view-btn"
              [class]="viewButtonClass"
              [class.active]="viewMode === 'list'"
              (click)="setViewMode('list')"
              [attr.aria-label]="listViewLabel"
            >
              <ui-icon name="list" [class]="viewIconClass"></ui-icon>
              <span class="view-label" [class]="viewLabelClass">{{ listViewLabel }}</span>
            </button>
          </div>
          
          <!-- Map Controls -->
          <div class="map-actions" [class]="actionsClass">
            <button
              type="button"
              class="map-action-btn"
              [class]="actionButtonClass"
              (click)="centerMap()"
              [attr.aria-label]="centerMapLabel"
            >
              <ui-icon name="crosshair" [class]="actionIconClass"></ui-icon>
            </button>
            <button
              type="button"
              class="map-action-btn"
              [class]="actionButtonClass"
              (click)="toggleFullscreen()"
              [attr.aria-label]="fullscreenLabel"
            >
              <ui-icon [name]="isFullscreen ? 'minimize' : 'maximize'" [class]="actionIconClass"></ui-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Map Content -->
      <div class="map-content" [class]="contentClass">
        <!-- Map View -->
        <div 
          class="map-view" 
          [class]="mapViewClass"
          [class.hidden]="viewMode !== 'map'"
          #mapContainer
        >
          <!-- Map Placeholder/Canvas -->
          <div class="map-canvas" [class]="canvasClass">
            <!-- Map will be rendered here -->
            <div class="map-placeholder" [class]="placeholderClass">
              <div class="map-info" [class]="infoClass">
                <ui-icon name="map" [class]="infoIconClass"></ui-icon>
                <h4 class="info-title" [class]="infoTitleClass">{{ mapTitle }}</h4>
                <p class="info-description" [class]="infoDescriptionClass">{{ mapDescription }}</p>
              </div>
            </div>
            
            <!-- Map Markers -->
            <div class="map-markers" [class]="markersClass">
              <div 
                *ngFor="let marker of markers; trackBy: trackByMarkerId"
                class="map-marker"
                [class]="getMarkerClass(marker)"
                [style.left.%]="getMarkerPosition(marker).x"
                [style.top.%]="getMarkerPosition(marker).y"
                (click)="onMarkerClick(marker)"
                [attr.aria-label]="marker.name"
              >
                <div class="marker-pin" [class]="getMarkerPinClass(marker)">
                  <ui-icon [name]="getMarkerIcon(marker)" [class]="getMarkerIconClass(marker)"></ui-icon>
                </div>
                <div class="marker-label" [class]="markerLabelClass">{{ marker.name }}</div>
              </div>
            </div>
            
            <!-- Map Overlay Info -->
            <div class="map-overlay" [class]="overlayClass" *ngIf="selectedMarker">
              <div class="overlay-content" [class]="overlayContentClass">
                <button 
                  class="overlay-close" 
                  [class]="overlayCloseClass"
                  (click)="closeOverlay()"
                  [attr.aria-label]="closeOverlayLabel"
                >
                  <ui-icon name="x" [class]="overlayCloseIconClass"></ui-icon>
                </button>
                <div class="overlay-body" [class]="overlayBodyClass">
                  <h5 class="overlay-title" [class]="overlayTitleClass">{{ selectedMarker.name }}</h5>
                  <p class="overlay-description" [class]="overlayDescriptionClass">
                    {{ getMarkerDescription(selectedMarker) }}
                  </p>
                  <div class="overlay-actions" [class]="overlayActionsClass">
                    <button 
                      class="overlay-action-btn primary"
                      [class]="overlayActionButtonClass"
                      (click)="onMarkerAction(selectedMarker, 'view')"
                    >
                      {{ viewDetailsLabel }}
                    </button>
                    <button 
                      class="overlay-action-btn secondary"
                      [class]="overlayActionButtonClass"
                      (click)="onMarkerAction(selectedMarker, 'book')"
                    >
                      {{ bookServiceLabel }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Map Legend -->
          <div class="map-legend" [class]="legendClass">
            <h6 class="legend-title" [class]="legendTitleClass">{{ legendTitle }}</h6>
            <div class="legend-items" [class]="legendItemsClass">
              <div class="legend-item" [class]="legendItemClass">
                <div class="legend-marker provider" [class]="legendMarkerClass"></div>
                <span class="legend-label" [class]="legendLabelClass">{{ providerLabel }}</span>
              </div>
              <div class="legend-item" [class]="legendItemClass">
                <div class="legend-marker service" [class]="legendMarkerClass"></div>
                <span class="legend-label" [class]="legendLabelClass">{{ serviceLabel }}</span>
              </div>
              <div class="legend-item" [class]="legendItemClass">
                <div class="legend-marker location" [class]="legendMarkerClass"></div>
                <span class="legend-label" [class]="legendLabelClass">{{ locationLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div 
          class="list-view" 
          [class]="listViewClass"
          [class.hidden]="viewMode !== 'list'"
        >
          <div class="list-header" [class]="listHeaderClass">
            <h4 class="list-title" [class]="listTitleClass">{{ listTitle }}</h4>
            <div class="list-count" [class]="listCountClass">
              {{ markers.length }} {{ itemsFoundLabel }}
            </div>
          </div>
          
          <div class="list-content" [class]="listContentClass">
            <div 
              *ngFor="let marker of markers; trackBy: trackByMarkerId"
              class="list-item"
              [class]="listItemClass"
              (click)="onListItemClick(marker)"
            >
              <div class="item-marker" [class]="getItemMarkerClass(marker)">
                <ui-icon [name]="getMarkerIcon(marker)" [class]="getItemIconClass(marker)"></ui-icon>
              </div>
              <div class="item-content" [class]="itemContentClass">
                <h5 class="item-title" [class]="itemTitleClass">{{ marker.name }}</h5>
                <p class="item-description" [class]="itemDescriptionClass">
                  {{ getMarkerDescription(marker) }}
                </p>
                <div class="item-meta" [class]="itemMetaClass">
                  <span class="item-distance" [class]="itemDistanceClass">
                    <ui-icon name="map-pin" [class]="metaIconClass"></ui-icon>
                    {{ getMarkerDistance(marker) }}
                  </span>
                  <span class="item-type" [class]="itemTypeClass">{{ getMarkerTypeLabel(marker) }}</span>
                </div>
              </div>
              <div class="item-actions" [class]="itemActionsClass">
                <button 
                  class="item-action-btn"
                  [class]="itemActionButtonClass"
                  (click)="onMarkerAction(marker, 'view')"
                >
                  {{ viewDetailsLabel }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() title: string = 'Mapa de Servicios';
  @Input() subtitle: string = 'Encuentra servicios cerca de ti';
  @Input() markers: MapMarker[] = [];
  @Input() center: { lat: number; lng: number } = { lat: -33.4489, lng: -70.6693 }; // Santiago center
  @Input() zoom: number = 12;
  @Input() height: string = '500px';
  @Input() showControls: boolean = true;
  @Input() showLegend: boolean = true;
  @Input() allowFullscreen: boolean = true;

  // Labels
  @Input() mapViewLabel: string = 'Mapa';
  @Input() listViewLabel: string = 'Lista';
  @Input() centerMapLabel: string = 'Centrar mapa';
  @Input() fullscreenLabel: string = 'Pantalla completa';
  @Input() closeOverlayLabel: string = 'Cerrar';
  @Input() viewDetailsLabel: string = 'Ver detalles';
  @Input() bookServiceLabel: string = 'Reservar';
  @Input() legendTitle: string = 'Leyenda';
  @Input() providerLabel: string = 'Proveedores';
  @Input() serviceLabel: string = 'Servicios';
  @Input() locationLabel: string = 'Ubicaciones';
  @Input() listTitle: string = 'Servicios encontrados';
  @Input() itemsFoundLabel: string = 'elementos encontrados';
  @Input() mapTitle: string = 'Mapa interactivo';
  @Input() mapDescription: string = 'Explora los servicios disponibles en tu área';

  // CSS Classes
  @Input() containerClass: string = 'w-full h-full bg-white rounded-xl border border-slate-200 overflow-hidden';
  @Input() headerClass: string = 'flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50';
  @Input() titleClass: string = 'text-lg font-semibold text-slate-800';
  @Input() subtitleClass: string = 'text-sm text-slate-600 mt-1';
  @Input() controlsClass: string = 'flex items-center gap-4';
  @Input() viewToggleClass: string = 'flex bg-white rounded-lg border border-slate-300 overflow-hidden';
  @Input() viewButtonClass: string = 'flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors';
  @Input() viewIconClass: string = 'w-4 h-4';
  @Input() viewLabelClass: string = 'hidden sm:inline';
  @Input() actionsClass: string = 'flex gap-2';
  @Input() actionButtonClass: string = 'p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors';
  @Input() actionIconClass: string = 'w-4 h-4';
  @Input() contentClass: string = 'relative';
  @Input() mapViewClass: string = 'relative';
  @Input() canvasClass: string = 'relative bg-slate-100';
  @Input() placeholderClass: string = 'flex items-center justify-center h-full min-h-96';
  @Input() infoClass: string = 'text-center p-8';
  @Input() infoIconClass: string = 'w-12 h-12 text-slate-400 mx-auto mb-4';
  @Input() infoTitleClass: string = 'text-xl font-semibold text-slate-700 mb-2';
  @Input() infoDescriptionClass: string = 'text-slate-500';
  @Input() markersClass: string = 'absolute inset-0 pointer-events-none';
  @Input() overlayClass: string = 'absolute top-4 left-4 right-4 z-10';
  @Input() overlayContentClass: string = 'bg-white rounded-lg shadow-lg border border-slate-200 max-w-sm';
  @Input() overlayCloseClass: string = 'absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors';
  @Input() overlayCloseIconClass: string = 'w-4 h-4';
  @Input() overlayBodyClass: string = 'p-4';
  @Input() overlayTitleClass: string = 'font-semibold text-slate-800 mb-2';
  @Input() overlayDescriptionClass: string = 'text-sm text-slate-600 mb-4';
  @Input() overlayActionsClass: string = 'flex gap-2';
  @Input() overlayActionButtonClass: string = 'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors';
  @Input() legendClass: string = 'absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3';
  @Input() legendTitleClass: string = 'text-xs font-semibold text-slate-700 mb-2';
  @Input() legendItemsClass: string = 'space-y-1';
  @Input() legendItemClass: string = 'flex items-center gap-2';
  @Input() legendMarkerClass: string = 'w-3 h-3 rounded-full';
  @Input() legendLabelClass: string = 'text-xs text-slate-600';
  @Input() listViewClass: string = 'h-full overflow-hidden flex flex-col';
  @Input() listHeaderClass: string = 'flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50';
  @Input() listTitleClass: string = 'text-lg font-semibold text-slate-800';
  @Input() listCountClass: string = 'text-sm text-slate-600';
  @Input() listContentClass: string = 'flex-1 overflow-y-auto';
  @Input() listItemClass: string = 'flex items-center gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors';
  @Input() itemContentClass: string = 'flex-1 min-w-0';
  @Input() itemTitleClass: string = 'font-medium text-slate-800 truncate';
  @Input() itemDescriptionClass: string = 'text-sm text-slate-600 mt-1 line-clamp-2';
  @Input() itemMetaClass: string = 'flex items-center gap-4 mt-2';
  @Input() itemDistanceClass: string = 'flex items-center gap-1 text-xs text-slate-500';
  @Input() itemTypeClass: string = 'text-xs text-slate-500';
  @Input() itemActionsClass: string = 'flex-shrink-0';
  @Input() itemActionButtonClass: string = 'px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors';
  @Input() markerLabelClass: string = 'text-xs font-medium text-white bg-slate-800 px-2 py-1 rounded-lg mt-1 whitespace-nowrap';
  @Input() metaIconClass: string = 'w-3 h-3';

  // Events
  @Output() markerClick = new EventEmitter<MapMarker>();
  @Output() markerAction = new EventEmitter<{ marker: MapMarker; action: string }>();
  @Output() viewModeChange = new EventEmitter<'map' | 'list'>();
  @Output() boundsChange = new EventEmitter<MapBounds>();
  @Output() centerChange = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // State
  viewMode: 'map' | 'list' = 'map';
  selectedMarker: MapMarker | null = null;
  isFullscreen: boolean = false;
  mapBounds: MapBounds | null = null;

  ngOnInit() {
    this.initializeMap();
  }

  ngAfterViewInit() {
    this.setupMapContainer();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initializeMap() {
    // Initialize map settings
    if (this.mapContainer) {
      this.setupMapContainer();
    }
  }

  private setupMapContainer() {
    if (this.mapContainer) {
      const element = this.mapContainer.nativeElement;
      element.style.height = this.height;
    }
  }

  private cleanup() {
    // Cleanup any map instances or event listeners
  }

  // Public methods
  setViewMode(mode: 'map' | 'list') {
    this.viewMode = mode;
    this.viewModeChange.emit(mode);
  }

  centerMap() {
    this.centerChange.emit(this.center);
    // In a real implementation, this would center the actual map
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    // In a real implementation, this would toggle fullscreen mode
  }

  closeOverlay() {
    this.selectedMarker = null;
  }

  // Marker methods
  trackByMarkerId(index: number, marker: MapMarker): string {
    return marker.id;
  }

  getMarkerClass(marker: MapMarker): string {
    const baseClass = 'map-marker cursor-pointer';
    const typeClass = `marker-${marker.type}`;
    const activeClass = this.selectedMarker?.id === marker.id ? 'active' : '';
    return `${baseClass} ${typeClass} ${activeClass}`;
  }

  getMarkerPinClass(marker: MapMarker): string {
    const baseClass = 'marker-pin rounded-full flex items-center justify-center shadow-lg';
    const typeClass = `marker-pin-${marker.type}`;
    return `${baseClass} ${typeClass}`;
  }

  getMarkerIcon(marker: MapMarker): 'user' | 'briefcase' | 'map-pin' {
    if (marker.icon && (marker.icon === 'user' || marker.icon === 'briefcase' || marker.icon === 'map-pin')) {
      return marker.icon;
    }
    
    switch (marker.type) {
      case 'provider': return 'user';
      case 'service': return 'briefcase';
      case 'location': return 'map-pin';
      default: return 'map-pin';
    }
  }

  getMarkerIconClass(marker: MapMarker): string {
    return 'w-4 h-4 text-white';
  }

  getMarkerPosition(marker: MapMarker): { x: number; y: number } {
    // Simplified positioning - in a real implementation, this would calculate
    // the position based on lat/lng coordinates and map bounds
    return {
      x: Math.random() * 80 + 10, // Random position for demo
      y: Math.random() * 80 + 10
    };
  }

  getMarkerDescription(marker: MapMarker): string {
    if (marker.data?.description) return marker.data.description;
    
    switch (marker.type) {
      case 'provider': return 'Proveedor de servicios';
      case 'service': return 'Servicio disponible';
      case 'location': return 'Ubicación de interés';
      default: return 'Marcador';
    }
  }

  getMarkerDistance(marker: MapMarker): string {
    // Simplified distance calculation
    const distance = Math.random() * 5 + 0.5;
    return `${distance.toFixed(1)} km`;
  }

  getMarkerTypeLabel(marker: MapMarker): string {
    switch (marker.type) {
      case 'provider': return 'Proveedor';
      case 'service': return 'Servicio';
      case 'location': return 'Ubicación';
      default: return 'Marcador';
    }
  }

  getItemMarkerClass(marker: MapMarker): string {
    const baseClass = 'w-10 h-10 rounded-full flex items-center justify-center';
    const typeClass = `item-marker-${marker.type}`;
    return `${baseClass} ${typeClass}`;
  }

  getItemIconClass(marker: MapMarker): string {
    return 'w-4 h-4 text-white';
  }

  // Event handlers
  onMarkerClick(marker: MapMarker) {
    this.selectedMarker = marker;
    this.markerClick.emit(marker);
  }

  onListItemClick(marker: MapMarker) {
    this.selectedMarker = marker;
    this.markerClick.emit(marker);
  }

  onMarkerAction(marker: MapMarker, action: string) {
    this.markerAction.emit({ marker, action });
  }
}
