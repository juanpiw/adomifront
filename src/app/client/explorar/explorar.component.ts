import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';

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
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="explorar-container">
      <!-- Header with Search -->
      <header class="mb-10">
        <h2 class="text-4xl font-extrabold text-gray-800">Hola, {{ user?.name || 'Usuario' }}!</h2>
        <p class="text-gray-500 mt-2 text-lg">Encuentra y agenda los mejores servicios a domicilio.</p>
        <div class="relative mt-8">
          <input 
            type="text" 
            placeholder="Busca un estilista, chef, técnico..." 
            [(ngModel)]="searchTerm"
            (input)="onSearch()"
            class="w-full pl-14 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 transition text-md custom-shadow"
          >
          <ui-icon name="search" class="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></ui-icon>
          <button *ngIf="searchTerm" (click)="clearSearch()" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <ui-icon name="x" class="w-5 h-5"></ui-icon>
          </button>
        </div>
      </header>

      <!-- Hero Banner -->
      <section class="mb-12">
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-10 text-white relative overflow-hidden">
          <div class="relative z-10">
            <h3 class="text-3xl font-bold">Relájate, nosotros nos encargamos</h3>
            <p class="mt-2 max-w-lg">Desde un corte de pelo hasta la reparación de tu hogar, encuentra profesionales de confianza en un solo lugar.</p>
            <button class="mt-6 bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition duration-300" (click)="showCategories()">
              Explorar Categorías
            </button>
          </div>
          <div class="absolute -bottom-10 -right-10 w-48 h-48 bg-white/20 rounded-full"></div>
          <div class="absolute top-10 -right-20 w-64 h-64 bg-white/10 rounded-full"></div>
        </div>
      </section>

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
              <a href="#" class="text-sm font-bold text-indigo-600 hover:text-indigo-800" (click)="viewProviderProfile(provider.id)">
                Ver Perfil
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Services Section -->
      <section *ngIf="!loading && filteredServices.length > 0" class="mt-12">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">Servicios Destacados</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div *ngFor="let service of filteredServices" class="bg-white rounded-3xl p-6 custom-shadow custom-shadow-hover transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-bold text-lg text-gray-900">{{ service.name }}</h4>
              <span class="text-indigo-600 font-bold">{{ formatPrice(service.price) }}</span>
            </div>
            <p class="text-gray-600 text-sm mb-4">{{ service.description }}</p>
            <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{{ service.provider_name }}</span>
              <span>{{ service.duration_minutes }} min</span>
            </div>
            <div class="flex gap-2">
              <button class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition" (click)="bookService(service.id)">
                Reservar
              </button>
              <button class="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition" (click)="toggleServiceFavorite(service.id)">
                <ui-icon name="heart" class="w-5 h-5 text-gray-400"></ui-icon>
              </button>
            </div>
          </div>
        </div>
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
  private platformId = inject(PLATFORM_ID);

  // User data
  user: any = null;

  // Search and filters
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedLocation: string = '';
  selectedPriceRange: string = '';

  // Data
  providers: Provider[] = [];
  services: Service[] = [];
  filteredProviders: Provider[] = [];
  filteredServices: Service[] = [];

  // State
  loading: boolean = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.loadProviders();
      this.loadServices();
    }
  }

  private loadUserData() {
    // Load user data from localStorage or service
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
  }

  private loadProviders() {
    this.loading = true;
    // Mock data - replace with actual API call
    this.providers = [
      {
        id: 1,
        name: 'Ana Pérez',
        email: 'ana@example.com',
        profession: 'Estilista Profesional',
        description: 'Con más de 10 años de experiencia en color y cortes de vanguardia.',
        rating: 4.9,
        review_count: 121,
        avatar_url: 'https://placehold.co/56x56/E0E7FF/4338CA?text=AP',
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
        avatar_url: 'https://placehold.co/56x56/E0E7FF/4338CA?text=MR',
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
        avatar_url: 'https://placehold.co/56x56/E0E7FF/4338CA?text=LG',
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

  onSearch() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
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

  viewProviderProfile(providerId: number) {
    console.log('Ver perfil del proveedor:', providerId);
    // Implement navigation to provider profile
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
}