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
      quoteId: String(quote.id)
    };
    if (quote.client?.id) {
      queryParams['clientId'] = String(quote.client.id);
    }
    if (quote.serviceName) {
      queryParams['service'] = quote.serviceName;
    }
    if (quote.requestedAt) {
      queryParams['requestedAt'] = quote.requestedAt;
    }
    this.router.navigate(['/dash/agenda'], { queryParams });
  }
}

