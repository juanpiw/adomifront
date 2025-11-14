import { ChangeDetectionStrategy, Component, OnInit, effect, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { QuotesHeaderComponent, QuotesTabsComponent, QuotesGridComponent } from '../../../../libs/shared-ui/quotes';
import { Quote, QuoteActionEvent } from '../../../../libs/shared-ui/quotes/quotes.models';
import { ClientQuotesStore } from './client-quotes.store';
import { ClientQuoteTabId } from '../../../services/quotes-client.service';

@Component({
  selector: 'app-client-quotes',
  standalone: true,
  imports: [CommonModule, QuotesHeaderComponent, QuotesTabsComponent, QuotesGridComponent, CurrencyPipe, DatePipe],
  templateUrl: './client-quotes.component.html',
  styleUrls: ['./client-quotes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClientQuotesStore]
})
export class ClientQuotesComponent implements OnInit {
  private store = inject(ClientQuotesStore);

  @Output() countersChange = new EventEmitter<Record<ClientQuoteTabId, number>>();

  tabs = this.store.tabs;
  activeTab = this.store.activeTab;
  quotes = this.store.quotes;
  loading = this.store.loading;
  error = this.store.error;
  selectedQuote = this.store.selectedQuote;

  constructor() {
    effect(() => {
      const counters = this.store.counters();
      this.countersChange.emit(counters);
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
}

