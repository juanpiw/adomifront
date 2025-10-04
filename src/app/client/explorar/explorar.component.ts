import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

interface Provider {
  id: number;
  name: string;
  email: string;
  description?: string;
  location?: string;
  rating?: number;
  total_reviews?: number;
  services_count?: number;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration?: number;
  provider_id: number;
  provider_name: string;
}

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="explorar-container">
      <!-- Header -->
      <div class="explorar-header">
        <h1 class="explorar-title">
          <ui-icon name="search" class="title-icon"></ui-icon>
          Explorar Servicios
        </h1>
        <p class="explorar-subtitle">Descubre los mejores profesionales cerca de ti</p>
      </div>

      <!-- Search Bar -->
      <div class="search-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <ui-icon name="search" class="search-icon"></ui-icon>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Buscar servicios, profesionales, ubicaciones..."
              class="search-input"
            >
            <button 
              *ngIf="searchQuery.length > 0"
              (click)="clearSearch()"
              class="clear-button"
              title="Limpiar búsqueda"
            >
              <ui-icon name="x"></ui-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-container">
          <div class="filter-group">
            <label class="filter-label">Ubicación:</label>
            <select [(ngModel)]="selectedLocation" (change)="applyFilters()" class="filter-select">
              <option value="">Todas las ubicaciones</option>
              <option value="santiago">Santiago</option>
              <option value="valparaiso">Valparaíso</option>
              <option value="concepcion">Concepción</option>
              <option value="temuco">Temuco</option>
              <option value="antofagasta">Antofagasta</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Categoría:</label>
            <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="filter-select">
              <option value="">Todas las categorías</option>
              <option value="belleza">Belleza y Estética</option>
              <option value="salud">Salud y Bienestar</option>
              <option value="hogar">Hogar y Mantenimiento</option>
              <option value="educacion">Educación</option>
              <option value="tecnologia">Tecnología</option>
              <option value="deportes">Deportes y Fitness</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Precio:</label>
            <select [(ngModel)]="selectedPriceRange" (change)="applyFilters()" class="filter-select">
              <option value="">Todos los precios</option>
              <option value="0-10000">Hasta $10.000</option>
              <option value="10000-25000">$10.000 - $25.000</option>
              <option value="25000-50000">$25.000 - $50.000</option>
              <option value="50000+">Más de $50.000</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Buscando servicios...</p>
      </div>

      <!-- Results -->
      <div *ngIf="!loading" class="results-section">
        <!-- Providers Section -->
        <div *ngIf="filteredProviders.length > 0" class="providers-section">
          <h2 class="section-title">
            <ui-icon name="users"></ui-icon>
            Profesionales ({{ filteredProviders.length }})
          </h2>
          <div class="providers-grid">
            <div *ngFor="let provider of filteredProviders" class="provider-card">
              <div class="provider-header">
                <div class="provider-avatar">
                  <ui-icon name="user"></ui-icon>
                </div>
                <div class="provider-info">
                  <h3 class="provider-name">{{ provider.name }}</h3>
                  <p class="provider-location">{{ provider.location || 'Ubicación no especificada' }}</p>
                  <div *ngIf="provider.rating" class="provider-rating">
                    <div class="stars">
                      <span *ngFor="let star of getStars(provider.rating)" class="star">{{ star }}</span>
                    </div>
                    <span class="rating-text">{{ provider.rating.toFixed(1) }} ({{ provider.total_reviews || 0 }} reseñas)</span>
                  </div>
                </div>
              </div>
              <p *ngIf="provider.description" class="provider-description">{{ provider.description }}</p>
              <div class="provider-stats">
                <span class="stat">
                  <ui-icon name="briefcase"></ui-icon>
                  {{ provider.services_count || 0 }} servicios
                </span>
              </div>
              <div class="provider-actions">
                <button class="btn-primary" (click)="viewProviderServices(provider.id)">
                  Ver Servicios
                </button>
                <button class="btn-secondary" (click)="addToFavorites(provider.id)">
                  <ui-icon name="heart"></ui-icon>
                  Favorito
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Services Section -->
        <div *ngIf="filteredServices.length > 0" class="services-section">
          <h2 class="section-title">
            <ui-icon name="briefcase"></ui-icon>
            Servicios ({{ filteredServices.length }})
          </h2>
          <div class="services-grid">
            <div *ngFor="let service of filteredServices" class="service-card">
              <div class="service-header">
                <h3 class="service-name">{{ service.name }}</h3>
                <div class="service-price">
                  {{ formatPrice(service.price) }}
                  <span *ngIf="service.duration" class="service-duration">{{ service.duration }} min</span>
                </div>
              </div>
              <p class="service-description">{{ service.description }}</p>
              <div class="service-provider">
                <ui-icon name="user"></ui-icon>
                <span>{{ service.provider_name }}</span>
              </div>
              <div class="service-actions">
                <button class="btn-primary" (click)="bookService(service)">
                  <ui-icon name="calendar"></ui-icon>
                  Reservar
                </button>
                <button class="btn-secondary" (click)="addServiceToFavorites(service.id)">
                  <ui-icon name="heart"></ui-icon>
                  Favorito
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div *ngIf="filteredProviders.length === 0 && filteredServices.length === 0 && !loading" class="no-results">
          <ui-icon name="search" class="no-results-icon"></ui-icon>
          <h3>No se encontraron resultados</h3>
          <p>Intenta ajustar tus filtros o usar términos de búsqueda diferentes.</p>
          <button class="btn-primary" (click)="clearAllFilters()">
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit {
  searchQuery = '';
  selectedLocation = '';
  selectedCategory = '';
  selectedPriceRange = '';
  
  providers: Provider[] = [];
  services: Service[] = [];
  filteredProviders: Provider[] = [];
  filteredServices: Service[] = [];
  
  loading = false;

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  async loadData() {
    this.loading = true;
    try {
      // Cargar proveedores y servicios
      // Por ahora usaremos datos de ejemplo hasta que tengamos los endpoints reales
      await this.loadProviders();
      await this.loadServices();
      
      this.applyFilters();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadProviders() {
    // TODO: Implementar llamada real al endpoint de proveedores
    // this.http.get<Provider[]>(`${environment.apiBaseUrl}/providers`).subscribe(...)
    
    // Datos de ejemplo
    this.providers = [
      {
        id: 1,
        name: 'María Estilista',
        email: 'maria@salon.com',
        description: 'Especialista en cortes modernos y coloración',
        location: 'Santiago, Las Condes',
        rating: 4.8,
        total_reviews: 127,
        services_count: 8
      },
      {
        id: 2,
        name: 'Carlos Chef',
        email: 'carlos@chef.com',
        description: 'Chef profesional con más de 10 años de experiencia',
        location: 'Santiago, Providencia',
        rating: 4.9,
        total_reviews: 89,
        services_count: 5
      },
      {
        id: 3,
        name: 'Ana Masajista',
        email: 'ana@spa.com',
        description: 'Terapeuta especializada en masajes relajantes',
        location: 'Valparaíso, Viña del Mar',
        rating: 4.7,
        total_reviews: 156,
        services_count: 6
      }
    ];
  }

  async loadServices() {
    // TODO: Implementar llamada real al endpoint de servicios
    // this.http.get<Service[]>(`${environment.apiBaseUrl}/services`).subscribe(...)
    
    // Datos de ejemplo
    this.services = [
      {
        id: 1,
        name: 'Corte de Cabello',
        description: 'Corte profesional para caballeros y damas',
        price: 25000,
        duration: 45,
        provider_id: 1,
        provider_name: 'María Estilista'
      },
      {
        id: 2,
        name: 'Coloración',
        description: 'Tinte y mechas profesionales',
        price: 45000,
        duration: 120,
        provider_id: 1,
        provider_name: 'María Estilista'
      },
      {
        id: 3,
        name: 'Clase de Cocina',
        description: 'Aprende a cocinar platos gourmet',
        price: 35000,
        duration: 180,
        provider_id: 2,
        provider_name: 'Carlos Chef'
      },
      {
        id: 4,
        name: 'Masaje Relajante',
        description: 'Masaje terapéutico para aliviar el estrés',
        price: 30000,
        duration: 60,
        provider_id: 3,
        provider_name: 'Ana Masajista'
      }
    ];
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  applyFilters() {
    let filteredProviders = [...this.providers];
    let filteredServices = [...this.services];

    // Filtro por búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filteredProviders = filteredProviders.filter(provider => 
        provider.name.toLowerCase().includes(query) ||
        provider.description?.toLowerCase().includes(query) ||
        provider.location?.toLowerCase().includes(query)
      );
      
      filteredServices = filteredServices.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.provider_name.toLowerCase().includes(query)
      );
    }

    // Filtro por ubicación
    if (this.selectedLocation) {
      filteredProviders = filteredProviders.filter(provider =>
        provider.location?.toLowerCase().includes(this.selectedLocation.toLowerCase())
      );
    }

    // Filtro por categoría (simplificado por ahora)
    if (this.selectedCategory) {
      // TODO: Implementar filtro por categoría real
    }

    // Filtro por rango de precio
    if (this.selectedPriceRange) {
      filteredServices = filteredServices.filter(service => {
        const [min, max] = this.selectedPriceRange.split('-').map(p => 
          p === '+' ? Infinity : parseInt(p)
        );
        return service.price >= min && (max === undefined || service.price <= max);
      });
    }

    this.filteredProviders = filteredProviders;
    this.filteredServices = filteredServices;
  }

  clearAllFilters() {
    this.searchQuery = '';
    this.selectedLocation = '';
    this.selectedCategory = '';
    this.selectedPriceRange = '';
    this.applyFilters();
  }

  getStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    return stars;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  }

  viewProviderServices(providerId: number) {
    // TODO: Implementar navegación a servicios del proveedor
    console.log('Ver servicios del proveedor:', providerId);
  }

  addToFavorites(providerId: number) {
    // TODO: Implementar agregar a favoritos
    console.log('Agregar proveedor a favoritos:', providerId);
  }

  bookService(service: Service) {
    // TODO: Implementar proceso de reserva
    console.log('Reservar servicio:', service);
  }

  addServiceToFavorites(serviceId: number) {
    // TODO: Implementar agregar servicio a favoritos
    console.log('Agregar servicio a favoritos:', serviceId);
  }
}
