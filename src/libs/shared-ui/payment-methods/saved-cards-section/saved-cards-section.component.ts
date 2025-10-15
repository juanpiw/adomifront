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
  @Input() cards: Card[] = [
    {
      id: '1',
      type: 'visa',
      lastFour: '1234',
      expiryMonth: '10',
      expiryYear: '27',
      isPrimary: true
    },
    {
      id: '2',
      type: 'mastercard',
      lastFour: '5678',
      expiryMonth: '05',
      expiryYear: '26',
      isPrimary: false
    },
    {
      id: '3',
      type: 'amex',
      lastFour: '9012',
      expiryMonth: '01',
      expiryYear: '29',
      isPrimary: false
    }
  ];

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
}






