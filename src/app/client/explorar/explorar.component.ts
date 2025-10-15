import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';
import { SearchInputComponent } from '../../../libs/shared-ui/search-input/search-input.component';
import { MapCardComponent, ProfessionalCard, MapCardMarker } from '../../../libs/shared-ui/map-card/map-card.component';
import { IconName } from '../../../libs/shared-ui/icon/icon.component';
import { ProfileRequiredModalComponent } from '../../../libs/shared-ui/profile-required-modal/profile-required-modal.component';
import { ProfileValidationService } from '../../services/profile-validation.service';
import { AuthService } from '../../auth/services/auth.service';
import { SearchService, SearchFilters, Provider, Service, Category, Location } from '../../services/search.service';

// Interfaces moved to search.service.ts

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SearchInputComponent, MapCardComponent, ProfileRequiredModalComponent],
  template: `
    <!-- Modal de Perfil Requerido -->
    <app-profile-required-modal 
      *ngIf="showProfileModal"
      [missingFields]="missingFields"
      [userType]="userType"
    ></app-profile-required-modal>

    <div class="explorar-container">
      <!-- Hero Banner (ahora arriba del header) -->
      <section class="mb-6">
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white relative overflow-hidden order">
          <div class="relative z-10">
            <h3 class="text-xl font-bold">Relájate, nosotros nos encargamos</h3>
            <p class="mt-1 max-w-lg text-xs">Desde un corte de pelo hasta la reparación de tu hogar, encuentra profesionales de confianza en un solo lugar.</p>  
          </div>
          <div>
           <button class="mt-3 bg-white text-indigo-600 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition duration-300" (click)="showCategories()">
              Explorar Categorías
            </button>
          </div>
          
          <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full"></div>
          <div class="absolute top-4 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
      </section>

      <!-- Header with Search -->
      <header class="mb-8">
        <h2 class="text-4xl font-extrabold text-gray-800">Hola, {{ user?.name || 'Usuario' }}!</h2>
        <p class="text-gray-500 mt-2 text-lg">Encuentra y agenda los mejores servicios a domicilio.</p>
        <ui-search-input
          placeholder="Estilista, Chef..."
          [(ngModel)]="searchTerm"
          (search)="onAdvancedSearch($event)"
          (serviceChange)="onServiceChange($event)"
          (locationChange)="onLocationChange($event)"
          (datetimeChange)="onDateTimeChange($event)"
          (currentLocation)="onUseCurrentLocation($event)"
          ariaLabel="Búsqueda avanzada de servicios"
        ></ui-search-input>
      </header>

      <!-- Filters Section -->
      <div class="filters-section mb-8">
        <div class="flex flex-wrap gap-4 justify-center">
          <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="filter-select">
            <option value="">Todas las Categorías</option>
            <option *ngFor="let category of categories" [value]="category.name">
              {{ category.name }} ({{ category.count }})
            </option>
          </select>
          
          <select [(ngModel)]="selectedLocation" (change)="applyFilters()" class="filter-select">
            <option value="">Todas las Ubicaciones</option>
            <option *ngFor="let location of locations" [value]="location.commune">
              {{ location.commune }}, {{ location.region }} ({{ location.count }})
            </option>
          </select>
          
          <select [(ngModel)]="selectedPriceRange" (change)="applyFilters()" class="filter-select">
            <option value="">Cualquier Precio</option>
            <option value="0-10000">Hasta $10.000</option>
            <option value="10001-25000">$10.001 - $25.000</option>
            <option value="25001-50000">$25.001 - $50.000</option>
            <option value="50001+">Más de $50.000</option>
          </select>
          
          <button (click)="clearFilters()" class="clear-filters-btn">
            <ui-icon name="x" class="w-4 h-4 mr-2"></ui-icon>
            Limpiar Filtros
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p class="text-gray-600 mt-4">Cargando servicios...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="searchError" class="error-state bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <ui-icon name="alert-triangle" class="w-5 h-5 text-red-500 mr-2"></ui-icon>
          <p class="text-red-700">{{ searchError }}</p>
        </div>
      </div>

      <!-- Providers Section -->
      <section *ngIf="!loading && filteredProviders.length > 0">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">Recomendados para ti</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div *ngFor="let provider of filteredProviders" class="bg-white rounded-3xl p-6 custom-shadow custom-shadow-hover transition-all duration-300">
            <div class="flex items-center mb-4">
              <img [src]="provider.avatar_url || '/assets/default-avatar.png'" 
                   [alt]="provider.name" 
                   class="w-14 h-14 rounded-full object-cover">
              <div class="ml-4">
                <p class="font-bold text-lg text-gray-900">{{ provider.name }}</p>
                <p class="text-sm text-gray-500">{{ provider.profession }}</p>
              </div>
            </div>
            <p class="text-gray-600 text-sm mb-4">{{ provider.description }}</p>
            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <div class="flex items-center">
                <ui-icon name="star" class="w-5 h-5 text-yellow-400"></ui-icon>
                <span class="text-gray-800 font-bold ml-1.5">{{ provider.rating }}</span>
                <span class="text-gray-400 text-sm ml-2">({{ provider.review_count }})</span>
              </div>
              <a href="#" class="text-sm font-bold text-indigo-600 hover:text-indigo-800" (click)="viewProviderProfile(provider.id, $event)">
                Ver Perfil
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Map Card Section -->
      <section *ngIf="!loading" class="mt-12">
        <ui-map-card
          [title]="mapPanelTitle"
          [professionals]="professionalCards"
          [highlightedProfessional]="highlightedProfessional"
          [mapMarkers]="mapCardMarkers"
          [mapCenter]="mapCenter"
          [mapZoom]="mapZoom"
          [height]="'600px'"
          [showMapControls]="true"
          [showMapLegend]="true"
          (professionalClick)="onProfessionalClick($event)"
          (professionalBook)="onProfessionalBook($event)"
          (markerClick)="onMapCardMarkerClick($event)"
          (markerAction)="onMapCardMarkerAction($event)"
          (viewModeChange)="onMapCardViewModeChange($event)"
          (searchHere)="onMapCardSearchHere($event)"
        ></ui-map-card>
      </section>

      <!-- No Results -->
      <div *ngIf="!loading && filteredProviders.length === 0 && filteredServices.length === 0" class="no-results text-center py-12">
        <ui-icon name="search" class="w-16 h-16 text-gray-400 mx-auto mb-4"></ui-icon>
        <h3 class="text-xl font-bold text-gray-800 mb-2">No se encontraron resultados</h3>
        <p class="text-gray-600 mb-6">Intenta ajustar tus filtros de búsqueda</p>
        <button (click)="clearFilters()" class="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition">
          Limpiar Filtros
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private profileValidation = inject(ProfileValidationService);
  private auth = inject(AuthService);
  private searchService = inject(SearchService);

  // User data
  user: any = null;

  // Profile validation
  showProfileModal: boolean = false;
  missingFields: string[] = [];
  userType: 'client' | 'provider' = 'client';

  // Search and filters
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedLocation: string = '';
  selectedPriceRange: string = '';
  
  // Advanced search
  selectedService: string = '';
  selectedLocationId: string = '';
  selectedDateTime: any = null;
  
  // Map data
  mapMarkers: any[] = [];
  mapCenter: { lat: number; lng: number } = { lat: -33.4489, lng: -70.6693 };
  mapZoom: number = 12;
  mapRadiusKm: number = 10; // radio activo para búsquedas cercanas
  nearbyActive: boolean = false; // indicador de que la última acción fue de mapa
  
  // Map Card data
  professionalCards: ProfessionalCard[] = [];
  highlightedProfessional: ProfessionalCard | null = null;
  mapCardMarkers: MapCardMarker[] = [];
  mapPanelTitle: string = 'profesionales disponibles';

  // Data
  providers: Provider[] = [];
  services: Service[] = [];
  filteredProviders: Provider[] = [];
  filteredServices: Service[] = [];
  categories: Category[] = [];
  locations: Location[] = [];

  // State
  loading: boolean = false;
  searchError: string = '';

  ngOnInit() {
    console.log('[EXPLORAR] ngOnInit iniciado');
    if (isPlatformBrowser(this.platformId)) {
      console.log('[EXPLORAR] Cargando datos de usuario...');
      this.loadUserData();
      // Si no hay nombre todavía, pedirlo al backend
      if (!this.user?.name) {
        console.log('[EXPLORAR] No hay nombre, obteniendo del backend...');
        this.auth.getCurrentUserInfo().subscribe({
          next: () => {
            console.log('[EXPLORAR] Usuario obtenido del backend');
            const u = this.auth.getCurrentUser();
            if (u) this.user = u;
          },
          error: () => {}
        });
        this.auth.authState$.subscribe(u => {
          if (u) this.user = u;
        });
      }
      console.log('[EXPLORAR] Validando perfil...');
      this.validateProfile(); // Validar perfil primero
      this.loadCategories();
      this.loadLocations();
      this.loadData(); // Cargar datos reales
      this.updateMapPanelTitle();
    }
  }

  /**
   * Valida si el perfil del usuario está completo
   */
  private validateProfile() {
    console.log('[EXPLORAR] 🔍 Validando perfil del usuario...');
    console.log('[EXPLORAR] 🔐 Token disponible:', !!localStorage.getItem('adomi_access_token'));
    
    this.profileValidation.validateProfile().subscribe({
      next: (response) => {
        console.log('[EXPLORAR] ✅ Resultado de validación:', response);
        
        if (!response.isComplete) {
          console.log('[EXPLORAR] ⚠️ Perfil incompleto - mostrando modal');
          console.log('[EXPLORAR] 📋 Campos faltantes:', response.missingFields);
          this.showProfileModal = true;
          this.missingFields = response.missingFields;
          this.userType = response.userType;
        } else {
          console.log('[EXPLORAR] ✅ Perfil completo - continuando');
          this.showProfileModal = false;
        }
      },
      error: (error) => {
        console.error('[EXPLORAR] ❌ Error al validar perfil:', error);
        console.error('[EXPLORAR] 🔍 Detalles del error:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        
        // TEMPORAL: Para pruebas, mostrar el modal si hay error
        // Esto te permitirá ver el componente aunque falle el endpoint
        console.log('[EXPLORAR] ⚠️ MODO DEBUG: Mostrando modal para pruebas');
        this.showProfileModal = true;
        this.missingFields = [
          'Nombre completo',
          'Teléfono de contacto',
          'Dirección principal',
          'Comuna',
          'Región'
        ];
        this.userType = 'client';
      }
    });
  }

  private loadUserData() {
    console.log('[EXPLORAR] loadUserData iniciado');
    // Primero desde localStorage (rápido)
    const userData = localStorage.getItem('adomi_user');
    if (userData && userData !== 'undefined' && userData !== 'null') {
      try { 
        this.user = JSON.parse(userData);
        console.log('[EXPLORAR] Usuario desde localStorage:', this.user);
      } catch (e) {
        console.error('[EXPLORAR] Error parseando usuario:', e);
        this.user = null;
      }
    } else {
      console.log('[EXPLORAR] No hay usuario en localStorage');
    }
    
    // Luego actualizar desde authService (sincronizado con backend)
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
      console.log('[EXPLORAR] Usuario desde authService:', this.user);
    }
  }

  private loadData() {
    console.log('[EXPLORAR] Cargando datos reales...');
    this.loading = true;
    this.searchError = '';

    const filters: SearchFilters = {
      limit: 20,
      offset: 0
    };

    this.searchService.searchAll(filters).subscribe({
      next: (results) => {
        console.log('[EXPLORAR] ✅ Datos cargados:', {
          providers: results.providers.data.length,
          services: results.services.data.length
        });

        this.providers = results.providers.data;
        this.services = results.services.data;
        this.filteredProviders = [...this.providers];
        this.filteredServices = [...this.services];

        // Actualizar componentes del mapa
        this.generateMapMarkers();
        this.generateProfessionalCards();
        this.generateMapCardMarkers();

        this.loading = false;
      },
      error: (error) => {
        console.error('[EXPLORAR] ❌ Error cargando datos:', error);
        this.searchError = 'Error al cargar los datos. Intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  private loadCategories() {
    console.log('[EXPLORAR] Cargando categorías...');
    this.searchService.getCategories().subscribe({
      next: (response) => {
        console.log('[EXPLORAR] ✅ Categorías cargadas:', response.data.length);
        this.categories = response.data;
      },
      error: (error) => {
        console.error('[EXPLORAR] ❌ Error cargando categorías:', error);
        // Usar categorías por defecto si falla
        this.categories = [
          { name: 'Belleza', count: 0 },
          { name: 'Salud', count: 0 },
          { name: 'Hogar', count: 0 },
          { name: 'Educación', count: 0 }
        ];
      }
    });
  }

  private loadLocations() {
    console.log('[EXPLORAR] Cargando ubicaciones...');
    this.searchService.getLocations().subscribe({
      next: (response) => {
        console.log('[EXPLORAR] ✅ Ubicaciones cargadas:', response.data.length);
        this.locations = response.data;
      },
      error: (error) => {
        console.error('[EXPLORAR] ❌ Error cargando ubicaciones:', error);
        // Usar ubicaciones por defecto si falla
        this.locations = [
          { region: 'Metropolitana de Santiago', commune: 'Santiago', count: 0 },
          { region: 'Valparaíso', commune: 'Valparaíso', count: 0 },
          { region: 'Biobío', commune: 'Concepción', count: 0 }
        ];
      }
    });
  }

  onSearch(searchValue: string) {
    this.searchTerm = searchValue;
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Advanced search methods
  onAdvancedSearch(searchData: any) {
    console.log('Búsqueda avanzada:', searchData);
    this.selectedService = searchData.service;
    this.selectedLocationId = searchData.location;
    this.selectedDateTime = searchData.datetime;
    // Si la búsqueda por mapa está activa, reutilizar centro/radio
    if (this.nearbyActive && this.mapCenter) {
      this.onMapCardSearchHere({ center: this.mapCenter, radiusKm: this.mapRadiusKm || 10 });
    } else {
      this.applyAdvancedFilters();
    }
    this.updateMapPanelTitle();
  }

  onServiceChange(service: string) {
    this.selectedService = service;
    this.applyAdvancedFilters();
    this.updateMapPanelTitle();
  }

  onLocationChange(locationId: string) {
    this.selectedLocationId = locationId;
    this.applyAdvancedFilters();
    this.updateMapPanelTitle();
  }

  onDateTimeChange(dateTime: any) {
    this.selectedDateTime = dateTime;
    this.applyAdvancedFilters();
    this.updateMapPanelTitle();
  }

  applyAdvancedFilters() {
    console.log('[EXPLORAR] Aplicando filtros avanzados...');
    this.loading = true;
    this.searchError = '';

    const baseFilters: SearchFilters = {
      search: this.selectedService,
      location: this.selectedLocationId,
      limit: 20,
      offset: 0
    };

    const hasDateTime = !!(this.selectedDateTime && (this.selectedDateTime.value || this.selectedDateTime.type));

    const sub$ = hasDateTime
      ? this.searchService.searchAvailableProviders({
          date: this.getDateISO(this.selectedDateTime),
          start: this.getStartTime(this.selectedDateTime),
          end: this.getEndTime(this.selectedDateTime),
          location: this.selectedLocationId || '',
          category: this.selectedService || '',
          limit: 20,
          offset: 0,
          is_now: this.isNowFilter(this.selectedDateTime)
        })
      : (this.searchService.searchAll(baseFilters) as any);

    (sub$ as any).subscribe({
      next: (results: any) => {
        if (hasDateTime) {
          console.log('[EXPLORAR] ✅ Filtros aplicados (disponibilidad):', { providers: results.data.length });
          this.filteredProviders = results.data;
          this.filteredServices = [];
        } else {
          console.log('[EXPLORAR] ✅ Filtros aplicados:', {
            providers: results.providers.data.length,
            services: results.services.data.length
          });
          this.filteredProviders = results.providers.data;
          this.filteredServices = results.services.data;
        }

        // Update map markers based on filtered results
        this.generateMapMarkers();
        this.generateProfessionalCards();
        this.generateMapCardMarkers();

        this.loading = false;
      },
      error: (error: any) => {
        console.error('[EXPLORAR] ❌ Error aplicando filtros:', error);
        this.searchError = 'Error al aplicar filtros. Intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  private getDateISO(datetime: any): string {
    const val = String(datetime?.value || '').toLowerCase();
    if (val.includes('ahora') || val.startsWith('hoy') || datetime?.type === 'quick') {
      const d = new Date();
      if (val.includes('mañana')) d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    }
    if (typeof datetime === 'string' && datetime.length >= 10) return datetime.slice(0, 10);
    if (datetime instanceof Date) return datetime.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }

  private getStartTime(datetime: any): string {
    const v = String(datetime?.value || '').toLowerCase();
    if (v.includes('ahora')) {
      const now = new Date();
      // redondear a siguiente media hora
      const minutes = now.getMinutes();
      const toAdd = minutes === 0 ? 0 : (minutes <= 30 ? (30 - minutes) : (60 - minutes));
      now.setMinutes(minutes + toAdd, 0, 0);
      return now.toTimeString().slice(0,5);
    }
    if (v.includes('mañana')) return '09:00';
    if (v.includes('tarde')) return '13:00';
    if (v.includes('noche')) return '19:00';
    if (typeof datetime === 'string' && datetime.includes('T')) return datetime.split('T')[1].slice(0,5);
    return '09:00';
  }

  private getEndTime(datetime: any): string {
    const v = String(datetime?.value || '').toLowerCase();
    if (v.includes('ahora')) {
      const now = new Date();
      // ventana por defecto de 2 horas
      now.setHours(now.getHours() + 2);
      return now.toTimeString().slice(0,5);
    }
    if (v.includes('mañana')) return '12:00';
    if (v.includes('tarde')) return '18:00';
    if (v.includes('noche')) return '22:00';
    if (typeof datetime === 'string' && datetime.includes('T')) {
      const hhmm = datetime.split('T')[1].slice(0,5);
      const [h, m] = hhmm.split(':').map(Number);
      const d = new Date(); d.setHours(h+1, m, 0, 0);
      return d.toTimeString().slice(0,5);
    }
    return '12:00';
  }

  private isNowFilter(datetime: any): boolean {
    const v = String(datetime?.value || '').toLowerCase();
    if (v.includes('ahora') || v.startsWith('hoy')) return true;
    // Si es un datetime-string igual a hoy +/- 2h, considerar "ahora"
    if (typeof datetime === 'string' && datetime.includes('T')) {
      const datePart = datetime.slice(0,10);
      const today = new Date().toISOString().slice(0,10);
      return datePart === today;
    }
    if (datetime instanceof Date) {
      const today = new Date().toISOString().slice(0,10);
      return datetime.toISOString().slice(0,10) === today;
    }
    return false;
  }

  applyFilters() {
    console.log('[EXPLORAR] Aplicando filtros básicos...');
    this.loading = true;
    this.searchError = '';

    const filters: SearchFilters = {
      search: this.searchTerm,
      category: this.selectedCategory,
      location: this.selectedLocation,
      limit: 20,
      offset: 0
    };

    // Agregar filtros de precio si están definidos
    if (this.selectedPriceRange) {
      const priceRange = this.parsePriceRange(this.selectedPriceRange);
      if (priceRange.min !== undefined) filters.price_min = priceRange.min;
      if (priceRange.max !== undefined) filters.price_max = priceRange.max;
    }

    this.searchService.searchAll(filters).subscribe({
      next: (results) => {
        console.log('[EXPLORAR] ✅ Filtros básicos aplicados:', {
          providers: results.providers.data.length,
          services: results.services.data.length
        });

        this.filteredProviders = results.providers.data;
        this.filteredServices = results.services.data;

        // Update map markers based on filtered results
        this.generateMapMarkers();
        this.generateProfessionalCards();
        this.generateMapCardMarkers();

        this.loading = false;
        this.updateMapPanelTitle();
      },
      error: (error) => {
        console.error('[EXPLORAR] ❌ Error aplicando filtros básicos:', error);
        this.searchError = 'Error al aplicar filtros. Intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  private parsePriceRange(range: string): { min?: number; max?: number } {
    switch (range) {
      case '0-10000':
        return { min: 0, max: 10000 };
      case '10001-25000':
        return { min: 10001, max: 25000 };
      case '25001-50000':
        return { min: 25001, max: 50000 };
      case '50001+':
        return { min: 50001 };
      default:
        return {};
    }
  }

  private isInPriceRange(price: number, range: string): boolean {
    switch (range) {
      case '0-10000':
        return price <= 10000;
      case '10001-25000':
        return price > 10000 && price <= 25000;
      case '25001-50000':
        return price > 25000 && price <= 50000;
      case '50001+':
        return price > 50000;
      default:
        return true;
    }
  }

  clearFilters() {
    console.log('[EXPLORAR] Limpiando filtros...');
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedLocation = '';
    this.selectedPriceRange = '';
    this.selectedService = '';
    this.selectedLocationId = '';
    this.selectedDateTime = null;
    this.searchError = '';
    
    // Recargar datos sin filtros
    this.loadData();
    this.updateMapPanelTitle();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  viewProviderProfile(providerId: number, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    console.log('Ver perfil del proveedor:', providerId);
    // Navigate to worker profile with dynamic route
    this.router.navigate(['/client/explorar', providerId]);
  }

  toggleFavorite(providerId: number) {
    const provider = this.providers.find(p => p.id === providerId);
    if (provider) {
      provider.is_favorite = !provider.is_favorite;
    }
    // TODO: Implementar API call para guardar favorito
  }

  bookService(serviceId: number) {
    console.log('Reservar servicio:', serviceId);
    // Implement booking logic
  }

  toggleServiceFavorite(serviceId: number) {
    const service = this.services.find(s => s.id === serviceId);
    if (service) {
      service.is_favorite = !service.is_favorite;
    }
    // TODO: Implementar API call para guardar favorito
  }

  showCategories() {
    console.log('Mostrar categorías');
    // Implement categories modal or navigation
  }

  // Map methods
  generateMapMarkers() {
    this.mapMarkers = [];
    
    // Generate markers from providers
    this.providers.forEach(provider => {
      this.mapMarkers.push({
        id: `provider-${provider.id}`,
        name: provider.name,
        position: {
          lat: this.mapCenter.lat + (Math.random() - 0.5) * 0.1,
          lng: this.mapCenter.lng + (Math.random() - 0.5) * 0.1
        },
        type: 'provider',
        data: provider,
        icon: 'user',
        color: '#3b82f6'
      });
    });

    // Generate markers from services
    this.services.forEach(service => {
      this.mapMarkers.push({
        id: `service-${service.id}`,
        name: service.name,
        position: {
          lat: this.mapCenter.lat + (Math.random() - 0.5) * 0.1,
          lng: this.mapCenter.lng + (Math.random() - 0.5) * 0.1
        },
        type: 'service',
        data: service,
        icon: 'briefcase',
        color: '#10b981'
      });
    });
  }

  // Map Card methods
  generateProfessionalCards() {
    this.professionalCards = this.providers.map(provider => ({
      id: provider.id.toString(),
      name: provider.name,
      profession: provider.profession,
      avatar: provider.avatar_url || `https://placehold.co/64x64/C7D2FE/4338CA?text=${provider.name.charAt(0)}`,
      rating: provider.rating,
      reviews: provider.review_count,
      description: provider.description,
      location: provider.location,
      price: this.services.find(s => s.provider?.id === provider.id || s.provider_id === provider.id)?.price?.toString() || 'Consultar',
      isHighlighted: provider.id === 1 // Highlight first provider
    }));

    // Set highlighted professional (first one)
    this.highlightedProfessional = this.professionalCards[0] || null;
  }

  generateMapCardMarkers() {
    this.mapCardMarkers = this.providers.map(provider => ({
      id: `provider-${provider.id}`,
      name: provider.name,
      position: {
        lat: this.mapCenter.lat + (Math.random() - 0.5) * 0.1,
        lng: this.mapCenter.lng + (Math.random() - 0.5) * 0.1
      },
      type: 'provider' as const,
      data: provider,
      icon: 'user',
      color: '#3b82f6'
    }));
  }

  onProfessionalClick(professional: ProfessionalCard) {
    console.log('Professional clicked:', professional);
    const id = Number(professional.id);
    if (!Number.isNaN(id)) {
      this.viewProviderProfile(id);
    }
  }

  onProfessionalBook(professional: ProfessionalCard) {
    console.log('Professional book:', professional);
    // Handle booking - navigate to booking flow
  }

  onMapCardMarkerClick(marker: MapCardMarker) {
    console.log('Map card marker clicked:', marker);
    if (marker.type === 'provider' && (marker as any).data?.id) {
      this.viewProviderProfile(Number((marker as any).data.id));
    }
  }

  onMapCardMarkerAction(event: { marker: MapCardMarker; action: string }) {
    console.log('Map card marker action:', event);
    const { marker, action } = event;
    if (action === 'view') {
      if (marker.type === 'provider' && (marker as any).data?.id) {
        this.viewProviderProfile(Number((marker as any).data.id));
        return;
      }
      if (marker.type === 'service') {
        const data: any = (marker as any).data;
        const providerId = data?.provider?.id || data?.provider_id;
        if (providerId) {
          this.viewProviderProfile(Number(providerId));
          return;
        }
      }
    }
  }

  onMapCardViewModeChange(mode: 'map' | 'list') {
    console.log('Map card view mode changed to:', mode);
    // Handle view mode change
  }

  onMapCardSearchHere(evt: { center: { lat: number; lng: number }, radiusKm: number }) {
    console.log('[EXPLORAR] Buscar en esta zona:', evt);
    this.loading = true;
    this.searchError = '';

    // marcar búsqueda por mapa activa y guardar radio
    this.nearbyActive = true;
    this.mapRadiusKm = evt.radiusKm;

    this.searchService.searchNearbyProviders({
      lat: evt.center.lat,
      lng: evt.center.lng,
      radius_km: evt.radiusKm,
      search: this.selectedService || this.searchTerm || '',
      category: this.selectedCategory || '',
      rating_min: undefined,
      limit: 20,
      offset: 0
    }).subscribe({
      next: (resp) => {
        console.log('[EXPLORAR] Nearby resultados:', resp.data.length);
        // Mapear a providers mínimos para reutilizar render actual
        this.filteredProviders = resp.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: '',
          profession: p.profession,
          description: p.description,
          rating: p.rating,
          review_count: p.reviews,
          avatar_url: p.avatar_url,
          location: p.location,
          services_count: 0,
          experience_years: 0,
          is_online: p.is_online,
          services: []
        }));

        // Actualizar mapa y tarjetas
        this.providers = this.filteredProviders;
        this.generateProfessionalCards();
        this.mapCenter = evt.center;
        this.mapCardMarkers = this.filteredProviders.map(provider => ({
          id: `provider-${provider.id}`,
          name: provider.name,
          position: { lat: evt.center.lat + (Math.random() - 0.5) * 0.02, lng: evt.center.lng + (Math.random() - 0.5) * 0.02 },
          type: 'provider' as const,
          data: provider,
          icon: 'user',
          color: provider.is_online ? '#10b981' : '#9CA3AF'
        }));

        this.loading = false;
        this.updateMapPanelTitle();
      },
      error: (err) => {
        console.error('[EXPLORAR] Error nearby:', err);
        this.searchError = 'Error al buscar en esta zona';
        this.loading = false;
      }
    });
  }

  onUseCurrentLocation(coords: { lat: number; lng: number }) {
    console.log('[EXPLORAR] Usar ubicación actual:', coords);
    this.mapCenter = { lat: coords.lat, lng: coords.lng };
    // Disparar nearby con radio por defecto (10km)
    this.onMapCardSearchHere({ center: this.mapCenter, radiusKm: this.mapRadiusKm || 10 });
    this.updateMapPanelTitle();
  }

  onMarkerClick(marker: any) {
    console.log('Marker clicked:', marker);
    // Handle marker click - could show details, navigate, etc.
  }

  onMarkerAction(event: { marker: any; action: string }) {
    console.log('Marker action:', event);
    const { marker, action } = event;
    
    switch (action) {
      case 'view':
        this.viewMarkerDetails(marker);
        break;
      case 'book':
        this.bookMarkerService(marker);
        break;
    }
  }

  onViewModeChange(mode: 'map' | 'list') {
    console.log('View mode changed to:', mode);
    // Handle view mode change
  }

  onBoundsChange(bounds: any) {
    console.log('Map bounds changed:', bounds);
    // Handle bounds change - could filter results based on visible area
  }

  onCenterChange(center: { lat: number; lng: number }) {
    console.log('Map center changed:', center);
    this.mapCenter = center;
  }

  private viewMarkerDetails(marker: any) {
    // Show marker details in a modal or navigate to details page
    console.log('Viewing details for:', marker.name);
  }

  private bookMarkerService(marker: any) {
    // Handle booking for the marker's service
    if (marker.type === 'service') {
      this.bookService(marker.data.id);
    } else if (marker.type === 'provider') {
      // Navigate to provider's services
      console.log('Navigate to provider services:', marker.data.id);
    }
  }

  private updateMapPanelTitle() {
    const serviceLabelRaw = (this.selectedService || this.searchTerm || 'profesionales').trim();
    const serviceLabel = serviceLabelRaw ? serviceLabelRaw : 'profesionales';
    // Usar comuna si está en filtros básicos; si no, intentar derivar de locations id si fuese necesario
    const locationLabel = this.selectedLocation || '';
    let phrase = `${serviceLabel} disponibles`;
    if (locationLabel) {
      phrase += ` en ${locationLabel}`;
    }
    this.mapPanelTitle = phrase;
  }
}