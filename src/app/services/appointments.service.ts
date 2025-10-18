import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface AppointmentDto {
  id: number;
  provider_id: number;
  client_id: number;
  service_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  status: 'scheduled'|'confirmed'|'cancelled'|'completed';
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSlotDto {
  time: string; // HH:mm
  is_available: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = environment.apiBaseUrl;
  private socket: any | null = null;

  // Subjects realtime
  private appointmentCreated$ = new Subject<AppointmentDto>();
  private appointmentUpdated$ = new Subject<AppointmentDto>();
  private appointmentDeleted$ = new Subject<{ id: number }>();
  private paymentCompleted$ = new Subject<{ appointment_id: number; amount?: number }>();

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // Client - list own appointments
  listClientAppointments(): Observable<{ success: boolean; appointments: (AppointmentDto & { provider_name?: string; service_name?: string; price?: number })[] }>{
    return this.http.get<{ success: boolean; appointments: (AppointmentDto & { provider_name?: string; service_name?: string; price?: number })[] }>(
      `${this.api}/client/appointments`,
      { headers: this.headers() }
    );
  }

  // Update status only
  updateStatus(id: number, status: 'scheduled'|'confirmed'|'completed'|'cancelled'):
    Observable<{ success: boolean; appointment: AppointmentDto }>{
    return this.http.patch<{ success: boolean; appointment: AppointmentDto }>(
      `${this.api}/appointments/${id}/status`,
      { status },
      { headers: this.headers() }
    );
  }

  // Create appointment
  create(payload: {
    provider_id: number;
    client_id: number;
    service_id: number;
    date: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }): Observable<{ success: boolean; appointment: AppointmentDto }>{
    return this.http.post<{ success: boolean; appointment: AppointmentDto }>(
      `${this.api}/appointments`,
      payload,
      { headers: this.headers() }
    );
  }

  // List by month (provider's own)
  listByMonth(month: string): Observable<{ success: boolean; appointments: AppointmentDto[] }>{
    return this.http.get<{ success: boolean; appointments: AppointmentDto[] }>(
      `${this.api}/appointments`,
      { headers: this.headers(), params: { month } }
    );
  }

  // List by day (provider's own)
  listByDay(date: string): Observable<{ success: boolean; appointments: AppointmentDto[] }>{
    return this.http.get<{ success: boolean; appointments: AppointmentDto[] }>(
      `${this.api}/appointments/by-day`,
      { headers: this.headers(), params: { date } }
    );
  }

  // Update
  update(id: number, patch: Partial<Pick<AppointmentDto, 'status'|'date'|'start_time'|'end_time'|'notes'>>): Observable<{ success: boolean; appointment: AppointmentDto }>{
    return this.http.put<{ success: boolean; appointment: AppointmentDto }>(
      `${this.api}/appointments/${id}`,
      patch,
      { headers: this.headers() }
    );
  }

  // Delete
  delete(id: number): Observable<{ success: boolean }>{
    return this.http.delete<{ success: boolean }>(
      `${this.api}/appointments/${id}`,
      { headers: this.headers() }
    );
  }

  // Time slots
  getTimeSlots(provider_id: number, date: string, service_id: number): Observable<{ success: boolean; time_slots: TimeSlotDto[] }>{
    return this.http.get<{ success: boolean; time_slots: TimeSlotDto[] }>(
      `${this.api}/availability/time-slots`,
      { headers: this.headers(), params: { provider_id, date, service_id } as any }
    );
  }

  // Socket connect (lazy)
  async connectSocket(userId: number): Promise<void> {
    if (this.socket) return;
    try {
      const mod: any = await import('socket.io-client');
      const io = mod.io || mod.default?.io || mod.default;
      const token = this.auth.getAccessToken() || '';
      this.socket = io(this.api, { path: '/socket.io', transports: ['websocket', 'polling'], auth: { token } });
      this.socket.on('connect', () => {
        try { this.socket?.emit('join:user', userId); } catch {}
      });
      this.socket.on('appointment:created', (a: AppointmentDto) => this.appointmentCreated$.next(a));
      this.socket.on('appointment:updated', (a: AppointmentDto) => this.appointmentUpdated$.next(a));
      this.socket.on('appointment:deleted', (p: { id: number }) => this.appointmentDeleted$.next(p));
      this.socket.on('payment:completed', (p: { appointment_id: number; amount?: number }) => this.paymentCompleted$.next(p));
    } catch {}
  }

  onAppointmentCreated(): Observable<AppointmentDto> { return this.appointmentCreated$.asObservable(); }
  onAppointmentUpdated(): Observable<AppointmentDto> { return this.appointmentUpdated$.asObservable(); }
  onAppointmentDeleted(): Observable<{ id: number }> { return this.appointmentDeleted$.asObservable(); }
  onPaymentCompleted(): Observable<{ appointment_id: number; amount?: number }> { return this.paymentCompleted$.asObservable(); }
}


