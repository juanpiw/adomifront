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
  payment_status?: 'pending'|'completed'|'failed'|'refunded'|'paid'|'succeeded';
  payment_method?: 'card'|'cash'|null;
  verification_code?: string | null;
  client_location?: string | null;
  client_location_label?: string | null;
  client_address?: string | null;
  client_commune?: string | null;
  client_region?: string | null;
  client_phone?: string | null;
  client_avatar_url?: string | null;
}

export interface TimeSlotDto {
  time: string; // HH:mm
  is_available: boolean;
  reason?: 'booked' | 'blocked' | string;
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
  updateStatus(
    id: number,
    status: 'scheduled'|'confirmed'|'completed'|'cancelled',
    options?: { reason?: string }
  ): Observable<{ success: boolean; appointment: AppointmentDto }>{
    const payload: any = { status };
    if (options?.reason) {
      payload.reason = options.reason;
    }
    return this.http.patch<{ success: boolean; appointment: AppointmentDto }>(
      `${this.api}/appointments/${id}/status`,
      payload,
      { headers: this.headers() }
    );
  }

  cancelAppointment(id: number, reason?: string): Observable<{ success: boolean; appointment: AppointmentDto }>{
    return this.updateStatus(id, 'cancelled', { reason });
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

  updateLocation(id: number, location: string | null): Observable<{ success: boolean; appointment: AppointmentDto }>{
    return this.http.put<{ success: boolean; appointment: AppointmentDto }>(
      `${this.api}/appointments/${id}/location`,
      { location },
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
  getTimeSlots(provider_id: number, date: string, service_id: number): Observable<{ success: boolean; time_slots: TimeSlotDto[]; meta?: { fully_blocked?: boolean; allow_manual?: boolean } }>{
    return this.http.get<{ success: boolean; time_slots: TimeSlotDto[]; meta?: { fully_blocked?: boolean; allow_manual?: boolean } }>(
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

  // ========================================
  // CÓDIGOS DE VERIFICACIÓN
  // ========================================

  /**
   * Verificar código de 4 dígitos para marcar servicio como completado (PROVEEDOR)
   */
  verifyCompletion(appointmentId: number, code: string): Observable<{
    success: boolean; 
    error?: string; 
    remainingAttempts?: number;
    message?: string;
    appointment?: any;
  }> {
    return this.http.post<{
      success: boolean; 
      error?: string; 
      remainingAttempts?: number;
      message?: string;
      appointment?: any;
    }>(
      `${this.api}/appointments/${appointmentId}/verify-completion`,
      { verification_code: code },
      { headers: this.headers() }
    );
  }

  verifyCashCode(appointmentId: number, code: string): Observable<{
    success: boolean;
    payment_id?: number;
    error?: string;
  }> {
    return this.http.post<{
      success: boolean;
      payment_id?: number;
      error?: string;
    }>(
      `${this.api}/appointments/${appointmentId}/cash/verify-code`,
      { code },
      { headers: this.headers() }
    );
  }

  submitClosureAction(appointmentId: number, action: 'code_entered'|'no_show'|'issue', notes?: string): Observable<{ success: boolean; error?: string }>{
    return this.http.post<{ success: boolean; error?: string }>(
      `${this.api}/appointments/${appointmentId}/closure/provider-action`,
      { action, notes: notes || null },
      { headers: this.headers() }
    );
  }

  /**
   * Obtener código de verificación de una cita (CLIENTE)
   */
  getVerificationCode(appointmentId: number): Observable<{
    success: boolean; 
    code?: string; 
    error?: string;
    generated_at?: string;
    status?: string;
  }> {
    return this.http.get<{
      success: boolean; 
      code?: string; 
      error?: string;
      generated_at?: string;
      status?: string;
    }>(
      `${this.api}/appointments/${appointmentId}/verification-code`,
      { headers: this.headers() }
    );
  }

  /**
   * Listar citas pagadas (PROVEEDOR) - esperando verificación
   */
  listPaidAppointments(): Observable<{
    success: boolean; 
    appointments: any[];
    error?: string;
  }> {
    return this.http.get<{
      success: boolean; 
      appointments: any[];
      error?: string;
    }>(
      `${this.api}/provider/appointments/paid`,
      { headers: this.headers() }
    );
  }

  /**
   * Listar solicitudes pendientes de confirmación (PROVEEDOR)
   */
  listPendingRequests(): Observable<{
    success: boolean; 
    appointments: any[];
    error?: string;
  }> {
    return this.http.get<{
      success: boolean; 
      appointments: any[];
      error?: string;
    }>(
      `${this.api}/provider/appointments/pending-requests`,
      { headers: this.headers() }
    );
  }

  /**
   * Obtener próxima cita confirmada (PROVEEDOR)
   */
  getNextAppointment(): Observable<{
    success: boolean; 
    appointment: any | null;
    error?: string;
  }> {
    return this.http.get<{
      success: boolean; 
      appointment: any | null;
      error?: string;
    }>(
      `${this.api}/provider/appointments/next`,
      { headers: this.headers() }
    );
  }
}


