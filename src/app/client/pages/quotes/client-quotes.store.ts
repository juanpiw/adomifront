import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { Quote, QuoteActionEvent, QuoteStatus } from '../../../../libs/shared-ui/quotes/quotes.models';
import {
  ClientQuoteDetailResponse,
  ClientQuoteSummary,
  ClientQuoteTabId,
  QuotesClientService
} from '../../../services/quotes-client.service';

type ClientTabDefinition = { id: ClientQuoteTabId; label: string; badge: number };

const DEFAULT_COUNTERS: Record<ClientQuoteTabId, number> = {
  new: 0,
  sent: 0,
  accepted: 0,
  history: 0
};

@Injectable()
export class ClientQuotesStore {
  private api = inject(QuotesClientService);

  private readonly defaultTabs: ClientTabDefinition[] = [
    { id: 'new', label: 'Nuevas solicitudes', badge: 0 },
    { id: 'sent', label: 'Cotizaciones recibidas', badge: 0 },
    { id: 'accepted', label: 'Aceptadas', badge: 0 },
    { id: 'history', label: 'Historial', badge: 0 }
  ];

  private readonly activeTabSig = signal<ClientQuoteTabId>('new');
  private readonly tabsSig = signal<ClientTabDefinition[]>([...this.defaultTabs]);
  private readonly quotesSig = signal<Quote[]>([]);
  private readonly countersSig = signal<Record<ClientQuoteTabId, number>>({ ...DEFAULT_COUNTERS });
  private readonly loadingSig = signal<boolean>(false);
  private readonly errorSig = signal<string | null>(null);
  private readonly selectedQuoteSig = signal<ClientQuoteDetailResponse['quote'] | null>(null);

  readonly activeTab = this.activeTabSig.asReadonly();
  readonly tabs = this.tabsSig.asReadonly();
  readonly quotes = this.quotesSig.asReadonly();
  readonly counters = this.countersSig.asReadonly();
  readonly loading = this.loadingSig.asReadonly();
  readonly error = this.errorSig.asReadonly();
  readonly selectedQuote = this.selectedQuoteSig.asReadonly();
  readonly hasQuotes = computed(() => this.quotesSig().length > 0);

  loadQuotes(tab: ClientQuoteTabId = this.activeTabSig()): void {
    this.activeTabSig.set(tab);
    this.loadingSig.set(true);
    this.errorSig.set(null);

    this.api
      .getQuotes(tab)
      .pipe(
        tap((resp) => {
          const mapped = resp.quotes.map((quote) => this.mapQuote(quote));
          console.log('[CLIENT_QUOTES] Loaded quotes', {
            tab,
            count: resp.quotes.length,
            counters: resp.counters,
            rawSample: resp.quotes.slice(0, 1),
            mappedSample: mapped.slice(0, 1)
          });
          this.countersSig.set(resp.counters);
          this.tabsSig.set(this.buildTabs(resp.counters));
          this.quotesSig.set(mapped);
          this.selectedQuoteSig.set(null);
        }),
        finalize(() => this.loadingSig.set(false))
      )
      .subscribe({
        error: (err) => {
          const message = err?.error?.error || err?.message || 'No pudimos cargar tus cotizaciones.';
          console.error('[CLIENT_QUOTES] Error loading quotes', { tab, error: err });
          this.errorSig.set(message);
        }
      });
  }

  loadQuoteDetail(id: number): void {
    this.loadingSig.set(true);
    this.errorSig.set(null);

    this.api
      .getQuoteDetail(id)
      .pipe(finalize(() => this.loadingSig.set(false)))
      .subscribe({
        next: (resp) => {
          this.selectedQuoteSig.set(resp.quote);
        },
        error: (err) => {
          const message = err?.error?.error || err?.message || 'No pudimos cargar los detalles de la cotización.';
          this.errorSig.set(message);
        }
      });
  }

  onQuoteAction(event: QuoteActionEvent): void {
    if (!event?.quote) return;
    const quoteId = Number(event.quote.id);
    if (event.action === 'view' || event.action === 'review') {
      if (!Number.isNaN(quoteId)) {
        this.loadQuoteDetail(quoteId);
      }
    }
    // TODO: wire chat / payment actions in future steps
  }

  resetError(): void {
    this.errorSig.set(null);
  }

  private buildTabs(counters: Record<ClientQuoteTabId, number>): ClientTabDefinition[] {
    return this.defaultTabs.map((tab) => ({
      ...tab,
      badge: counters[tab.id] ?? 0
    }));
  }

  private mapQuote(summary: ClientQuoteSummary): Quote {
    const provider = summary.provider ?? {
      id: 0,
      name: 'Profesional Adomi',
      avatarUrl: null,
      memberSince: null,
      city: null,
      country: null
    };

    return {
      id: summary.id,
      status: this.normalizeStatus(summary.status),
      serviceName: summary.serviceName,
      requestedAt: summary.requestedAt,
      client: {
        id: provider.id,
        name: provider.name || 'Profesional Adomi',
        avatarUrl: provider.avatarUrl,
        memberSince: provider.memberSince
      },
      message: summary.message,
      amount: summary.amount ?? undefined,
      currency: summary.currency ?? undefined,
      validUntil: summary.validUntil ?? undefined
    };
  }

  private normalizeStatus(status: ClientQuoteSummary['status']): QuoteStatus {
    if (status === 'draft' || !status) {
      return 'new';
    }
    if (status === 'rejected' || status === 'expired') {
      return status;
    }
    return status as QuoteStatus;
  }
}

