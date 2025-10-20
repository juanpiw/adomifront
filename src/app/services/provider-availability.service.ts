import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeeklyBlockDTO {
  id: number;
  day_of_week: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
  start_time: string; // HH:mm:ss or HH:mm
  end_time: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProviderAvailabilityService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private headers(): HttpHeaders {
    const token = localStorage.getItem('adomi_access_token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getWeekly(): Observable<{ success: boolean; blocks: WeeklyBlockDTO[] }> {
    return this.http.get<{ success: boolean; blocks: WeeklyBlockDTO[] }>(`${this.baseUrl}/provider/availability/weekly`, { headers: this.headers() });
  }

  createWeekly(day_of_week: WeeklyBlockDTO['day_of_week'], start_time: string, end_time: string, is_active: boolean): Observable<{ success: boolean; block: WeeklyBlockDTO }> {
    return this.http.post<{ success: boolean; block: WeeklyBlockDTO }>(`${this.baseUrl}/provider/availability/weekly`, { day_of_week, start_time, end_time, is_active }, { headers: this.headers() });
  }

  updateWeekly(id: number, data: Partial<Pick<WeeklyBlockDTO, 'start_time'|'end_time'|'is_active'>>): Observable<{ success: boolean; block: WeeklyBlockDTO }> {
    return this.http.put<{ success: boolean; block: WeeklyBlockDTO }>(`${this.baseUrl}/provider/availability/weekly/${id}`, data, { headers: this.headers() });
  }

  deleteWeekly(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/provider/availability/weekly/${id}`, { headers: this.headers() });
  }
  
  // ==================== EXCEPCIONES (BLOQUEOS) ====================
  
  /**
   * Crear excepción/bloqueo para una fecha específica
   */
  createException(
    exceptionDate: string,   // YYYY-MM-DD
    isAvailable: boolean,    // false = bloqueo, true = habilitar
    startTime?: string,      // HH:mm (opcional - si es null bloquea todo el día)
    endTime?: string,        // HH:mm (opcional - si es null bloquea todo el día)
    reason?: string          // Motivo del bloqueo
  ): Observable<{ success: boolean; exception: any }> {
    console.log('🔒 [AVAILABILITY_SERVICE] Creando excepción:', {
      exceptionDate,
      isAvailable,
      startTime,
      endTime,
      reason
    });
    
    return this.http.post<{ success: boolean; exception: any }>(
      `${this.baseUrl}/provider/availability/exceptions`,
      {
        exception_date: exceptionDate,
        is_available: isAvailable,
        start_time: startTime || null,
        end_time: endTime || null,
        reason: reason || null
      },
      { headers: this.headers() }
    );
  }
  
  /**
   * Listar excepciones del proveedor
   */
  listExceptions(): Observable<{ success: boolean; exceptions: any[] }> {
    return this.http.get<{ success: boolean; exceptions: any[] }>(
      `${this.baseUrl}/provider/availability/exceptions`,
      { headers: this.headers() }
    );
  }
  
  /**
   * Eliminar excepción/bloqueo
   */
  deleteException(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/provider/availability/exceptions/${id}`,
      { headers: this.headers() }
    );
  }
}





