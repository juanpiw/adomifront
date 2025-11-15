import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { Quote, QuoteActionEvent, QuoteStatus, QuoteProvider, QuoteAttachment, QuoteItem } from '../../../../libs/shared-ui/quotes/quotes.models';
import {
  ClientQuoteDetailResponse,
  ClientQuoteSummary,
  ClientQuoteTabId,
  QuotesClientService
} from '../../../services/quotes-client.service';
import { environment } from '../../../../environments/environment';

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
  private readonly selectedQuoteSig = signal<Quote | null>(null);
  private readonly acceptLoadingSig = signal<boolean>(false);
  private readonly acceptErrorSig = signal<string | null>(null);
  private readonly acceptSuccessSig = signal<boolean>(false);

  readonly activeTab = this.activeTabSig.asReadonly();
  readonly tabs = this.tabsSig.asReadonly();
  readonly quotes = this.quotesSig.asReadonly();
  readonly counters = this.countersSig.asReadonly();
  readonly loading = this.loadingSig.asReadonly();
  readonly error = this.errorSig.asReadonly();
  readonly selectedQuote = this.selectedQuoteSig.asReadonly();
  readonly hasQuotes = computed(() => this.quotesSig().length > 0);
  readonly accepting = this.acceptLoadingSig.asReadonly();
  readonly acceptError = this.acceptErrorSig.asReadonly();
  readonly acceptSuccess = this.acceptSuccessSig.asReadonly();

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
          let message = err?.error?.error || err?.message || 'No pudimos cargar tus cotizaciones.';
          if (err?.status === 0) {
            message = 'No pudimos conectar con el servidor de cotizaciones. Revisa tu conexión o intenta nuevamente en unos segundos.';
          }
          console.error('[CLIENT_QUOTES] Error loading quotes', { tab, error: err });
          this.errorSig.set(message);
        }
      });
  }

  acceptQuote(quoteId: number): void {
    if (!quoteId || this.acceptLoadingSig()) return;
    this.acceptErrorSig.set(null);
    this.acceptSuccessSig.set(false);
    this.acceptLoadingSig.set(true);

    this.api
      .acceptQuote(quoteId)
      .pipe(finalize(() => this.acceptLoadingSig.set(false)))
      .subscribe({
        next: (resp) => {
          this.applyAcceptedQuote(quoteId, resp?.quote ? this.mapDetailQuote(resp.quote) : null);
          this.acceptSuccessSig.set(true);
        },
        error: (err) => {
          const message =
            err?.error?.error ||
            err?.message ||
            'No pudimos aceptar la cotización. Intenta nuevamente en unos segundos.';
          this.acceptErrorSig.set(message);
        }
      });
  }

  resetAcceptState(): void {
    this.acceptErrorSig.set(null);
    this.acceptSuccessSig.set(false);
  }

  loadQuoteDetail(id: number): void {
    this.loadingSig.set(true);
    this.errorSig.set(null);

    this.api
      .getQuoteDetail(id)
      .pipe(finalize(() => this.loadingSig.set(false)))
      .subscribe({
        next: (resp) => {
          console.log('[CLIENT_QUOTES] Detail response', {
            id,
            raw: resp.quote
          });
          const mapped = this.mapDetailQuote(resp.quote);
          console.log('[CLIENT_QUOTES] Detail loaded', {
            id: mapped.id,
            status: mapped.status,
            amount: mapped.proposal?.amount ?? mapped.amount,
            validUntil: mapped.proposal?.validUntil ?? mapped.validUntil,
            attachments: mapped.attachments?.length ?? 0,
            items: mapped.items?.length ?? 0
          });
          this.selectedQuoteSig.set(mapped);
        },
        error: (err) => {
          const message = err?.error?.error || err?.message || 'No pudimos cargar los detalles de la cotización.';
          this.errorSig.set(message);
        }
      });
  }

  onQuoteAction(event: QuoteActionEvent): void {
    if (!event?.quote) return;
    console.log('[CLIENT_QUOTES] onQuoteAction', event);
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

  private applyAcceptedQuote(quoteId: number, detail: Quote | null): void {
    const currentCounters = this.countersSig();
    const nextCounters: Record<ClientQuoteTabId, number> = {
      ...currentCounters,
      sent: Math.max(0, (currentCounters.sent ?? 0) - 1),
      accepted: (currentCounters.accepted ?? 0) + 1
    };
    this.countersSig.set(nextCounters);
    this.tabsSig.set(this.buildTabs(nextCounters));

    this.quotesSig.update((quotes) =>
      quotes.map((quote) => (quote.id === quoteId ? { ...quote, status: 'accepted' as QuoteStatus } : quote))
    );

    if (detail) {
      this.selectedQuoteSig.set(detail);
    } else {
      const current = this.selectedQuoteSig();
      if (current?.id === quoteId) {
        this.selectedQuoteSig.set({ ...current, status: 'accepted' });
      }
    }
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
    const serviceName = summary.serviceName?.trim() || 'Solicitud enviada';
    const requestedAt = this.normalizeDate(summary.requestedAt) || null;
    const appointmentTime = this.normalizeTime(summary.appointment?.time);
    const requestedTime = appointmentTime || (requestedAt ? this.normalizeTime(requestedAt) : null);
    const message = summary.message?.trim() || null;
    const amount = typeof summary.amount === 'number' ? summary.amount : null;
    const currency = summary.currency || 'CLP';
    const validUntil = this.normalizeDate(summary.validUntil);

    const providerView: QuoteProvider = {
      id: provider.id,
      name: provider.name || 'Profesional Adomi',
      avatarUrl: this.buildAssetUrl(provider.avatarUrl),
      memberSince: this.normalizeDate(provider.memberSince),
      city: provider.city,
      country: provider.country
    };

    return {
      id: summary.id,
      status: this.normalizeStatus(summary.status),
      serviceName,
      requestedAt: requestedAt || new Date().toISOString(),
      appointmentId: summary.appointment?.appointmentId ?? null,
      client: { ...providerView },
      provider: providerView,
      message,
      amount: amount ?? undefined,
      currency: currency ?? undefined,
      validUntil: validUntil ?? undefined,
      requestedTime,
      appointmentDate: summary.appointment?.date || null,
      appointmentTime: appointmentTime || null
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

  private normalizeDate(value?: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  private buildAssetUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${environment.apiBaseUrl}${normalized}`;
  }

  private normalizeTime(value?: string | null): string | null {
    if (!value) return null;
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
      return value.slice(0, 5);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private mapDetailQuote(detail: ClientQuoteDetailResponse['quote']): Quote {
    const base = this.mapQuote(detail);
    const normalizedValidUntil = this.normalizeDate(detail.proposal?.validUntil || detail.validUntil);

    return {
      ...base,
      amount: base.amount ?? detail.proposal?.amount ?? null,
      currency: base.currency || detail.proposal?.currency || 'CLP',
      validUntil: base.validUntil || normalizedValidUntil || null,
      proposal: detail.proposal
        ? {
            amount: detail.proposal.amount ?? null,
            currency: detail.proposal.currency || base.currency || 'CLP',
            details: detail.proposal.details ?? null,
            validUntil: normalizedValidUntil
          }
        : base.proposal ?? undefined,
      attachments: (detail.attachments || []).map((attachment): QuoteAttachment => ({
        id: attachment.id,
        name: attachment.name || null,
        size: attachment.size ?? null,
        type: attachment.type ?? null,
        url: this.buildAssetUrl(attachment.url) || attachment.url || null
      })),
      items: (detail.items || []).map(
        (item): QuoteItem => ({
          id: item.id,
          title: item.title,
          description: item.description ?? null,
          quantity: item.quantity ?? null,
          unitPrice: item.unit_price ?? null,
          totalPrice: item.total_price ?? null
        })
      )
    };
  }
}

