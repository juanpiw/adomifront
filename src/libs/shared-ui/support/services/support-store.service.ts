import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private readonly tickets$ = new BehaviorSubject<SupportTicket[]>([
    {
      id: '8821',
      subject: 'Problema con cobro duplicado',
      category: 'Pagos',
      status: 'cerrado',
      date: '10 Dic 2025',
      description: 'Aparecen dos cargos en mi tarjeta por el servicio de peluquería.',
      profile: 'client'
    },
    {
      id: '8824',
      subject: 'El profesional llegó tarde',
      category: 'Servicio',
      status: 'en_proceso',
      date: '14 Dic 2025',
      description: 'La cita era a las 9:00 y llegó a las 9:45 sin avisar.',
      profile: 'client'
    },
    {
      id: '9901',
      subject: 'Cliente solicita reembolso en efectivo',
      category: 'Pagos',
      status: 'abierto',
      date: '12 Dic 2025',
      description: 'Cliente pide devolución fuera de Webpay, revisar proceso correcto.',
      profile: 'provider'
    },
    {
      id: '9905',
      subject: 'Error al subir fotos de portafolio',
      category: 'App',
      status: 'en_proceso',
      date: '13 Dic 2025',
      description: 'Las imágenes quedan en loading infinito en la sección de servicios.',
      profile: 'provider'
    }
  ]);

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

  create(profile: SupportProfile, input: SupportTicketCreateInput): SupportTicket {
    const newTicket: SupportTicket = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      subject: input.subject,
      category: input.category,
      description: input.description,
      status: 'abierto',
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      profile
    };
    this.tickets$.next([newTicket, ...this.tickets$.value]);
    return newTicket;
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

