import { Injectable } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { Quote, QuoteStatus } from '../quotes.models';

const MOCK_QUOTES: Quote[] = [
  {
    id: 'Q-1001',
    serviceName: 'Remodelación de Cocina',
    status: 'new',
    requestedAt: '2025-11-13T10:24:00Z',
    client: {
      id: 'cli-01',
      name: 'Ana Rodríguez',
      avatarUrl: 'https://placehold.co/80x80/e0e7ff/4f46e5?text=AR&font=inter',
      memberSince: '2025-11-05'
    },
    message: 'Hola Juan Pablo, necesito una remodelación completa de cocina (3x4 mts). Me interesa trabajo en melamina y cubiertas de cuarzo.'
  },
  {
    id: 'Q-1000',
    serviceName: 'Diseño de Jardín Completo',
    status: 'sent',
    requestedAt: '2025-11-11T09:00:00Z',
    client: {
      id: 'cli-02',
      name: 'Beatriz Morales',
      avatarUrl: 'https://placehold.co/80x80/d1fae5/065f46?text=BM&font=inter',
      memberSince: '2025-09-18'
    },
    amount: 850000,
    currency: 'CLP',
    validUntil: '2025-11-21T00:00:00Z'
  },
  {
    id: 'Q-0998',
    serviceName: 'Instalación Eléctrica Casa',
    status: 'accepted',
    requestedAt: '2025-11-10T12:00:00Z',
    client: {
      id: 'cli-03',
      name: 'Carlos Herrera',
      avatarUrl: 'https://placehold.co/80x80/ffe4e6/9f1239?text=CH&font=inter',
      memberSince: '2025-07-01'
    },
    amount: 420000,
    currency: 'CLP'
  },
  {
    id: 'Q-0995',
    serviceName: 'Mantenimiento general departamento',
    status: 'rejected',
    requestedAt: '2025-10-30T10:00:00Z',
    client: {
      id: 'cli-04',
      name: 'Andrea Campos'
    },
    amount: 150000,
    currency: 'CLP'
  },
  {
    id: 'Q-0990',
    serviceName: 'Proyecto iluminación departamento',
    status: 'expired',
    requestedAt: '2025-10-15T14:00:00Z',
    client: {
      id: 'cli-05',
      name: 'Marcos Díaz'
    }
  }
];

@Injectable({
  providedIn: 'root'
})
export class QuotesMockService {
  getQuotes(status?: QuoteStatus | 'history'): Observable<Quote[]> {
    return of(MOCK_QUOTES).pipe(
      delay(200),
      map((quotes) => {
        if (!status) return quotes;
        if (status === 'history') {
          return quotes.filter((quote) => quote.status === 'rejected' || quote.status === 'expired');
        }
        return quotes.filter((quote) => quote.status === status);
      })
    );
  }

  getTabsCounters(): Observable<Record<string, number>> {
    return of(MOCK_QUOTES).pipe(
      map((quotes) => {
        const counters: Record<string, number> = {
          new: 0,
          sent: 0,
          accepted: 0,
          history: 0
        };
        quotes.forEach((quote) => {
          if (quote.status === 'new') counters['new'] += 1;
          if (quote.status === 'sent') counters['sent'] += 1;
          if (quote.status === 'accepted') counters['accepted'] += 1;
          if (quote.status === 'rejected' || quote.status === 'expired') counters['history'] += 1;
        });
        return counters;
      })
    );
  }
}

