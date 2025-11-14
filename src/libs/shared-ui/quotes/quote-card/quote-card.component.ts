import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Quote, QuoteActionEvent } from '../quotes.models';
import { QuoteStatusPillComponent } from '../quote-status-pill/quote-status-pill.component';
import { IconComponent } from '../../../shared-ui/icon/icon.component';

@Component({
  selector: 'ui-quote-card',
  standalone: true,
  imports: [CommonModule, QuoteStatusPillComponent, IconComponent, CurrencyPipe, DatePipe],
  templateUrl: './quote-card.component.html',
  styleUrls: ['./quote-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuoteCardComponent {
  @Input() quote!: Quote;
  @Input() enableChat = true;
  @Output() action = new EventEmitter<QuoteActionEvent>();

  onPrimaryAction(): void {
    if (!this.quote) return;
    const action: QuoteActionEvent['action'] =
      this.quote.status === 'new' ? 'review' :
      this.quote.status === 'sent' ? 'view' :
      this.quote.status === 'accepted' ? 'view' :
      'view';
    this.action.emit({ quote: this.quote, action });
  }

  onChat(): void {
    if (!this.quote) return;
    this.action.emit({ quote: this.quote, action: 'open-chat' });
  }

  get primaryLabel(): string {
    switch (this.quote?.status) {
      case 'new':
        return 'Revisar y Cotizar';
      case 'sent':
        return 'Ver Cotización';
      case 'accepted':
        return 'Ver Cita (Pend. Pago)';
      default:
        return 'Ver detalles';
    }
  }

  get showChatCta(): boolean {
    return this.enableChat && this.quote?.status === 'new';
  }

  buildAvatarFallback(name?: string | null): string {
    const initial = (name || 'P').trim().charAt(0).toUpperCase() || 'P';
    return `https://placehold.co/40x40/1f2937/ffffff?text=${initial}`;
  }
}


