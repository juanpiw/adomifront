import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PromoSignupData {
  nombre: string;
  correo: string;
  profesion: string;
  notas?: string;
}

export interface PromoSignupResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    nombre: string;
    correo: string;
    profesion: string;
    status: string;
    created_at: string;
  };
  error?: string;
}

export interface PromoSignup {
  id: number;
  nombre: string;
  correo: string;
  profesion: string;
  notas?: string;
  status: 'pending' | 'contacted' | 'converted' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PromoStats {
  total: number;
  pending: number;
  contacted: number;
  converted: number;
  cancelled: number;
  by_profesion: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class PromoService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/promo`;

  /**
   * Enviar datos de registro para prueba gratis
   */
  signupForFreeTrial(data: PromoSignupData): Observable<PromoSignupResponse> {
    return this.http.post<PromoSignupResponse>(`${this.baseUrl}/signup`, data);
  }

  /**
   * Obtener todos los registros de promoción (admin)
   */
  getAllSignups(): Observable<PromoSignupResponse> {
    return this.http.get<PromoSignupResponse>(`${this.baseUrl}/signups`);
  }

  /**
   * Obtener estadísticas de promociones (admin)
   */
  getStats(): Observable<{ success: boolean; data: PromoStats }> {
    return this.http.get<{ success: boolean; data: PromoStats }>(`${this.baseUrl}/stats`);
  }

  /**
   * Actualizar estado de un registro (admin)
   */
  updateStatus(id: number, status: PromoSignup['status']): Observable<PromoSignupResponse> {
    return this.http.patch<PromoSignupResponse>(`${this.baseUrl}/signups/${id}/status`, { status });
  }

  /**
   * Obtener registro por ID (admin)
   */
  getSignupById(id: number): Observable<PromoSignupResponse> {
    return this.http.get<PromoSignupResponse>(`${this.baseUrl}/signups/${id}`);
  }

  /**
   * Eliminar registro (admin)
   */
  deleteSignup(id: number): Observable<PromoSignupResponse> {
    return this.http.delete<PromoSignupResponse>(`${this.baseUrl}/signups/${id}`);
  }

  /**
   * Validar email antes de enviar
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtener opciones de profesiones disponibles
   */
  getProfesionOptions(): Array<{value: string, label: string}> {
    return [
      { value: 'estilista', label: 'Estilista / Peluquero(a)' },
      { value: 'chef', label: 'Chef / Cocina' },
      { value: 'masajista', label: 'Masajista / Terapeuta' },
      { value: 'profesor', label: 'Profesor / Instructor' },
      { value: 'tecnico', label: 'Técnico / Mantenimiento' },
      { value: 'entrenador', label: 'Entrenador Personal' },
      { value: 'limpieza', label: 'Limpieza / Aseo' },
      { value: 'cuidado', label: 'Cuidado de Mascotas' },
      { value: 'otro', label: 'Otro' }
    ];
  }
}
