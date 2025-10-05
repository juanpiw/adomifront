import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  PaymentMethodsHeaderComponent,
  SavedCardsSectionComponent,
  BalanceCardComponent,
  TransactionsTableComponent,
  AddCardModalComponent,
  Card,
  Transaction,
  CardFormData
} from '../../../../libs/shared-ui/payment-methods';

@Component({
  selector: 'app-c-pagos',
  standalone: true,
  imports: [
    CommonModule,
    PaymentMethodsHeaderComponent,
    SavedCardsSectionComponent,
    BalanceCardComponent,
    TransactionsTableComponent,
    AddCardModalComponent
  ],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss']
})
export class ClientPagosComponent implements OnInit {
  // Estado del modal
  showAddCardModal = false;
  
  // Datos de las tarjetas
  cards: Card[] = [
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

  // Datos de transacciones
  transactions: Transaction[] = [
    {
      id: '1',
      date: '2024-01-15',
      service: 'Soporte Técnico - PC',
      totalAmount: 125000,
      paymentMethod: 'Tarjeta',
      commission: 18750
    },
    {
      id: '2',
      date: '2024-01-14',
      service: 'Limpieza de Hogar',
      totalAmount: 85000,
      paymentMethod: 'Efectivo',
      commission: 12750
    },
    {
      id: '3',
      date: '2024-01-13',
      service: 'Corte de Cabello',
      totalAmount: 45000,
      paymentMethod: 'Tarjeta',
      commission: 6750
    },
    {
      id: '4',
      date: '2024-01-12',
      service: 'Reparación de Lavadora',
      totalAmount: 180000,
      paymentMethod: 'Tarjeta',
      commission: 27000
    },
    {
      id: '5',
      date: '2024-01-11',
      service: 'Clases de Yoga',
      totalAmount: 60000,
      paymentMethod: 'Efectivo',
      commission: 9000
    }
  ];

  // Estado del saldo
  balance = 0;
  balanceStatus: 'positive' | 'negative' | 'zero' = 'zero';

  ngOnInit() {
    this.loadPaymentData();
  }

  private loadPaymentData() {
    // Simular carga de datos
    // En una aplicación real, esto vendría de un servicio
    this.calculateBalanceStatus();
  }

  private calculateBalanceStatus() {
    if (this.balance > 0) {
      this.balanceStatus = 'positive';
    } else if (this.balance < 0) {
      this.balanceStatus = 'negative';
    } else {
      this.balanceStatus = 'zero';
    }
  }

  // Eventos de tarjetas
  onCardDeleted(cardId: string) {
    this.cards = this.cards.filter(card => card.id !== cardId);
    console.log('Tarjeta eliminada:', cardId);
  }

  onCardSetPrimary(cardId: string) {
    this.cards = this.cards.map(card => ({
      ...card,
      isPrimary: card.id === cardId
    }));
    console.log('Tarjeta principal establecida:', cardId);
  }

  onAddCard() {
    this.showAddCardModal = true;
  }

  onCardAdded(cardData: CardFormData) {
    // Simular agregar nueva tarjeta
    const newCard: Card = {
      id: Date.now().toString(),
      type: 'visa', // Por defecto
      lastFour: cardData.cardNumber.slice(-4),
      expiryMonth: cardData.expiryDate.split('/')[0],
      expiryYear: cardData.expiryDate.split('/')[1],
      isPrimary: this.cards.length === 0 // Primera tarjeta es principal
    };

    this.cards.push(newCard);
    console.log('Nueva tarjeta agregada:', newCard);
  }

  onCloseModal() {
    this.showAddCardModal = false;
  }

  // Eventos de saldo
  onLiquidationRequested() {
    console.log('Solicitud de liquidación');
    // Implementar lógica de liquidación
  }

  onWithdrawalRequested() {
    console.log('Solicitud de retiro');
    // Implementar lógica de retiro
  }
}
