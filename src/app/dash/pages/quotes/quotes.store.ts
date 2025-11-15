import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { Quote, QuoteActionEvent, QuoteStatus } from '../../../../libs/shared-ui/quotes/quotes.models';
import {
  ProviderQuoteDetailResponse,
  ProviderQuoteDto,
  QuotesService,
  QuotesTabId,
  QuoteProposalPayload
} from '../../../services/quotes.service';
import { environment } from '../../../../environments/environment';

type TabDefinition = { id: QuotesTabId; label: string; badge: number };

@Injectable()
export class QuotesStore {
  private api = inject(QuotesService);

  private readonly defaultTabs: TabDefinition[] = [
    { id: 'new', label: 'Nuevas solicitudes', badge: 0 },
    { id: 'sent', label: 'Enviadas', badge: 0 },
    { id: 'accepted', label: 'Aceptadas', badge: 0 },
    { id: 'history', label: 'Historial', badge: 0 }
  ];

  private readonly activeTabSig = signal<QuotesTabId>('new');
  private readonly tabsSig = signal<TabDefinition[]>([...this.defaultTabs]);
  private readonly quotesSig = signal<Quote[]>([]);
  private readonly selectedQuoteSig = signal<ProviderQuoteDetailResponse['quote'] | null>(null);
  private readonly loadingSig = signal<boolean>(false);
  private readonly errorSig = signal<string | null>(null);

  readonly activeTab = this.activeTabSig.asReadonly();
  readonly tabs = this.tabsSig.asReadonly();
  readonly quotes = this.quotesSig.asReadonly();
  readonly selectedQuote = this.selectedQuoteSig.asReadonly();
  readonly loading = this.loadingSig.asReadonly();
  readonly error = this.errorSig.asReadonly();
  readonly selectedQuoteForForm = computed<Quote | null>(() => {
    const detail = this.selectedQuoteSig();
    if (!detail) return null;
    return this.mapQuoteDto(detail);
  });
  readonly selectedQuoteAttachments = computed(
    () => this.selectedQuoteSig()?.attachments ?? []
  );

  readonly hasQuotes = computed(() => this.quotesSig().length > 0);

  loadQuotes(tab: QuotesTabId = this.activeTabSig()): void {
    this.activeTabSig.set(tab);
    this.loadingSig.set(true);
    this.errorSig.set(null);

    this.api
      .getProviderQuotes(tab)
      .pipe(
        tap((resp) => {
          this.tabsSig.set(this.buildTabs(resp.counters));
          this.quotesSig.set(resp.quotes.map((quote) => this.mapQuoteDto(quote)));
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
      .getProviderQuoteDetail(id)
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

  sendProposal(quoteId: number, payload: QuoteProposalPayload): void {
    this.loadingSig.set(true);
    this.api
      .saveProposal(quoteId, payload)
      .pipe(finalize(() => this.loadingSig.set(false)))
      .subscribe({
        next: () => {
          this.selectedQuoteSig.set(null);
          this.loadQuotes(this.activeTabSig());
        },
        error: (err) => {
          const message = err?.error?.error || err?.message || 'No pudimos enviar la cotización.';
          this.errorSig.set(message);
        }
      });
  }

  uploadAttachment(quoteId: number, file: File) {
    this.loadingSig.set(true);
    this.api
      .uploadAttachment(quoteId, file)
      .pipe(finalize(() => this.loadingSig.set(false)))
      .subscribe({
        next: () => {
          if (this.selectedQuoteSig()) {
            this.loadQuoteDetail(quoteId);
          }
        },
        error: (err) => {
          const message = err?.error?.error || err?.message || 'No pudimos adjuntar el archivo.';
          this.errorSig.set(message);
        }
      });
  }

  resetError(): void {
    this.errorSig.set(null);
  }

  onQuoteAction(event: QuoteActionEvent): void {
    if (event.action === 'review' || event.action === 'view') {
      const id = Number(event.quote.id);
      if (!Number.isNaN(id)) {
        this.loadQuoteDetail(id);
      }
    }
  }

  private buildTabs(counters: Record<QuotesTabId, number>): TabDefinition[] {
    return this.defaultTabs.map((tab) => ({
      ...tab,
      badge: counters[tab.id] ?? 0
    }));
  }

  private mapQuoteDto(dto: ProviderQuoteDto): Quote {
    const clientName = dto.client?.name?.trim() || 'Cliente Adomi';
    const serviceName = dto.serviceName?.trim() || 'Solicitud de servicio';
    const requestedAt = this.normalizeDate(dto.requestedAt) || new Date().toISOString();
    const appointmentTime = this.normalizeTime(dto.appointment?.time);
    const requestedTime = appointmentTime || this.normalizeTime(requestedAt);
    const message = dto.message?.trim() || null;
    const proposalInfo = dto.proposal;
    const normalizedAmount =
      typeof dto.amount === 'number'
        ? dto.amount
        : typeof proposalInfo?.amount === 'number'
          ? proposalInfo.amount
          : null;
    const currency = proposalInfo?.currency || dto.currency || 'CLP';
    const normalizedValidUntil =
      this.normalizeDate(dto.validUntil) || this.normalizeDate(proposalInfo?.validUntil);
    const avatarUrl = this.buildAssetUrl(dto.client?.avatarUrl);

    return {
      id: dto.id,
      status: this.normalizeStatus(dto.status),
      serviceName,
      requestedAt,
      requestedTime,
      client: {
        id: dto.client?.id ?? dto.id,
        name: clientName,
        avatarUrl,
        memberSince: dto.client?.memberSince || null
      },
      message,
      amount: normalizedAmount ?? undefined,
      currency: currency ?? undefined,
      validUntil: normalizedValidUntil ?? undefined,
      appointmentDate: dto.appointment?.date || null,
      appointmentTime: appointmentTime || null,
      proposal: proposalInfo
        ? {
            amount: typeof proposalInfo.amount === 'number' ? proposalInfo.amount : normalizedAmount,
            currency: proposalInfo.currency || currency,
            details: proposalInfo.details ?? null,
            validUntil: this.normalizeDate(proposalInfo.validUntil) || normalizedValidUntil
          }
        : undefined
    };
  }

  private normalizeStatus(status: ProviderQuoteDto['status']): QuoteStatus {
    if (status === 'draft') {
      return 'new';
    }
    if (status === 'rejected' || status === 'expired') {
      return status;
    }
    return status;
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
}

