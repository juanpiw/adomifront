import { ChangeDetectionStrategy, Component, OnInit, effect, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { QuotesHeaderComponent, QuotesTabsComponent, QuotesGridComponent } from '../../../../libs/shared-ui/quotes';
import { Quote, QuoteActionEvent } from '../../../../libs/shared-ui/quotes/quotes.models';
import { ClientQuotesStore } from './client-quotes.store';
import { ClientQuoteTabId } from '../../../services/quotes-client.service';
import { ModalConfirmacionComponent } from '../../../../libs/shared-ui/modal-confirmacion/modal-confirmacion.component';

@Component({
  selector: 'app-client-quotes',
  standalone: true,
  imports: [CommonModule, QuotesHeaderComponent, QuotesTabsComponent, QuotesGridComponent, ModalConfirmacionComponent, CurrencyPipe, DatePipe],
  templateUrl: './client-quotes.component.html',
  styleUrls: ['./client-quotes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClientQuotesStore]
})
export class ClientQuotesComponent implements OnInit {
  private store = inject(ClientQuotesStore);

  @Output() countersChange = new EventEmitter<Record<ClientQuoteTabId, number>>();

  acceptModalOpen = false;
  private quotePendingAcceptance: Quote | null = null;

  tabs = this.store.tabs;
  activeTab = this.store.activeTab;
  quotes = this.store.quotes;
  loading = this.store.loading;
  error = this.store.error;
  selectedQuote = this.store.selectedQuote;
  accepting = this.store.accepting;
  acceptError = this.store.acceptError;
  acceptSuccess = this.store.acceptSuccess;

  constructor() {
    effect(() => {
      const counters = this.store.counters();
      this.countersChange.emit(counters);
    });

    effect(() => {
      if (this.acceptSuccess()) {
        this.acceptModalOpen = false;
        this.quotePendingAcceptance = null;
        this.store.resetAcceptState();
      }
    });
  }

  ngOnInit(): void {
    this.store.loadQuotes('new');
  }

  onTabChange(tabId: ClientQuoteTabId): void {
    this.store.loadQuotes(tabId);
  }

  onQuoteAction(event: QuoteActionEvent): void {
    this.store.onQuoteAction(event);
  }

  formatFileSize(size?: number | null): string {
    if (!size || size <= 0) return '';
    const kb = size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  hasProposalAmount(quote: Quote): boolean {
    return typeof this.getProposalAmount(quote) === 'number';
  }

  getProposalAmount(quote: Quote): number | null {
    if (typeof quote.proposal?.amount === 'number') return quote.proposal.amount;
    if (typeof quote.amount === 'number') return quote.amount;
    return null;
  }

  getProposalCurrency(quote: Quote): string {
    return quote.proposal?.currency || quote.currency || 'CLP';
  }

  getProposalValidUntil(quote: Quote): string | null {
    return quote.proposal?.validUntil || quote.validUntil || null;
  }

  safeDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  providerPlaceholder(name?: string | null): string {
    const initial = (name || 'P').trim().charAt(0).toUpperCase() || 'P';
    return `https://placehold.co/64x64/0f172a/ffffff?text=${initial}`;
  }

  canAcceptQuote(quote: Quote | null): boolean {
    if (!quote) return false;
    return quote.status === 'sent' && this.hasProposalAmount(quote);
  }

  openAcceptModal(quote: Quote): void {
    if (!this.canAcceptQuote(quote)) return;
    this.quotePendingAcceptance = quote;
    this.acceptModalOpen = true;
    this.store.resetAcceptState();
  }

  closeAcceptModal(): void {
    this.acceptModalOpen = false;
    this.quotePendingAcceptance = null;
    this.store.resetAcceptState();
  }

  confirmAcceptQuote(): void {
    if (!this.quotePendingAcceptance) return;
    this.store.acceptQuote(Number(this.quotePendingAcceptance.id));
  }

  acceptModalMessage(): string {
    const quote = this.quotePendingAcceptance;
    if (!quote) {
      return 'Confirma que deseas aceptar la cotización seleccionada.';
    }
    const formatter = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: this.getProposalCurrency(quote)
    });
    const amount = this.getProposalAmount(quote);
    const formattedAmount = typeof amount === 'number' ? formatter.format(amount) : 'el monto propuesto';
    const validUntil = this.getProposalValidUntil(quote);
    const dateLabel = validUntil ? ` antes del ${new Date(validUntil).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}` : '';
    return `Se notificará al profesional y comenzarán los pasos siguientes para coordinar el servicio "${quote.serviceName}". Confirmas que deseas aceptar la propuesta por ${formattedAmount}${dateLabel}?`;
  }
}

