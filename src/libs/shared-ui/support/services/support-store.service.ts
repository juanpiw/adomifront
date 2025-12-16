import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../../app/auth/services/auth.service';
import {
  SupportProfile,
  SupportStats,
  SupportTicket,
  SupportTicketCreateInput,
  SupportTicketStatus
} from '../models/support-ticket.model';

@Injectable({
  providedIn: 'root'
})
export class SupportStoreService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly api = environment.apiBaseUrl;
  private readonly tickets$ = new BehaviorSubject<SupportTicket[]>([]);

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  load(profile: SupportProfile, opts?: { status?: SupportTicketStatus; offset?: number; limit?: number }): Observable<SupportTicket[]> {
    const params: Record<string, string> = { };
    if (opts?.status) params['status'] = opts.status;
    if (typeof opts?.offset === 'number') params['offset'] = String(opts.offset);
    if (typeof opts?.limit === 'number') params['limit'] = String(opts.limit);

    return this.http
      .get<{ success: boolean; tickets: BackendTicket[]; total: number; offset?: number; limit?: number }>(
        `${this.api}/support/tickets`,
        { headers: this.headers(), params }
      )
      .pipe(
        tap((res) => {
          if (res?.tickets) {
            this.tickets$.next(res.tickets.map(mapBackendTicket));
          }
        }),
        map(() => this.tickets$.value.filter((t) => t.profile === profile))
      );
  }

  list$(profile: SupportProfile): Observable<SupportTicket[]> {
    return this.tickets$.pipe(map((tickets) => tickets.filter((t) => t.profile === profile)));
  }

  stats$(profile: SupportProfile): Observable<SupportStats> {
    return this.list$(profile).pipe(
      map((tickets) => {
        const open = tickets.filter((t) => t.status !== 'cerrado').length;
        const closed = tickets.filter((t) => t.status === 'cerrado').length;
        return { open, closed };
      })
    );
  }

  create(profile: SupportProfile, input: SupportTicketCreateInput): Observable<SupportTicket> {
    return this.http
      .post<{ success: boolean; ticket: BackendTicket }>(
        `${this.api}/support/tickets`,
        {
          subject: input.subject,
          category: input.category,
          description: input.description
        },
        { headers: this.headers() }
      )
      .pipe(
        tap((res) => {
          if (res?.ticket) {
            const mapped = mapBackendTicket(res.ticket);
            this.tickets$.next([mapped, ...this.tickets$.value]);
          }
        }),
        map((res) => mapBackendTicket(res.ticket))
      );
  }

  updateStatus(ticketId: string, status: SupportTicketStatus): void {
    this.tickets$.next(
      this.tickets$.value.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status
            }
          : ticket
      )
    );
  }
}

interface BackendTicket {
  id: number;
  profile: SupportProfile;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

function mapBackendTicket(ticket: BackendTicket): SupportTicket {
  return {
    id: String(ticket.id),
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    description: ticket.description || '',
    date: ticket.created_at
      ? new Date(ticket.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      : '',
    profile: ticket.profile
  };
}

