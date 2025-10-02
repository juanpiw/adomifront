import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface VerificationDocument {
  id: number;
  user_id: number;
  document_type: 'id_card' | 'background_check';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    front_verification_id: number;
    back_verification_id: number;
    status: string;
  };
  error?: string;
}

export interface VerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  // Obtener headers con token de autorización
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // Obtener token de acceso desde localStorage
  private getAccessToken(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('adomi_access_token');
  }

  // Subir documentos de verificación
  uploadDocuments(frontImage: File, backImage: File, documentType: 'id_card' | 'background_check'): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('front_image', frontImage);
    formData.append('back_image', backImage);
    formData.append('document_type', documentType);

    const token = this.getAccessToken();
    const headers = new HttpHeaders({
      ...(token && { 'Authorization': `Bearer ${token}` })
      // No incluir Content-Type para FormData, el navegador lo maneja automáticamente
    });

    return this.http.post<UploadResponse>(`${this.baseUrl}/verifications/upload`, formData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener mis verificaciones
  getMyVerifications(): Observable<{ success: boolean; data: VerificationDocument[] }> {
    return this.http.get<{ success: boolean; data: VerificationDocument[] }>(`${this.baseUrl}/verifications/my`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener verificación específica
  getVerificationById(id: number): Observable<{ success: boolean; data: VerificationDocument }> {
    return this.http.get<{ success: boolean; data: VerificationDocument }>(`${this.baseUrl}/verifications/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener verificaciones pendientes (admin)
  getPendingVerifications(): Observable<{ success: boolean; data: VerificationDocument[] }> {
    return this.http.get<{ success: boolean; data: VerificationDocument[] }>(`${this.baseUrl}/verifications/admin/pending`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener estadísticas (admin)
  getVerificationStats(): Observable<{ success: boolean; data: VerificationStats }> {
    return this.http.get<{ success: boolean; data: VerificationStats }>(`${this.baseUrl}/verifications/admin/stats`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar verificación (admin)
  updateVerification(id: number, status: 'pending' | 'approved' | 'rejected', notes?: string): Observable<{ success: boolean; message: string }> {
    const body: any = { status };
    if (notes) body.notes = notes;

    return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/verifications/${id}`, body, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo de errores
  private handleError(error: any): Observable<never> {
    console.error('VerificationService Error:', error);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }
}
