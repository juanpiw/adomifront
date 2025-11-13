import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, QuoteActionEvent } from '../quotes.models';
import { QuoteCardComponent } from '../quote-card/quote-card.component';
import { QuotesEmptyStateComponent } from '../quotes-empty-state/quotes-empty-state.component';

@Component({
  selector: 'ui-quotes-grid',
  standalone: true,
  imports: [CommonModule, QuoteCardComponent, QuotesEmptyStateComponent],
  templateUrl: './quotes-grid.component.html',
  styleUrls: ['./quotes-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotesGridComponent {
  @Input() quotes: Quote[] | null = [];
  @Input() emptyTitle = 'Sin cotizaciones aún';
  @Input() emptyDescription = 'Cuando un cliente solicite una cotización aparecerá aquí para que respondas rápido.';
  @Output() action = new EventEmitter<QuoteActionEvent>();

  trackByQuoteId(_index: number, quote: Quote): string | number {
    return quote.id;
  }

  onAction(event: QuoteActionEvent): void {
    this.action.emit(event);
  }
}


