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

interface Provider {
  id: number;
  name: string;
  email: string;
  profession: string;
  description: string;
  rating: number;
  review_count: number;
  avatar_url?: string;
  location: string;
  services_count: number;
  experience_years: number;
  is_favorite?: boolean;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  provider_id: number;
  provider_name: string;
  category: string;
  is_favorite?: boolean;
}

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
          ariaLabel="Búsqueda avanzada de servicios"
        ></ui-search-input>
      </header>

      <!-- Filters Section -->
      <div class="filters-section mb-8">
        <div class="flex flex-wrap gap-4 justify-center">
          <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="filter-select">
            <option value="">Todas las Categorías</option>
            <option value="belleza">Belleza</option>
            <option value="salud">Salud</option>
            <option value="hogar">Hogar</option>
            <option value="educacion">Educación</option>
          </select>
          
          <select [(ngModel)]="selectedLocation" (change)="applyFilters()" class="filter-select">
            <option value="">Todas las Ubicaciones</option>
            <option value="santiago">Santiago</option>
            <option value="valparaiso">Valparaíso</option>
            <option value="concepcion">Concepción</option>
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
          [title]="'estilistas disponibles'"
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
  
  // Map Card data
  professionalCards: ProfessionalCard[] = [];
  highlightedProfessional: ProfessionalCard | null = null;
  mapCardMarkers: MapCardMarker[] = [];

  // Data
  providers: Provider[] = [];
  services: Service[] = [];
  filteredProviders: Provider[] = [];
  filteredServices: Service[] = [];

  // State
  loading: boolean = false;

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
      this.loadProviders();
      this.loadServices();
      this.generateMapMarkers();
      this.generateProfessionalCards();
      this.generateMapCardMarkers();
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
    // Load user data from localStorage or service
    const userData = localStorage.getItem('adomi_user');
    if (userData && userData !== 'undefined') {
      try { this.user = JSON.parse(userData); } catch { this.user = null; }
    }
  }

  private loadProviders() {
    this.loading = true;
    // Mock data - replace with actual API call
    this.providers = [
      {
        id: 1,
        name: 'Elena Torres',
        email: 'elena@example.com',
        profession: 'Estilista Profesional',
        description: 'Con más de 10 años de experiencia en color y cortes de vanguardia.',
        rating: 4.9,
        review_count: 85,
        avatar_url: 'https://placehold.co/64x64/C7D2FE/4338CA?text=ET',
        location: 'Santiago',
        services_count: 5,
        experience_years: 10
      },
      {
        id: 2,
        name: 'Mario Rojas',
        email: 'mario@example.com',
        profession: 'Chef a Domicilio',
        description: 'Especialista en cocina mediterránea para eventos privados y cenas.',
        rating: 5.0,
        review_count: 89,
        avatar_url: 'https://placehold.co/64x64/C7D2FE/4338CA?text=MR',
        location: 'Valparaíso',
        services_count: 3,
        experience_years: 8
      },
      {
        id: 3,
        name: 'Luis Gómez',
        email: 'luis@example.com',
        profession: 'Armador de Muebles',
        description: 'Montaje rápido y profesional de todo tipo de muebles. Experiencia garantizada.',
        rating: 4.8,
        review_count: 204,
        avatar_url: 'https://placehold.co/64x64/C7D2FE/4338CA?text=LG',
        location: 'Concepción',
        services_count: 4,
        experience_years: 6
      }
    ];
    this.filteredProviders = [...this.providers];
    this.loading = false;
  }

  private loadServices() {
    // Mock data - replace with actual API call
    this.services = [
      {
        id: 1,
        name: 'Corte de Cabello',
        description: 'Corte profesional para caballeros y damas.',
        price: 15000,
        duration_minutes: 45,
        provider_id: 1,
        provider_name: 'Ana Pérez',
        category: 'belleza'
      },
      {
        id: 2,
        name: 'Cena Gourmet',
        description: 'Cena completa con chef privado en tu hogar.',
        price: 45000,
        duration_minutes: 120,
        provider_id: 2,
        provider_name: 'Mario Rojas',
        category: 'hogar'
      },
      {
        id: 3,
        name: 'Montaje de Muebles',
        description: 'Ensamblaje profesional de muebles.',
        price: 25000,
        duration_minutes: 90,
        provider_id: 3,
        provider_name: 'Luis Gómez',
        category: 'hogar'
      }
    ];
    this.filteredServices = [...this.services];
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
    this.applyAdvancedFilters();
  }

  onServiceChange(service: string) {
    this.selectedService = service;
    this.applyAdvancedFilters();
  }

  onLocationChange(locationId: string) {
    this.selectedLocationId = locationId;
    this.applyAdvancedFilters();
  }

  onDateTimeChange(dateTime: any) {
    this.selectedDateTime = dateTime;
    this.applyAdvancedFilters();
  }

  applyAdvancedFilters() {
    this.filteredProviders = this.providers.filter(provider => {
      const matchesService = !this.selectedService || 
        provider.name.toLowerCase().includes(this.selectedService.toLowerCase()) ||
        provider.profession.toLowerCase().includes(this.selectedService.toLowerCase()) ||
        provider.description.toLowerCase().includes(this.selectedService.toLowerCase());

      const matchesLocation = !this.selectedLocationId || 
        provider.location.toLowerCase().includes(this.selectedLocationId.toLowerCase());

      return matchesService && matchesLocation;
    });

    this.filteredServices = this.services.filter(service => {
      const matchesService = !this.selectedService || 
        service.name.toLowerCase().includes(this.selectedService.toLowerCase()) ||
        service.description.toLowerCase().includes(this.selectedService.toLowerCase()) ||
        service.provider_name.toLowerCase().includes(this.selectedService.toLowerCase());

      return matchesService;
    });

    // Update map markers based on filtered results
    this.generateMapMarkers();
    this.generateProfessionalCards();
    this.generateMapCardMarkers();
  }

  applyFilters() {
    this.filteredProviders = this.providers.filter(provider => {
      const matchesSearch = !this.searchTerm || 
        provider.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        provider.profession.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        provider.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesLocation = !this.selectedLocation || provider.location.toLowerCase() === this.selectedLocation.toLowerCase();

      return matchesSearch && matchesLocation;
    });

    this.filteredServices = this.services.filter(service => {
      const matchesSearch = !this.searchTerm || 
        service.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        service.provider_name.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.selectedCategory || service.category === this.selectedCategory;

      const matchesPrice = !this.selectedPriceRange || this.isInPriceRange(service.price, this.selectedPriceRange);

      return matchesSearch && matchesCategory && matchesPrice;
    });
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
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedLocation = '';
    this.selectedPriceRange = '';
    this.applyFilters();
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
      price: this.services.find(s => s.provider_id === provider.id)?.price?.toString() || 'Consultar',
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
    // Handle professional click - could show details, navigate, etc.
  }

  onProfessionalBook(professional: ProfessionalCard) {
    console.log('Professional book:', professional);
    // Handle booking - navigate to booking flow
  }

  onMapCardMarkerClick(marker: MapCardMarker) {
    console.log('Map card marker clicked:', marker);
    // Handle marker click
  }

  onMapCardMarkerAction(event: { marker: MapCardMarker; action: string }) {
    console.log('Map card marker action:', event);
    // Handle marker action
  }

  onMapCardViewModeChange(mode: 'map' | 'list') {
    console.log('Map card view mode changed to:', mode);
    // Handle view mode change
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
}