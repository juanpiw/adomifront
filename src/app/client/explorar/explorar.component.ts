import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
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
import { NotificationService } from '../../../libs/shared-ui/notifications/services/notification.service';
import { UiReferralInviteEmptyComponent } from '../../../libs/shared-ui/referrals/referral-invite-empty.component';
import { finalize } from 'rxjs/operators';

// Interfaces moved to search.service.ts

interface ProviderCoordinates {
  lat: number;
  lng: number;
  source: 'live' | 'nearby' | 'primary';
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  updatedAt?: string | null;
}

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SearchInputComponent, MapCardComponent, ProfileRequiredModalComponent, UiReferralInviteEmptyComponent],
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
              <div style="position: relative; display: inline-block;">
                <img [src]="resolveAvatar(provider.avatar_url, provider.name)" 
                     [alt]="provider.name" 
                     class="w-14 h-14 rounded-full object-cover">
                <span class="status-dot" [class.online]="provider.is_online === true" [class.offline]="provider.is_online === false"></span>
              </div>
              <div class="ml-4">
                <p class="font-bold text-lg text-gray-900">{{ provider.name }}</p>
                <p class="text-sm text-gray-500">{{ provider.profession }}</p>
                <div class="verified-badge" *ngIf="provider.is_verified" title="Identidad validada por el equipo de Adomi">
                  <ui-icon name="shield-check" class="w-3.5 h-3.5 mr-1"></ui-icon>
                  Identidad verificada
                </div>
                <p class="text-xs text-gray-500 flex items-center mt-1" *ngIf="provider.location">
                  <ui-icon name="map-pin" class="w-3 h-3 mr-1"></ui-icon>
                  {{ provider.location }}
                </p>
              </div>
            </div>
            <p class="text-gray-600 text-sm mb-4">{{ provider.description }}</p>
            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <div class="flex items-center">
                <ui-icon name="star" class="w-5 h-5 text-yellow-400"></ui-icon>
                <span class="text-gray-800 font-bold ml-1.5">{{ provider.rating }}</span>
                <span class="text-gray-400 text-sm ml-2">({{ provider.review_count }})</span>
              </div>
              <div class="flex items-center gap-3">
                <span *ngIf="provider.min_price !== undefined" class="text-sm text-slate-700 font-semibold whitespace-nowrap">Desde &#36;{{ provider.min_price | number:'1.0-0' }}</span>
                <a class="ver-perfil-link" (click)="viewProviderProfile(provider.id, $event)">
                  Ver Perfil
                </a>
              </div>
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
      <ng-container *ngIf="!loading && filteredProviders.length === 0 && filteredServices.length === 0">
        <ng-container *ngIf="searchTerm; else genericNoResults">
          <div *ngIf="searchTermInvalidReason === 'offensive'" class="no-results invalid-term text-center py-10">
            <ui-icon name="alert-triangle" class="w-12 h-12 text-amber-500 mx-auto mb-3"></ui-icon>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Este término no es válido</h3>
            <p class="text-gray-600 mb-4">Por favor, intenta con otra palabra más adecuada.</p>
            <button (click)="clearFilters()" class="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition">
              Limpiar búsqueda
            </button>
          </div>

          <div *ngIf="searchTermInvalidReason === 'too_short'" class="no-results invalid-term text-center py-10">
            <ui-icon name="type" class="w-12 h-12 text-indigo-500 mx-auto mb-3"></ui-icon>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Tu búsqueda es muy corta</h3>
            <p class="text-gray-600">Ingresa al menos 2 caracteres para buscar un servicio.</p>
          </div>

        <ui-referral-invite-empty
          *ngIf="!searchTermInvalidReason"
          class="referral-section"
          [searchTerm]="validatedTerm?.sanitized || searchTerm"
          [locationLabel]="locationDisplayLabel"
          [shareDisabled]="referralLoadingChannel !== null"
          [loadingChannel]="referralLoadingChannel"
          [copySuccess]="referralCopySuccess"
          [emailSuccess]="referralEmailSuccess"
          (whatsapp)="onReferralShare('whatsapp')"
          (copy)="onReferralShare('copy')"
          (emailInvite)="onReferralEmail($event)">
        </ui-referral-invite-empty>
        </ng-container>

        <ng-template #genericNoResults>
          <div class="no-results text-center py-12">
            <ui-icon name="search" class="w-16 h-16 text-gray-400 mx-auto mb-4"></ui-icon>
            <h3 class="text-xl font-bold text-gray-800 mb-2">No se encontraron resultados</h3>
            <p class="text-gray-600 mb-6">Intenta ajustar tus filtros de búsqueda</p>
            <button (click)="clearFilters()" class="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition">
              Limpiar Filtros
            </button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private profileValidation = inject(ProfileValidationService);
  private auth = inject(AuthService);
  private searchService = inject(SearchService);
  private notifications = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

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
  validatedTerm: { sanitized: string; normalized: string } | null = null;
  searchTermInvalidReason: '' | 'too_short' | 'offensive' = '';
  referralLoadingChannel: 'email' | 'whatsapp' | 'copy' | null = null;
  referralCopySuccess = false;
  referralEmailSuccess = false;
  private referralCopyTimeout: any;
  private referralLinkCache: string | null = null;
  private isBrowser = false;
  private liveLocationLabels = new Map<number, string>();
  private reverseGeocodeCache = new Map<string, string>();
  private pendingReverseGeocode = new Set<number>();
  private refreshCardsTimeout: any = null;
  private hasAutoCentered = false;
  get locationDisplayLabel(): string | null {
    if (this.selectedLocation) return this.selectedLocation;
    if (this.selectedLocationId) {
      const match = this.locations.find(loc => (loc as any).id === this.selectedLocationId || loc.commune === this.selectedLocationId);
      if (match) {
        return match.commune ? `${match.commune}, ${match.region}` : match.region;
      }
    }
    return null;
  }

  ngOnInit() {
    console.log('[EXPLORAR] ngOnInit iniciado');
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
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

  ngOnDestroy(): void {
    if (this.referralCopyTimeout) {
      clearTimeout(this.referralCopyTimeout);
    }
    if (this.refreshCardsTimeout) {
      clearTimeout(this.refreshCardsTimeout);
      this.refreshCardsTimeout = null;
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
    this.hasAutoCentered = false;
    this.searchError = '';
    this.searchTermInvalidReason = '';
    this.validatedTerm = null;
    this.referralLinkCache = null;
    this.referralCopySuccess = false;
    this.referralEmailSuccess = false;

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

        this.onProvidersUpdated(this.providers);

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
    this.hasAutoCentered = false;
    this.searchError = '';
    this.searchTermInvalidReason = '';

    const price = this.getPriceRange(this.selectedPriceRange);
    const baseFilters: SearchFilters = {
      location: this.selectedLocationId,
      price_min: price.min === null ? undefined : price.min,
      price_max: price.max === null ? undefined : price.max,
      limit: 20,
      offset: 0
    };

    const hasDateTime = !!(this.selectedDateTime && (this.selectedDateTime.value || this.selectedDateTime.type));
    const termForValidation = (this.selectedService || this.searchTerm || '').trim();

    const runSearch = (sanitizedTerm?: string) => {
      const searchTerm = sanitizedTerm || (termForValidation || '');
      const filters: SearchFilters = { ...baseFilters };
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const request$ = hasDateTime
        ? this.searchService.searchAvailableProviders({
            date: this.getDateISO(this.selectedDateTime),
            start: this.getStartTime(this.selectedDateTime),
            end: this.getEndTime(this.selectedDateTime),
            location: this.selectedLocationId || '',
            category: searchTerm,
            limit: 20,
            offset: 0,
            is_now: this.isNowFilter(this.selectedDateTime)
          })
        : (this.searchService.searchAll(filters) as any);

      (request$ as any).subscribe({
        next: (results: any) => {
          if (hasDateTime) {
            console.log('[EXPLORAR] ✅ Filtros aplicados (disponibilidad):', { providers: results.data.length });
            this.filteredProviders = results.data;
            this.filteredServices = [];
            this.providers = [...this.filteredProviders];
            this.services = [];

            this.onProvidersUpdated(this.providers);
          } else {
            console.log('[EXPLORAR] ✅ Filtros aplicados:', {
              providers: results.providers.data.length,
              services: results.services.data.length
            });
            this.providers = results.providers.data;
            this.services = results.services.data;
            this.filteredProviders = this.providers.map((p: any) => {
              let minPrice: number | undefined = undefined;
              if (Array.isArray(p.services) && p.services.length > 0) {
                try {
                  const prices = p.services.map((s: any) => Number(s.price)).filter((n: number) => Number.isFinite(n));
                  if (prices.length > 0) minPrice = Math.min(...prices);
                } catch {}
              }
              return { ...p, min_price: minPrice };
            });
            this.filteredServices = this.services;

            this.onProvidersUpdated(this.providers);
          }

          this.generateMapMarkers();
          this.generateProfessionalCards();
          this.generateMapCardMarkers();

          this.loading = false;
          console.log('[EXPLORAR] 🔍 Estado post búsqueda avanzada', {
            searchInput: this.searchTerm,
            sanitizedTerm: sanitizedTerm || null,
            filteredProviders: this.filteredProviders.length,
            filteredServices: this.filteredServices.length,
            searchTermInvalidReason: this.searchTermInvalidReason || null
          });
        },
        error: (error: any) => {
          console.error('[EXPLORAR] ❌ Error aplicando filtros:', error);
          this.searchError = 'Error al aplicar filtros. Intenta nuevamente.';
          this.loading = false;
        }
      });
    };

    if (termForValidation) {
      this.searchService.validateSearchTerm(termForValidation).subscribe({
        next: (validation) => {
          if (!validation.ok) {
            this.validatedTerm = null;
            this.searchTermInvalidReason = (validation.reason as any) || 'too_short';
            this.filteredProviders = [];
            this.filteredServices = [];
            this.mapMarkers = [];
            this.mapCardMarkers = [];
            this.professionalCards = [];
            this.highlightedProfessional = null;
            this.loading = false;
            console.warn('[EXPLORAR] ⚠️ Término inválido (avanzado)', {
              original: termForValidation,
              reason: this.searchTermInvalidReason
            });
            return;
          }

          this.validatedTerm = {
            sanitized: validation.sanitized,
            normalized: validation.normalized
          };
          this.searchTermInvalidReason = '';
          runSearch(validation.sanitized);
        },
        error: (error) => {
          console.error('[EXPLORAR] ❌ Error validando término (avanzado):', error);
          this.searchError = 'No pudimos validar tu búsqueda. Intenta nuevamente.';
          this.loading = false;
        }
      });
      return;
    }

    this.validatedTerm = null;
    this.searchTermInvalidReason = '';
    runSearch();
  }

  // Helper único para convertir el rango de precio del UI a min/max
  private getPriceRange(range: string | null | undefined): { min: number | null; max: number | null } {
    if (!range) return { min: null, max: null };
    if (range === '0-10000') return { min: 0, max: 10000 };
    if (range === '10001-25000') return { min: 10001, max: 25000 };
    if (range === '25001-50000') return { min: 25001, max: 50000 };
    if (range === '50001+') return { min: 50001, max: null };
    return { min: null, max: null };
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
    this.hasAutoCentered = false;
    this.searchError = '';
    this.referralCopySuccess = false;
    this.referralEmailSuccess = false;
    if (this.referralCopyTimeout) {
      clearTimeout(this.referralCopyTimeout);
      this.referralCopyTimeout = null;
    }
    this.referralLinkCache = null;

    const baseFilters: SearchFilters = {
      search: '',
      category: this.selectedCategory,
      location: this.selectedLocation,
      limit: 20,
      offset: 0
    };

    if (this.selectedPriceRange) {
      const priceRange = this.parsePriceRange(this.selectedPriceRange);
      if (priceRange.min !== undefined) baseFilters.price_min = priceRange.min;
      if (priceRange.max !== undefined) baseFilters.price_max = priceRange.max;
    }

    const performSearch = (filters: SearchFilters) => {
      this.searchService.searchAll(filters).subscribe({
        next: (results) => {
          console.log('[EXPLORAR] ✅ Filtros básicos aplicados:', {
            providers: results.providers.data.length,
            services: results.services.data.length
          });

          this.providers = results.providers.data;
          this.services = results.services.data;
          this.filteredProviders = [...results.providers.data];
          this.filteredServices = [...results.services.data];

          this.onProvidersUpdated(this.providers);

          this.generateMapMarkers();
          this.generateProfessionalCards();
          this.generateMapCardMarkers();

          this.loading = false;
          this.updateMapPanelTitle();
          console.log('[EXPLORAR] 🔍 Render state post-search', {
            searchTerm: this.searchTerm,
            sanitized: this.validatedTerm?.sanitized,
            searchTermInvalidReason: this.searchTermInvalidReason,
            filteredProviders: this.filteredProviders.length,
            filteredServices: this.filteredServices.length
          });
        },
        error: (error) => {
          console.error('[EXPLORAR] ❌ Error aplicando filtros básicos:', error);
          this.searchError = 'Error al aplicar filtros. Intenta nuevamente.';
          this.loading = false;
        }
      });
    };

    const term = (this.searchTerm || '').trim();
    if (term) {
      this.searchService.validateSearchTerm(term).subscribe({
        next: (validation) => {
          if (!validation.ok) {
            this.validatedTerm = null;
            this.searchTermInvalidReason = (validation.reason as any) || 'too_short';
            if (this.searchTermInvalidReason === 'too_short') {
              this.searchError = 'Ingresa al menos 2 caracteres para buscar.';
            } else {
              this.searchError = '';
            }
            this.filteredProviders = [];
            this.filteredServices = [];
            this.professionalCards = [];
            this.mapCardMarkers = [];
            this.mapMarkers = [];
            this.highlightedProfessional = null;
            this.loading = false;
            this.updateMapPanelTitle();
            return;
          }

          this.validatedTerm = {
            sanitized: validation.sanitized,
            normalized: validation.normalized
          };
          this.searchTermInvalidReason = '';
          console.log('[EXPLORAR] ✅ Término validado', this.validatedTerm);
          const filters = { ...baseFilters, search: validation.sanitized };
          performSearch(filters);
        },
        error: (error) => {
          console.error('[EXPLORAR] ❌ Error validando término de búsqueda:', error);
          this.searchError = 'No pudimos validar tu búsqueda. Intenta nuevamente.';
          this.loading = false;
        }
      });
      return;
    }

    this.validatedTerm = null;
    this.searchTermInvalidReason = '';
    performSearch(baseFilters);
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
    this.hasAutoCentered = false;
    this.selectedCategory = '';
    this.selectedLocation = '';
    this.selectedPriceRange = '';
    this.selectedService = '';
    this.selectedLocationId = '';
    this.selectedDateTime = null;
    this.searchError = '';
    this.validatedTerm = null;
    this.searchTermInvalidReason = '';
    this.referralLinkCache = null;
    this.referralCopySuccess = false;
    this.referralEmailSuccess = false;
    if (this.referralCopyTimeout) {
      clearTimeout(this.referralCopyTimeout);
      this.referralCopyTimeout = null;
    }
    this.referralLoadingChannel = null;
    
    // Recargar datos sin filtros
    this.loadData();
    this.updateMapPanelTitle();
  }

  onReferralShare(channel: 'whatsapp' | 'copy') {
    if (!this.validatedTerm) {
      this.pushNotification('Agrega un servicio para invitar', 'Busca un servicio específico y vuelve a intentarlo.');
      return;
    }

    if (this.referralLoadingChannel) {
      return;
    }

    this.referralLoadingChannel = channel;
    this.referralCopySuccess = false;
    this.referralEmailSuccess = false;

    const payload = {
      searchTerm: this.validatedTerm.sanitized,
      channel,
      source: 'explore-empty' as const,
      locationLabel: this.selectedLocation || ''
    };

    this.searchService.sendReferralInvite(payload)
      .pipe(finalize(() => {
        this.referralLoadingChannel = null;
      }))
      .subscribe({
        next: (resp) => {
          const link = resp.referralLink || this.buildReferralLinkFallback(this.validatedTerm!.normalized, channel);
          this.referralLinkCache = link;

          if (channel === 'whatsapp') {
            if (isPlatformBrowser(this.platformId)) {
              const message = this.buildWhatsappMessage(link);
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }
            this.pushNotification('Listo para compartir', 'Abre WhatsApp y envía la invitación.');
          } else {
            if (isPlatformBrowser(this.platformId) && typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(this.buildCopyMessage(link)).then(() => {
                this.referralCopySuccess = true;
                this.scheduleCopyReset();
                this.pushNotification('Enlace copiado', 'Pega el mensaje en tu red favorita.');
              }).catch(() => {
                this.pushNotification('No se pudo copiar', `Comparte este enlace: ${link}`, 'high');
              });
            } else {
              this.pushNotification('Comparte este enlace', link, 'medium');
            }
          }
        },
        error: () => {
          this.pushNotification('No se pudo generar la invitación', 'Inténtalo nuevamente en unos minutos.', 'high');
        }
      });
  }

  onReferralEmail(email: string) {
    if (!this.validatedTerm) {
      this.pushNotification('Agrega un servicio para invitar', 'Busca un servicio específico y vuelve a intentarlo.');
      return;
    }

    this.referralLoadingChannel = 'email';
    this.referralEmailSuccess = false;
    this.referralCopySuccess = false;
    if (this.referralCopyTimeout) {
      clearTimeout(this.referralCopyTimeout);
      this.referralCopyTimeout = null;
    }

    this.searchService.sendReferralInvite({
      searchTerm: this.validatedTerm.sanitized,
      channel: 'email',
      inviteeEmail: email,
      source: 'explore-empty',
      locationLabel: this.selectedLocation || ''
    })
    .pipe(finalize(() => {
      this.referralLoadingChannel = null;
    }))
    .subscribe({
      next: (resp) => {
        if (resp.referralLink) {
          this.referralLinkCache = resp.referralLink;
        }
        if (resp.emailSent) {
          this.referralEmailSuccess = true;
          this.pushNotification('Invitación enviada', 'Le avisaremos a tu contacto por correo.');
        } else {
          this.pushNotification('No se pudo enviar el correo', 'Comparte el enlace manualmente mientras configuramos el correo.', 'medium');
        }
      },
      error: () => {
        this.pushNotification('No pudimos enviar el correo', 'Inténtalo nuevamente más tarde.', 'high');
      }
    });
  }

  private buildWhatsappMessage(link: string): string {
    const service = this.validatedTerm?.sanitized || this.searchTerm || 'este servicio';
    const location = this.selectedLocation ? ` en ${this.selectedLocation}` : '';
    return `Estoy buscando "${service}"${location} en AdomiApp y aún no tenemos profesionales. ¡Súmate y ofrece tus servicios aquí! ${link}`;
  }

  private buildCopyMessage(link: string): string {
    return this.buildWhatsappMessage(link);
  }

  private buildReferralLinkFallback(normalizedTerm: string, channel: 'email' | 'whatsapp' | 'copy'): string {
    const slug = normalizedTerm.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'servicio';
    const base = this.publicAppUrl();
    const params = new URLSearchParams({
      ref: 'explore-empty',
      term: slug,
      utm_source: 'referral',
      utm_medium: channel,
      utm_campaign: 'explore-empty'
    });
    return `${base}/auth/register?${params.toString()}`;
  }

  private publicAppUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      return window.location.origin;
    }
    return 'https://adomiapp.com';
  }

  private scheduleCopyReset() {
    if (this.referralCopyTimeout) {
      clearTimeout(this.referralCopyTimeout);
    }
    this.referralCopyTimeout = setTimeout(() => {
      this.referralCopySuccess = false;
    }, 2500);
  }

  private pushNotification(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'low') {
    try {
      if (typeof this.notifications.setUserProfile === 'function') {
        this.notifications.setUserProfile('client');
      }
      this.notifications.createNotification({
        type: 'system',
        profile: 'client',
        title,
        message,
        priority,
        actions: []
      });
    } catch (error) {
      console.warn('[EXPLORAR] No se pudo mostrar notificación:', error);
    }
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
    const markers: any[] = [];

    this.providers.forEach(provider => {
      const coords = this.resolveProviderCoordinates(provider);
      if (!coords) return;
      markers.push({
        id: `provider-${provider.id}`,
        name: provider.name,
        position: { lat: coords.lat, lng: coords.lng },
        type: 'provider',
        data: {
          ...provider,
          liveLocationSource: coords.source,
          liveLocationLabel: coords.source === 'live' ? this.liveLocationLabels.get(provider.id) || null : null,
          liveLocationUpdatedAt: coords.updatedAt || provider.current_location_updated_at || provider.live_location?.updated_at || null,
          liveLocationAccuracy: coords.accuracy ?? provider.current_location_accuracy ?? provider.live_location?.accuracy ?? null,
          liveLocationSpeed: coords.speed ?? provider.current_location_speed ?? provider.live_location?.speed ?? null,
          liveLocationHeading: coords.heading ?? provider.current_location_heading ?? provider.live_location?.heading ?? null
        },
        icon: coords.source === 'live' ? 'map-pin' : 'user',
        color: coords.source === 'live' ? '#f97316' : '#3b82f6'
      });
    });

    this.mapMarkers = markers;
  }

  // Map Card methods
  generateProfessionalCards() {
    const source = this.nearbyActive ? this.providers : this.filteredProviders;
    this.professionalCards = source.map((provider, index) => {
      const coords = this.resolveProviderCoordinates(provider);
      if (coords?.source === 'live') {
        this.ensureLiveLocationLabel(provider, coords);
      }

      const relatedService = this.services.find(s => s.provider?.id === provider.id || s.provider_id === provider.id);

      return {
        id: provider.id.toString(),
        name: provider.name,
        profession: provider.profession,
        avatar: this.resolveAvatar(provider.avatar_url, provider.name, 64),
        rating: provider.rating,
        reviews: provider.review_count,
        description: provider.description,
        location: this.getProviderLocationLabel(provider, coords),
        price: relatedService?.price !== undefined ? relatedService.price.toString() : 'Consultar',
        isHighlighted: index === 0,
        isOnline: provider.is_online === true,
        isVerified: provider.is_verified === true,
        verificationStatus: provider.verification_status
      };
    });

    this.highlightedProfessional = this.professionalCards[0] || null;
  }

  // Unificar URL de avatar con base API en producción
  resolveAvatar(raw: string | undefined | null, name: string, size: number = 64): string {
    const initial = (name || 'U').charAt(0).toUpperCase();
    const placeholder = `https://placehold.co/${size}x${size}/C7D2FE/4338CA?text=${encodeURIComponent(initial)}`;
    if (!raw || raw.trim() === '') return '/assets/default-avatar.png';
    // Absoluta
    if (/^https?:\/\//i.test(raw)) {
      // Reescritura de localhost -> API base (fallback por si el backend no tiene PUBLIC_BASE_URL)
      try {
        const m = raw.match(/^https?:\/\/localhost(?::\d+)?(\/.*)$/i);
        if (m && m[1]) return `${environment.apiBaseUrl}${m[1]}`;
      } catch {}
      return raw;
    }
    // Ruta de uploads (comienza con /uploads)
    if (raw.startsWith('/uploads')) return `${environment.apiBaseUrl}${raw}`;
    // Otros casos: intentar con base URL
    return `${environment.apiBaseUrl}/${raw.replace(/^\//, '')}`;
  }

  generateMapCardMarkers() {
    const source = this.nearbyActive ? this.providers : this.filteredProviders;
    const markers: MapCardMarker[] = [];

    source.forEach(provider => {
      const coords = this.resolveProviderCoordinates(provider);
      if (!coords) return;
      const marker: MapCardMarker = {
        id: `provider-${provider.id}`,
        name: provider.name,
        position: { lat: coords.lat, lng: coords.lng },
        type: 'provider',
        data: {
          ...provider,
          liveLocationSource: coords.source,
          liveLocationLabel: coords.source === 'live' ? this.liveLocationLabels.get(provider.id) || null : null,
          liveLocationUpdatedAt: coords.updatedAt || provider.current_location_updated_at || provider.live_location?.updated_at || null,
          liveLocationAccuracy: coords.accuracy ?? provider.current_location_accuracy ?? provider.live_location?.accuracy ?? null,
          liveLocationSpeed: coords.speed ?? provider.current_location_speed ?? provider.live_location?.speed ?? null,
          liveLocationHeading: coords.heading ?? provider.current_location_heading ?? provider.live_location?.heading ?? null
        },
        icon: coords.source === 'live' ? 'map-pin' : 'user',
        color: coords.source === 'live'
          ? '#f97316'
          : provider.is_online === true
            ? '#10b981'
            : '#9CA3AF'
      };
      markers.push(marker);

      if (coords.source === 'live') {
        this.ensureLiveLocationLabel(provider, coords);
      }
    });

    this.mapCardMarkers = markers;

    if (!this.nearbyActive && !this.hasAutoCentered && markers.length) {
      this.mapCenter = { ...markers[0].position };
      this.hasAutoCentered = true;
    }
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
    const id = Number(professional.id);
    if (!Number.isNaN(id)) {
      this.viewProviderProfile(id);
      return;
    }
    console.warn('[EXPLORAR] No se pudo navegar al perfil, id inválido:', professional.id);
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
          lat: p.lat,
          lng: p.lng,
          services_count: 0,
          experience_years: 0,
          is_online: p.is_online,
          share_real_time_location: p.share_real_time_location,
          current_lat: p.current_lat ?? p.live_location?.lat ?? null,
          current_lng: p.current_lng ?? p.live_location?.lng ?? null,
          current_location_accuracy: p.current_location_accuracy ?? p.live_location?.accuracy ?? null,
          current_location_speed: p.current_location_speed ?? p.live_location?.speed ?? null,
          current_location_heading: p.current_location_heading ?? p.live_location?.heading ?? null,
          current_location_updated_at: p.current_location_updated_at ?? p.live_location?.updated_at ?? null,
          primary_lat: p.primary_lat ?? p.primary_location?.lat ?? null,
          primary_lng: p.primary_lng ?? p.primary_location?.lng ?? null,
          primary_commune: p.primary_commune ?? p.primary_location?.commune ?? null,
          primary_region: p.primary_region ?? p.primary_location?.region ?? null,
          live_location: p.live_location ?? null,
          primary_location: p.primary_location ?? null,
          distance_km: p.distance_km ?? null,
          services: []
        }));

        // Actualizar mapa y tarjetas
        this.providers = this.filteredProviders;
        this.onProvidersUpdated(this.providers);
        this.generateProfessionalCards();
        this.mapCenter = evt.center;
        this.mapCardMarkers = this.filteredProviders.map(provider => ({
          id: `provider-${provider.id}`,
          name: provider.name,
          position: (provider as any).lat && (provider as any).lng
            ? { lat: Number((provider as any).lat), lng: Number((provider as any).lng) }
            : { lat: evt.center.lat + (Math.random() - 0.5) * 0.02, lng: evt.center.lng + (Math.random() - 0.5) * 0.02 },
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

  private onProvidersUpdated(providers: Provider[]): void {
    const activeIds = new Set<number>(providers.map(p => p.id));
    // Depurar labels en vivo que ya no corresponden
    for (const providerId of Array.from(this.liveLocationLabels.keys())) {
      if (!activeIds.has(providerId)) {
        this.liveLocationLabels.delete(providerId);
      }
    }

    providers.forEach(provider => {
      const coords = this.resolveProviderCoordinates(provider);
      if (coords?.source === 'live') {
        this.ensureLiveLocationLabel(provider, coords);
      }
    });
  }

  private resolveProviderCoordinates(provider: Provider): ProviderCoordinates | null {
    const liveLat = this.normalizeCoordinate(provider.current_lat ?? provider.live_location?.lat);
    const liveLng = this.normalizeCoordinate(provider.current_lng ?? provider.live_location?.lng);
    if (liveLat !== null && liveLng !== null) {
      return {
        lat: liveLat,
        lng: liveLng,
        source: 'live',
        accuracy: this.normalizeCoordinate(provider.current_location_accuracy ?? provider.live_location?.accuracy),
        speed: this.normalizeCoordinate(provider.current_location_speed ?? provider.live_location?.speed),
        heading: this.normalizeCoordinate(provider.current_location_heading ?? provider.live_location?.heading),
        updatedAt: provider.current_location_updated_at || provider.live_location?.updated_at || null
      };
    }

    const nearbyLat = this.normalizeCoordinate((provider as any).lat ?? provider.primary_lat);
    const nearbyLng = this.normalizeCoordinate((provider as any).lng ?? provider.primary_lng);
    if (nearbyLat !== null && nearbyLng !== null) {
      return {
        lat: nearbyLat,
        lng: nearbyLng,
        source: 'nearby',
        updatedAt: provider.current_location_updated_at || provider.live_location?.updated_at || null
      };
    }

    const primaryLat = this.normalizeCoordinate(provider.primary_lat);
    const primaryLng = this.normalizeCoordinate(provider.primary_lng);
    if (primaryLat !== null && primaryLng !== null) {
      return {
        lat: primaryLat,
        lng: primaryLng,
        source: 'primary'
      };
    }

    return null;
  }

  private normalizeCoordinate(value: any): number | null {
    if (value === null || value === undefined) return null;
    const numeric = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(numeric) ? Number(numeric) : null;
  }

  private ensureLiveLocationLabel(provider: Provider, coords: ProviderCoordinates): void {
    if (!this.isBrowser || coords.source !== 'live') {
      return;
    }

    const cacheKey = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
    if (this.reverseGeocodeCache.has(cacheKey)) {
      this.liveLocationLabels.set(provider.id, this.reverseGeocodeCache.get(cacheKey)!);
      return;
    }

    if (this.pendingReverseGeocode.has(provider.id)) {
      return;
    }

    const fallback = this.buildPrimaryLocationLabel(provider);
    if (fallback) {
      this.liveLocationLabels.set(provider.id, fallback);
    }

    this.reverseGeocodeLiveLocation(provider.id, coords);
  }

  private reverseGeocodeLiveLocation(providerId: number, coords: ProviderCoordinates): void {
    if (!this.isBrowser) return;
    const apiKey = (environment as any).googleMapsApiKey;
    if (!apiKey) return;

    const cacheKey = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
    if (this.reverseGeocodeCache.has(cacheKey)) {
      this.liveLocationLabels.set(providerId, this.reverseGeocodeCache.get(cacheKey)!);
      return;
    }

    this.pendingReverseGeocode.add(providerId);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&result_type=street_address|route&key=${apiKey}`;

    fetch(url)
      .then(response => response.json())
      .then(result => {
        const formatted = result?.results?.[0]?.formatted_address as string | undefined;
        if (formatted) {
          const shortLabel = formatted.split(',').slice(0, 2).join(', ').trim();
          this.reverseGeocodeCache.set(cacheKey, shortLabel);
          this.liveLocationLabels.set(providerId, shortLabel);
          try {
            this.cdr.detectChanges();
          } catch {}
        }
      })
      .catch(() => {
        // Silenciar errores de geocoding para no afectar la experiencia
      })
      .finally(() => {
        this.pendingReverseGeocode.delete(providerId);
      });
  }

  private getProviderLocationLabel(provider: Provider, coords?: ProviderCoordinates | null): string {
    const baseLabel = this.buildPrimaryLocationLabel(provider) || provider.location || 'Ubicación no disponible';
    if (!coords) {
      return baseLabel;
    }

    if (coords.source === 'live') {
      const liveLabel = this.liveLocationLabels.get(provider.id);
      const timestampLabel = this.formatLiveLocationTimestamp(coords.updatedAt || provider.current_location_updated_at || provider.live_location?.updated_at || null);
      if (liveLabel && timestampLabel) {
        return `${liveLabel} · ${timestampLabel}`;
      }
      if (liveLabel) {
        return liveLabel;
      }
      if (timestampLabel) {
        return `${baseLabel} · ${timestampLabel}`;
      }
      return baseLabel;
    }

    if (coords.source === 'nearby') {
      const distance = this.normalizeCoordinate(provider.distance_km);
      if (distance !== null) {
        const distanceLabel = distance < 10 ? distance.toFixed(1) : distance.toFixed(0);
        return `${baseLabel} · a ${distanceLabel} km`;
      }
    }

    return baseLabel;
  }

  private formatLiveLocationTimestamp(updatedAt?: string | null): string | null {
    if (!updatedAt) return null;
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return null;

    const formatter = new Intl.DateTimeFormat('es-CL', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `Ubicación enviada ${formatter.format(date)}`;
  }

  private buildPrimaryLocationLabel(provider: Provider): string | null {
    const parts: string[] = [];
    const commune = provider.location || provider.primary_commune || provider.primary_location?.commune;
    const region = provider.primary_region || provider.primary_location?.region;

    if (commune) {
      parts.push(commune);
    }
    if (region && (!commune || !String(commune).includes(region))) {
      parts.push(region);
    }

    if (!parts.length) {
      return null;
    }

    return parts.join(', ');
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