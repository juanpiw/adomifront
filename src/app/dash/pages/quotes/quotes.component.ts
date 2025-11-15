import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuotesHeaderComponent, QuotesTabsComponent, QuotesGridComponent, QuotesFormComponent } from '../../../../libs/shared-ui/quotes';
import { Quote, QuoteActionEvent } from '../../../../libs/shared-ui/quotes/quotes.models';
import { QuoteProposal } from '../../../../libs/shared-ui/quotes/quotes-form/quotes-form.component';
import { QuotesStore } from './quotes.store';
import { QuotesTabId } from '../../../services/quotes.service';

@Component({
  selector: 'app-dash-quotes',
  standalone: true,
  imports: [
    CommonModule,
    QuotesHeaderComponent,
    QuotesTabsComponent,
    QuotesGridComponent,
    QuotesFormComponent
  ],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [QuotesStore]
})
export class DashQuotesComponent implements OnInit {
  private store = inject(QuotesStore);
  private router = inject(Router);

  tabs = this.store.tabs;
  activeTab = this.store.activeTab;
  quotes = this.store.quotes;
  selectedQuote = this.store.selectedQuote;
  selectedQuoteForForm = this.store.selectedQuoteForForm;
  selectedQuoteAttachments = this.store.selectedQuoteAttachments;
  loading = this.store.loading;
  error = this.store.error;

  ngOnInit(): void {
    this.store.loadQuotes('new');
  }

  onTabChange(tabId: QuotesTabId): void {
    this.store.loadQuotes(tabId);
  }

  onQuoteAction(event: QuoteActionEvent): void {
    if (event.action === 'open-chat') {
      console.log('[QUOTES] Abrir chat con cliente', event.quote.client);
      return;
    }
    this.store.onQuoteAction(event);
  }

  onSendProposal(proposal: QuoteProposal): void {
    const selection = this.selectedQuote();
    if (!selection) return;
    this.store.sendProposal(Number(selection.id), { ...proposal, submit: true });
  }

  onSaveDraft(proposal: QuoteProposal): void {
    const selection = this.selectedQuote();
    if (!selection) return;
    this.store.sendProposal(Number(selection.id), { ...proposal, submit: false });
  }

  onFilesDropped(files: File[]): void {
    const selection = this.selectedQuote();
    if (!selection || !files?.length) return;
    files.forEach((file) => this.store.uploadAttachment(Number(selection.id), file));
  }

  onManageAppointment(quote: Quote): void {
    if (!quote) return;
    const queryParams: Record<string, string> = {
      quoteId: String(quote.id),
      view: 'calendar'
    };
    const normalizedDate = this.extractQuoteDate(quote);
    if (normalizedDate) {
      queryParams['date'] = normalizedDate;
    }
    const normalizedTime = this.extractQuoteTime(quote);
    if (normalizedTime) {
      queryParams['time'] = normalizedTime;
    }
    if (quote.appointmentId !== undefined && quote.appointmentId !== null) {
      queryParams['appointmentId'] = String(quote.appointmentId);
    }
    if (quote.client?.id) {
      queryParams['clientId'] = String(quote.client.id);
    }
    if (quote.client?.name) {
      queryParams['clientName'] = quote.client.name;
    }
    if (quote.serviceName) {
      queryParams['service'] = quote.serviceName;
    }
    const normalizedAmount = this.extractQuoteAmount(quote);
    if (normalizedAmount) {
      queryParams['amount'] = normalizedAmount;
    }
    if (quote.message) {
      queryParams['message'] = quote.message;
    }
    this.router.navigate(['/dash/agenda'], { queryParams });
  }

  private extractQuoteDate(quote: Quote): string | null {
    const candidates = [quote.preferredDate, quote.appointmentDate, quote.requestedAt];
    for (const value of candidates) {
      const normalized = this.normalizeDateOnly(value);
      if (normalized) return normalized;
    }
    return null;
  }

  private normalizeDateOnly(value?: string | null): string | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private extractQuoteTime(quote: Quote): string | null {
    const candidates = [
      this.normalizeTime(this.extractStartTimeFromRange(quote.preferredTimeRange)),
      quote.appointmentTime,
      quote.requestedTime
    ];
    for (const value of candidates) {
      const normalized = this.normalizeTime(value);
      if (normalized) return normalized;
    }
    if (quote.requestedAt) {
      const parsed = new Date(quote.requestedAt);
      if (!Number.isNaN(parsed.getTime())) {
        return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
      }
    }
    return null;
  }

  private normalizeTime(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5);
    const parsed = new Date(`1970-01-01T${trimmed}`);
    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
    }
    return null;
  }

  private extractStartTimeFromRange(range?: string | null): string | null {
    if (!range) return null;
    const match = range.match(/(\d{1,2})[:.](\d{2})/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    const h = String(Math.max(0, Math.min(23, hours))).padStart(2, '0');
    const m = String(Math.max(0, Math.min(59, minutes))).padStart(2, '0');
    return `${h}:${m}`;
  }

  private extractQuoteAmount(quote: Quote): string | null {
    const amountValue = typeof quote.amount === 'number'
      ? quote.amount
      : typeof quote.proposal?.amount === 'number'
        ? quote.proposal.amount
        : null;
    if (amountValue === null) return null;
    return String(Math.round(amountValue));
  }
}

