import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProviderServiceDto {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category_id?: number | null;
  custom_category?: string | null;
  service_image_url?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  order_index?: number;
  booking_count?: number;
  average_rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceFormDto {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category_id?: number | null;
  custom_category?: string | null;
  service_image_url?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProviderServicesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('adomi_access_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  list(): Observable<{ success: boolean; services: ProviderServiceDto[] }> {
    return this.http.get<{ success: boolean; services: ProviderServiceDto[] }>(
      `${this.base}/provider/services`,
      { headers: this.authHeaders() }
    );
  }

  create(payload: ServiceFormDto): Observable<{ success: boolean; service: ProviderServiceDto }> {
    return this.http.post<{ success: boolean; service: ProviderServiceDto }>(
      `${this.base}/provider/services`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  update(id: number, payload: Partial<ProviderServiceDto>): Observable<{ success: boolean; service: ProviderServiceDto }> {
    return this.http.put<{ success: boolean; service: ProviderServiceDto }>(
      `${this.base}/provider/services/${id}`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.base}/provider/services/${id}`,
      { headers: this.authHeaders() }
    );
  }
}


