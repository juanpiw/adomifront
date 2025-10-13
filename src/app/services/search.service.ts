import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchFilters {
  search?: string;
  category?: string;
  location?: string;
  date?: string; // YYYY-MM-DD
  start?: string; // HH:mm
  end?: string;   // HH:mm
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  duration_max?: number;
  limit?: number;
  offset?: number;
}

export interface Provider {
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
  is_online: boolean;
  is_favorite?: boolean;
  services: Service[];
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category?: string;
  image_url?: string;
  is_featured: boolean;
  is_favorite?: boolean;
  provider_id?: number;
  provider_name?: string;
  provider?: {
    id: number;
    name: string;
    profession: string;
    avatar_url?: string;
    location: string;
    rating: number;
    review_count: number;
  };
}

export interface SearchResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
}

export interface Category {
  name: string;
  count: number;
}

export interface Location {
  region: string;
  commune: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Buscar profesionales
   */
  searchProviders(filters: SearchFilters = {}): Observable<SearchResponse<Provider>> {
    console.log('[SEARCH_SERVICE] Buscando profesionales con filtros:', filters);
    
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<SearchResponse<Provider>>(`${this.apiUrl}/client/search/providers`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}`
      }
    });
  }

  /**
   * Buscar servicios específicos
   */
  searchServices(filters: SearchFilters = {}): Observable<SearchResponse<Service>> {
    console.log('[SEARCH_SERVICE] Buscando servicios con filtros:', filters);
    
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<SearchResponse<Service>>(`${this.apiUrl}/client/search/services`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}`
      }
    });
  }

  /**
   * Obtener categorías disponibles
   */
  getCategories(): Observable<{success: boolean, data: Category[]}> {
    console.log('[SEARCH_SERVICE] Obteniendo categorías disponibles');
    
    return this.http.get<{success: boolean, data: Category[]}>(`${this.apiUrl}/client/search/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}`
      }
    });
  }

  /**
   * Obtener ubicaciones disponibles
   */
  getLocations(): Observable<{success: boolean, data: Location[]}> {
    console.log('[SEARCH_SERVICE] Obteniendo ubicaciones disponibles');
    
    return this.http.get<{success: boolean, data: Location[]}>(`${this.apiUrl}/client/search/locations`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}`
      }
    });
  }

  /**
   * Búsqueda combinada (profesionales y servicios)
   */
  searchAll(filters: SearchFilters = {}): Observable<{
    providers: SearchResponse<Provider>;
    services: SearchResponse<Service>;
  }> {
    console.log('[SEARCH_SERVICE] Búsqueda combinada con filtros:', filters);
    
    return new Observable(observer => {
      let providersCompleted = false;
      let servicesCompleted = false;
      let providersResult: SearchResponse<Provider> | null = null;
      let servicesResult: SearchResponse<Service> | null = null;

      this.searchProviders(filters).subscribe({
        next: (result) => {
          providersResult = result;
          providersCompleted = true;
          if (servicesCompleted) {
            observer.next({
              providers: providersResult!,
              services: servicesResult!
            });
            observer.complete();
          }
        },
        error: (error) => {
          console.error('[SEARCH_SERVICE] Error buscando profesionales:', error);
          providersCompleted = true;
          if (servicesCompleted) {
            observer.error(error);
          }
        }
      });

      this.searchServices(filters).subscribe({
        next: (result) => {
          servicesResult = result;
          servicesCompleted = true;
          if (providersCompleted) {
            observer.next({
              providers: providersResult!,
              services: servicesResult!
            });
            observer.complete();
          }
        },
        error: (error) => {
          console.error('[SEARCH_SERVICE] Error buscando servicios:', error);
          servicesCompleted = true;
          if (providersCompleted) {
            observer.error(error);
          }
        }
      });
    });
  }

  /**
   * Buscar proveedores disponibles por fecha/hora
   */
  searchAvailableProviders(filters: Pick<SearchFilters, 'date'|'start'|'end'|'location'|'category'|'limit'|'offset'>): Observable<SearchResponse<Provider>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<SearchResponse<Provider>>(`${this.apiUrl}/client/search/available-providers`, {
      params,
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}` }
    });
  }
}
