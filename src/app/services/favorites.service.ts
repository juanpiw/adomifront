import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FavoriteItem {
  id: number;
  service_id?: number | null;
  name: string;
  role: string;
  rating: number;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  listFavorites(): Observable<{ success: boolean; favorites: FavoriteItem[] }> {
    return this.http.get<{ success: boolean; favorites: FavoriteItem[] }>(`${this.base}/client/favorites`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}` }
    });
  }

  addFavorite(providerId: number, serviceId?: number | null): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/client/favorites`, { provider_id: providerId, service_id: serviceId ?? null }, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}` }
    });
  }

  removeFavorite(providerId: number, serviceId?: number | null): Observable<{ success: boolean }> {
    const url = serviceId != null ? `${this.base}/client/favorites/${providerId}?serviceId=${serviceId}` : `${this.base}/client/favorites/${providerId}`;
    return this.http.delete<{ success: boolean }>(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adomi_access_token')}` }
    });
  }
}


