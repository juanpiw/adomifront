import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PromotionDto {
  id: number;
  service_id: number | null;
  name: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number | string;
  start_date: string; // yyyy-mm-dd
  end_date: string;   // yyyy-mm-dd
  is_active: boolean;
  status?: 'active' | 'inactive' | 'expired';
  usageCount?: number;
}

export interface CreatePromotionDto {
  service_id?: number | null;
  name: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number | string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  max_uses?: number | null;
  promo_code?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PromotionsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  list(): Observable<{ success: boolean; promotions: PromotionDto[] }> {
    return this.http.get<{ success: boolean; promotions: PromotionDto[] }>(`${this.baseUrl}/provider/promotions`);
  }

  create(dto: CreatePromotionDto): Observable<{ success: boolean; id: number }> {
    return this.http.post<{ success: boolean; id: number }>(`${this.baseUrl}/provider/promotions`, dto);
  }

  update(id: number, dto: Partial<CreatePromotionDto>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/provider/promotions/${id}`, dto);
  }

  toggle(id: number): Observable<{ success: boolean; is_active: boolean }> {
    return this.http.patch<{ success: boolean; is_active: boolean }>(`${this.baseUrl}/provider/promotions/${id}/toggle`, {});
  }

  remove(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/provider/promotions/${id}`);
  }
}









