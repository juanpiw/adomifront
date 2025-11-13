import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotesHeaderComponent, QuotesTabsComponent, QuotesGridComponent, QuotesFormComponent } from '../../../../libs/shared-ui/quotes';
import { Quote, QuoteStatus, QuoteActionEvent } from '../../../../libs/shared-ui/quotes/quotes.models';
import { QuoteProposal } from '../../../../libs/shared-ui/quotes/quotes-form/quotes-form.component';
import { QuotesMockService } from '../../../../libs/shared-ui/quotes/services/quotes-mock.service';
import { take } from 'rxjs';

type QuotesTabId = QuoteStatus | 'history';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashQuotesComponent implements OnInit {
  private quotesMock = inject(QuotesMockService);

  tabs = signal<{ id: QuotesTabId; label: string; badge: number }[]>([
    { id: 'new', label: 'Nuevas solicitudes', badge: 0 },
    { id: 'sent', label: 'Enviadas', badge: 0 },
    { id: 'accepted', label: 'Aceptadas', badge: 0 },
    { id: 'history', label: 'Historial', badge: 0 }
  ]);

  activeTab = signal<QuotesTabId>('new');
  quotes = signal<Quote[]>([]);
  selectedQuote = signal<Quote | null>(null);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.refreshTabsCounters();
    this.loadQuotes();
  }

  onTabChange(tabId: QuotesTabId): void {
    this.activeTab.set(tabId);
    this.selectedQuote.set(null);
    this.loadQuotes();
  }

  onQuoteAction(event: QuoteActionEvent): void {
    if (event.action === 'review') {
      this.selectedQuote.set(event.quote);
    } else if (event.action === 'open-chat') {
      // TODO: Integrar con chat real
      console.log('[QUOTES] Abrir chat con cliente', event.quote.client);
    } else {
      // view action placeholder
      console.log('[QUOTES] Ver detalles de cotización', event.quote.id);
    }
  }

  onSendProposal(proposal: QuoteProposal): void {
    this.loading.set(true);
    console.log('[QUOTES] Enviar cotización', { quote: this.selectedQuote(), proposal });
    setTimeout(() => {
      this.loading.set(false);
      this.selectedQuote.set(null);
      this.loadQuotes();
      this.refreshTabsCounters();
    }, 800);
  }

  onSaveDraft(proposal: QuoteProposal): void {
    console.log('[QUOTES] Guardar borrador', { quote: this.selectedQuote(), proposal });
  }

  onFilesDropped(files: File[]): void {
    console.log('[QUOTES] Archivos adjuntos', files);
  }

  private loadQuotes(): void {
    this.quotesMock.getQuotes(this.activeTab()).pipe(take(1)).subscribe((quotes) => {
      this.quotes.set(quotes);
    });
  }

  private refreshTabsCounters(): void {
    this.quotesMock.getTabsCounters().pipe(take(1)).subscribe((counters) => {
      this.tabs.set([
        { id: 'new', label: 'Nuevas solicitudes', badge: counters['new'] ?? 0 },
        { id: 'sent', label: 'Enviadas', badge: counters['sent'] ?? 0 },
        { id: 'accepted', label: 'Aceptadas', badge: counters['accepted'] ?? 0 },
        { id: 'history', label: 'Historial', badge: counters['history'] ?? 0 }
      ]);
    });
  }
}

