import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PortfolioItemDto {
  id: number;
  file_url: string;
  file_type: 'image' | 'video';
  thumbnail_url?: string | null;
  title?: string | null;
  description?: string | null;
  order_index?: number;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  list(): Observable<{ success: boolean; portfolio: PortfolioItemDto[] }> {
    return this.http.get<{ success: boolean; portfolio: PortfolioItemDto[] }>(`${this.base}/provider/portfolio`);
  }

  signUpload(payload: { type: 'image' | 'video'; contentType: string; sizeBytes?: number }): Observable<{
    success: boolean;
    uploadUrl: string;
    headers: Record<string, string>;
    key: string;
    url: string;
  }> {
    return this.http.post<any>(`${this.base}/provider/upload/portfolio/sign`, payload);
  }

  finalizeUpload(payload: {
    type: 'image' | 'video';
    key: string;
    url: string;
    thumb_url?: string;
    width?: number;
    height?: number;
    duration_seconds?: number;
    caption?: string;
    sizeBytes?: number;
    mimeType?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/provider/upload/portfolio/finalize`, payload);
  }

  delete(itemId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/provider/portfolio/${itemId}`);
  }

  reorder(items: Array<{ id: number; order_index: number }>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.base}/provider/portfolio/reorder`, { items });
  }

  update(itemId: number, payload: { title?: string; description?: string; is_active?: boolean }): Observable<any> {
    // No existe endpoint específico en backend para update; se puede ampliar luego.
    // Por ahora, solo devolver observable vacío si no hay endpoint.
    return new Observable((subscriber) => {
      subscriber.next({ success: false, error: 'update not implemented' });
      subscriber.complete();
    });
  }
}


