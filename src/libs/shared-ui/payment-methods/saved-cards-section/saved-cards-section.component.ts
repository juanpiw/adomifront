import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Card {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  isPrimary: boolean;
}

@Component({
  selector: 'ui-saved-cards-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved-cards-section.component.html',
  styleUrls: ['./saved-cards-section.component.scss']
})
export class SavedCardsSectionComponent {
  @Input() cards: Card[] = [];
  @Input() preference: 'card'|'cash'|null = null;

  @Output() cardDeleted = new EventEmitter<string>();
  @Output() cardSetPrimary = new EventEmitter<string>();
  @Output() addCard = new EventEmitter<void>();

  onDeleteCard(cardId: string) {
    this.cardDeleted.emit(cardId);
  }

  onSetPrimary(cardId: string) {
    this.cardSetPrimary.emit(cardId);
  }

  onAddCard() {
    this.addCard.emit();
  }

  getCardTypeName(type: string): string {
    switch (type) {
      case 'visa': return 'Visa';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'American Express';
      default: return 'Tarjeta';
    }
  }

  primaryCard(): Card | null {
    return this.cards.find(c => !!c.isPrimary) || null;
  }

  formatLast4(last4: string): string {
    const s = String(last4 || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
    return s.replace(/(\d{2})(\d{2})/, '$1 $2');
  }
}








