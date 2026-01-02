import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProviderDetailResponse {
  success: boolean;
  data: {
    profile: {
      id: number;
      name: string;
      email: string;
      title: string | null;
      location: string | null;
      years_experience: number | null;
      bio: string | null;
      avatar_url: string | null;
      cover_url: string | null;
      rating: number;
      reviews_count: number;
      is_verified: boolean;
      tbk_ready?: boolean;
    };
    services: Array<{
      id: number;
      name: string;
      description: string;
      price: number;
      duration_minutes: number;
      category: string | null;
      image_url: string | null;
      is_featured: boolean;
    }>;
    portfolio: Array<{
      id: number;
      image_url: string | null;
      title: string | null;
      description: string | null;
    }>;
    reviews: Array<{
      id: number;
      rating: number;
      comment: string;
      client_name: string;
      created_at: string;
    }>;
  };
}

export interface ProviderFaqResponse {
  success: boolean;
  faqs: Array<{
    id: number;
    question: string;
    answer: string;
    order_index: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class ProviderPublicService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  getProviderDetail(id: number): Observable<ProviderDetailResponse> {
    return this.http.get<ProviderDetailResponse>(`${this.baseUrl}/client/providers/${id}/detail`);
  }

  getProviderFaqs(id: number): Observable<ProviderFaqResponse> {
    return this.http.get<ProviderFaqResponse>(`${this.baseUrl}/client/providers/${id}/faqs`);
  }
}









