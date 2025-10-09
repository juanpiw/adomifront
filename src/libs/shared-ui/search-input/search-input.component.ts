import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

interface LocationOption {
  id: string;
  name: string;
  region?: string;
}

interface RegionData {
  [key: string]: string[];
}

interface DateTimeSelection {
  type: 'quick' | 'custom';
  value: string;
  date?: Date;
  timeRange?: string;
}

@Component({
  selector: 'ui-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="advanced-search-container" [class]="containerClass">
      <!-- Barra principal de búsqueda -->
      <div class="search-bar-main">
        <!-- Filtro QUÉ (Servicio) -->
        <div class="search-field flex-grow">
          <label class="field-label">{{ serviceLabel }}</label>
          <input
            [type]="type"
            [placeholder]="placeholder"
            [value]="serviceValue"
            [disabled]="disabled"
            [class]="inputClass"
            (input)="onServiceInput($event)"
            (focus)="onFocus($event)"
            (blur)="onBlur($event)"
            (keydown.enter)="onEnter($event)"
            (keydown.escape)="onEscape($event)"
            [attr.aria-label]="ariaLabel"
          />
        </div>
        
        <div class="field-separator"></div>
        
        <!-- Filtro DÓNDE (Zona) -->
        <div class="search-field flex-grow cursor-pointer" 
             [class]="locationFieldClass"
             (click)="toggleLocationPopover()"
             [attr.aria-label]="locationLabel">
          <label class="field-label">{{ locationLabel }}</label>
          <div class="location-display">{{ selectedLocation?.name || defaultLocation }}</div>
          <ui-icon name="chevron-down" [class]="dropdownIconClass"></ui-icon>
        </div>
        
        <div class="field-separator"></div>
        
        <!-- Filtro CUÁNDO (Fecha y Hora) -->
        <div class="search-field flex-grow cursor-pointer"
             [class]="dateFieldClass"
             (click)="toggleDatePopover()"
             [attr.aria-label]="dateLabel">
          <label class="field-label">{{ dateLabel }}</label>
          <div class="date-display">{{ selectedDateTime?.value || defaultDateTime }}</div>
          <ui-icon name="calendar" [class]="calendarIconClass"></ui-icon>
        </div>
        
        <!-- Botón de búsqueda -->
        <button
          type="button"
          [class]="searchButtonClass"
          (click)="performSearch()"
          [disabled]="disabled"
          [attr.aria-label]="searchButtonLabel"
        >
          <ui-icon name="search" [class]="searchIconClass"></ui-icon>
        </button>
      </div>

      <!-- Popover para ZONA -->
      <div class="popover location-popover" 
           [class.hidden]="!showLocationPopover"
           [class]="locationPopoverClass">
        <div class="popover-content">
          <!-- Botón usar ubicación actual -->
          <button
            type="button"
            class="use-location-btn"
            (click)="useCurrentLocation()">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Usar mi ubicación actual
          </button>

          <!-- Selects de Región y Comuna -->
          <div class="region-comuna-grid">
            <div>
              <label class="select-label">REGIÓN</label>
              <select
                [(ngModel)]="selectedRegion"
                (change)="onRegionChange()"
                class="location-select">
                <option value="">Selecciona una región</option>
                <option *ngFor="let region of regionOptions" [value]="region">
                  {{ region }}
                </option>
              </select>
            </div>
            <div>
              <label class="select-label">COMUNA</label>
              <select
                [(ngModel)]="selectedComuna"
                (change)="onComunaSelectChange()"
                [disabled]="!selectedRegion"
                class="location-select">
                <option value="">Selecciona una comuna</option>
                <option *ngFor="let comuna of comunaOptions" [value]="comuna">
                  {{ comuna }}
                </option>
              </select>
            </div>
          </div>

          <!-- Separador -->
          <p class="text-center text-xs text-gray-400 my-2">o</p>

          <!-- Búsqueda directa de comuna -->
          <input
            type="text"
            placeholder="Busca tu comuna directamente..."
            [class]="locationSearchClass"
            [(ngModel)]="locationSearchTerm"
            (input)="filterLocations()"
          />

          <!-- Lista de resultados de búsqueda (solo si hay término de búsqueda) -->
          <ul *ngIf="locationSearchTerm" class="location-list" [class]="locationListClass">
            <li *ngFor="let location of filteredLocations"
                class="location-item"
                [class]="locationItemClass"
                (click)="selectLocation(location)">
              {{ location.name }}
              <span class="location-region">{{ location.region }}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Popover para FECHA Y HORA -->
      <div class="popover date-popover"
           [class.hidden]="!showDatePopover"
           [class]="datePopoverClass">
        <div class="popover-content">
          <!-- Botones de fecha rápida -->
          <div class="quick-date-buttons" [class]="quickDateButtonsClass">
            <button *ngFor="let quickDate of quickDateOptions"
                    type="button"
                    class="quick-date-btn"
                    [class]="quickDateButtonClass"
                    (click)="selectQuickDate(quickDate.value)">
              {{ quickDate.label }}
            </button>
          </div>
          
          <!-- Selector de fecha personalizada -->
          <div class="custom-date-section">
            <label class="date-label">{{ customDateLabel }}</label>
            <input
              type="datetime-local"
              [class]="dateInputClass"
              [(ngModel)]="customDateTime"
              (change)="onCustomDateTimeChange()"
            />
          </div>
          
          <!-- Bloques de tiempo -->
          <div class="time-blocks-section">
            <p class="time-blocks-title">{{ timeBlocksLabel }}</p>
            <div class="time-blocks-grid" [class]="timeBlocksGridClass">
              <button *ngFor="let timeBlock of timeBlocks"
                      type="button"
                      class="time-block-btn"
                      [class]="timeBlockButtonClass"
                      (click)="selectTimeBlock(timeBlock)">
                <span class="time-block-name">{{ timeBlock.name }}</span>
                <span class="time-block-range">{{ timeBlock.range }}</span>
              </button>
            </div>
          </div>
          
          <!-- Botón aplicar -->
          <button type="button"
                  class="apply-date-btn"
                  [class]="applyDateButtonClass"
                  (click)="applyDateTime()">
            {{ applyButtonLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./search-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true
    }
  ]
})
export class SearchInputComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder: string = 'Estilista, Chef...';
  @Input() disabled: boolean = false;
  @Input() type: string = 'text';
  @Input() ariaLabel: string = 'Campo de búsqueda avanzada';
  @Input() serviceLabel: string = 'SERVICIO';
  @Input() locationLabel: string = 'ZONA';
  @Input() dateLabel: string = 'FECHA Y HORA';
  @Input() locationSearchPlaceholder: string = 'Busca tu comuna...';
  @Input() customDateLabel: string = 'Fecha y hora específica';
  @Input() timeBlocksLabel: string = 'Bloques de tiempo';
  @Input() searchButtonLabel: string = 'Buscar';
  @Input() applyButtonLabel: string = 'Aplicar';

  // Valores por defecto
  @Input() defaultLocation: string = 'San Bernardo';
  @Input() defaultDateTime: string = 'Ahora';

  // Clases CSS personalizables
  @Input() containerClass: string = 'relative mt-8';
  @Input() inputClass: string = 'w-full p-2 border-none rounded-lg focus:outline-none focus:ring-0 text-lg font-semibold text-slate-800';
  @Input() locationFieldClass: string = 'p-2 rounded-lg hover:bg-slate-100 transition-colors';
  @Input() dateFieldClass: string = 'p-2 rounded-lg hover:bg-slate-100 transition-colors';
  @Input() searchButtonClass: string = 'bg-indigo-600 text-white rounded-xl p-4 hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105';
  @Input() locationPopoverClass: string = 'absolute top-full mt-2 w-1/3 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 p-4';
  @Input() locationSearchClass: string = 'w-full px-4 py-2 border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  @Input() locationListClass: string = 'max-h-60 overflow-y-auto';
  @Input() locationItemClass: string = 'p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors';
  @Input() datePopoverClass: string = 'absolute top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 p-4 w-[360px]';
  @Input() quickDateButtonsClass: string = 'flex space-x-2 mb-4';
  @Input() quickDateButtonClass: string = 'flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-indigo-100 hover:text-indigo-600 text-sm transition-colors';
  @Input() dateInputClass: string = 'w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  @Input() timeBlocksGridClass: string = 'grid grid-cols-3 gap-2';
  @Input() timeBlockButtonClass: string = 'text-sm px-2 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-indigo-100 hover:text-indigo-600 transition-colors';
  @Input() applyDateButtonClass: string = 'w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 mt-4';
  @Input() dropdownIconClass: string = 'w-5 h-5 text-slate-400';
  @Input() calendarIconClass: string = 'w-5 h-5 text-slate-400';
  @Input() searchIconClass: string = 'w-6 h-6';

  // Eventos de salida
  @Output() search = new EventEmitter<{service: string, location: string, datetime: DateTimeSelection}>();
  @Output() serviceChange = new EventEmitter<string>();
  @Output() locationChange = new EventEmitter<string>();
  @Output() datetimeChange = new EventEmitter<DateTimeSelection>();
  @Output() focus = new EventEmitter<FocusEvent>();
  @Output() blur = new EventEmitter<FocusEvent>();
  @Output() enter = new EventEmitter<string>();
  @Output() escape = new EventEmitter<void>();

  // Estado interno
  serviceValue: string = '';
  selectedLocation: LocationOption | null = null;
  selectedDateTime: DateTimeSelection | null = null;
  showLocationPopover: boolean = false;
  showDatePopover: boolean = false;
  locationSearchTerm: string = '';
  customDateTime: string = '';
  selectedRegion: string = '';
  selectedComuna: string = '';

  // Datos de Regiones y Comunas de Chile
  regionesYComunas: RegionData = {
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
    "Antofagasta": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
    "Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
    "Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
    "Valparaíso": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"],
    "Metropolitana de Santiago": ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
    "Libertador General Bernardo O'Higgins": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"],
    "Maule": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"],
    "Ñuble": ["Chillán", "Bulnes", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Quirihue", "Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Ránquil", "Treguaco", "San Carlos", "Coihueco", "Ñiquén", "San Fabián", "San Nicolás"],
    "Biobío": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"],
    "La Araucanía": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"],
    "Los Ríos": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
    "Los Lagos": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"],
    "Aysén del General Carlos Ibáñez del Campo": ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"],
    "Magallanes y de la Antártica Chilena": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos (Ex Navarino)", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
  };

  // Lista plana de todas las comunas para búsqueda y selección
  locations: LocationOption[] = [];
  filteredLocations: LocationOption[] = [];
  regionOptions: string[] = [];
  comunaOptions: string[] = [];

  quickDateOptions = [
    { value: 'any', label: 'Cualquier fecha' },
    { value: 'today', label: 'Hoy' },
    { value: 'tomorrow', label: 'Mañana' }
  ];

  timeBlocks = [
    { name: 'Mañana', range: '9-12h', value: 'morning' },
    { name: 'Tarde', range: '13-18h', value: 'afternoon' },
    { name: 'Noche', range: '19-22h', value: 'evening' }
  ];

  // ControlValueAccessor implementation
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.initializeLocationsData();
    this.filteredLocations = [...this.locations];
    this.initializeDefaults();
  }

  private initializeLocationsData() {
    // Generar lista plana de todas las comunas con su región
    for (const region in this.regionesYComunas) {
      this.regionesYComunas[region].forEach(comuna => {
        this.locations.push({
          id: this.slugify(comuna),
          name: comuna,
          region: region
        });
      });
    }

    // Generar lista de regiones
    this.regionOptions = Object.keys(this.regionesYComunas);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  private initializeDefaults() {
    // Establecer ubicación por defecto
    const defaultLoc = this.locations.find(loc => loc.name === this.defaultLocation);
    if (defaultLoc) {
      this.selectedLocation = defaultLoc;
    }

    // Establecer fecha/hora por defecto
    this.selectedDateTime = {
      type: 'quick',
      value: this.defaultDateTime
    };
  }

  // Eventos de input de servicio
  onServiceInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.serviceValue = target.value;
    this.onChange(this.serviceValue);
    this.serviceChange.emit(this.serviceValue);
  }

  onFocus(event: FocusEvent): void {
    this.focus.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blur.emit(event);
  }

  onEnter(event: Event): void {
    this.performSearch();
    this.enter.emit(this.serviceValue);
  }

  onEscape(event: Event): void {
    this.hideAllPopovers();
    this.escape.emit();
  }

  // Funciones de ubicación
  toggleLocationPopover(): void {
    this.showDatePopover = false;
    this.showLocationPopover = !this.showLocationPopover;
  }

  onRegionChange(): void {
    // Cuando se selecciona una región, poblar el select de comunas
    if (this.selectedRegion) {
      this.comunaOptions = this.regionesYComunas[this.selectedRegion] || [];
      this.selectedComuna = ''; // Resetear comuna seleccionada
    } else {
      this.comunaOptions = [];
      this.selectedComuna = '';
    }
  }

  onComunaSelectChange(): void {
    // Cuando se selecciona una comuna del select
    if (this.selectedComuna) {
      const location = this.locations.find(loc => loc.name === this.selectedComuna);
      if (location) {
        this.selectLocation(location);
      }
    }
  }

  filterLocations(): void {
    // Filtrar comunas por búsqueda directa
    if (!this.locationSearchTerm) {
      this.filteredLocations = [...this.locations];
    } else {
      this.filteredLocations = this.locations.filter(location =>
        location.name.toLowerCase().includes(this.locationSearchTerm.toLowerCase())
      );
    }
  }

  selectLocation(location: LocationOption): void {
    this.selectedLocation = location;
    this.showLocationPopover = false;
    this.locationSearchTerm = ''; // Limpiar búsqueda
    this.selectedRegion = ''; // Resetear selects
    this.selectedComuna = '';
    this.locationChange.emit(location.id);
  }

  useCurrentLocation(): void {
    // Placeholder para usar la ubicación actual del usuario
    // En producción, aquí se usaría la API de geolocalización
    console.log('Usando ubicación actual del usuario');
    // Por ahora, simplemente mostramos un mensaje
    alert('Función de geolocalización disponible próximamente');
  }

  // Funciones de fecha/hora
  toggleDatePopover(): void {
    this.showLocationPopover = false;
    this.showDatePopover = !this.showDatePopover;
  }

  selectQuickDate(dateType: string): void {
    const now = new Date();
    let displayText = '';
    let dateTime: DateTimeSelection;

    switch (dateType) {
      case 'any':
        displayText = 'Cualquier fecha';
        dateTime = { type: 'quick', value: 'any' };
        break;
      case 'today':
        displayText = 'Hoy';
        dateTime = { type: 'quick', value: 'today', date: now };
        break;
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        displayText = 'Mañana';
        dateTime = { type: 'quick', value: 'tomorrow', date: tomorrow };
        break;
      default:
        return;
    }

    this.selectedDateTime = dateTime;
    this.showDatePopover = false;
    this.datetimeChange.emit(dateTime);
  }

  onCustomDateTimeChange(): void {
    if (this.customDateTime) {
      const date = new Date(this.customDateTime);
      this.selectedDateTime = {
        type: 'custom',
        value: this.formatDateTime(date),
        date: date
      };
    }
  }

  selectTimeBlock(timeBlock: any): void {
    this.selectedDateTime = {
      type: 'custom',
      value: `${timeBlock.name} (${timeBlock.range})`,
      timeRange: timeBlock.value
    };
    this.showDatePopover = false;
    this.datetimeChange.emit(this.selectedDateTime);
  }

  applyDateTime(): void {
    if (this.selectedDateTime) {
      this.showDatePopover = false;
      this.datetimeChange.emit(this.selectedDateTime);
    }
  }

  // Función principal de búsqueda
  performSearch(): void {
    const searchData = {
      service: this.serviceValue,
      location: this.selectedLocation?.id || '',
      datetime: this.selectedDateTime || { type: 'quick', value: 'any' }
    };
    this.search.emit(searchData);
  }

  // Utilidades
  private formatDateTime(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} a las ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private hideAllPopovers(): void {
    this.showLocationPopover = false;
    this.showDatePopover = false;
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.serviceValue = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}