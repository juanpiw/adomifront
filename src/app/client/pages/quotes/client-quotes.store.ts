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
          this.countersSig.set(resp.counters);
          this.tabsSig.set(this.buildTabs(resp.counters));
          this.quotesSig.set(resp.quotes.map((quote) => this.mapQuote(quote)));
          this.selectedQuoteSig.set(null);
        }),
        finalize(() => this.loadingSig.set(false))
      )
      .subscribe({
        error: (err) => {
          const message = err?.error?.error || err?.message || 'No pudimos cargar tus cotizaciones.';
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
    return {
      id: summary.id,
      status: this.normalizeStatus(summary.status),
      serviceName: summary.serviceName,
      requestedAt: summary.requestedAt,
      client: {
        id: summary.provider.id,
        name: summary.provider.name,
        avatarUrl: summary.provider.avatarUrl,
        memberSince: summary.provider.memberSince
      },
      message: summary.message,
      amount: summary.amount ?? undefined,
      currency: summary.currency ?? undefined,
      validUntil: summary.validUntil ?? undefined
    };
  }

  private normalizeStatus(status: ClientQuoteSummary['status']): QuoteStatus {
    if (status === 'draft') {
      return 'new';
    }
    if (status === 'rejected' || status === 'expired') {
      return status;
    }
    return status as QuoteStatus;
  }
}

