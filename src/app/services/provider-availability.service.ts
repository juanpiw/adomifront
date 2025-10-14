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
}


