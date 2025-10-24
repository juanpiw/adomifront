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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../auth/services/auth.service';

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
  // Evitar uso de inject() por compatibilidad con builder
  constructor(private http: HttpClient, private auth: AuthService) {}
  
  // Datos de las tarjetas
  cards: Card[] = [];
  paymentPreference: 'card'|'cash'|null = null;

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
    this.fetchCards();
  }

  private loadPaymentData() {
    // Simular carga de datos
    // En una aplicación real, esto vendría de un servicio
    this.calculateBalanceStatus();
  }

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  private fetchCards() {
    this.http.get<any>(`${environment.apiBaseUrl}/client/payment-methods`, { headers: this.headers() }).subscribe({
      next: (res: any) => {
        const rows = res?.data?.cards || [];
        this.paymentPreference = res?.data?.preference || null;
        this.cards = rows.map((r: any) => ({
          id: String(r.id),
          type: (String(r.card_brand || '').toLowerCase() as any) || 'visa',
          lastFour: r.card_last4 || r.last4 || '0000',
          expiryMonth: String(r.exp_month || '').padStart(2,'0'),
          expiryYear: String(r.exp_year || ''),
          isPrimary: !!r.is_default
        }));
      },
      error: () => {}
    });
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
    this.http.delete(`${environment.apiBaseUrl}/client/payment-methods/${cardId}`, { headers: this.headers() }).subscribe({
      next: () => this.fetchCards(),
      error: () => alert('No se pudo eliminar la tarjeta')
    });
  }

  onCardSetPrimary(cardId: string) {
    this.http.post(`${environment.apiBaseUrl}/client/payment-methods/set-primary`, { id: Number(cardId) }, { headers: this.headers() }).subscribe({
      next: () => this.fetchCards(),
      error: () => alert('No se pudo establecer como principal')
    });
  }

  onAddCard() {
    this.showAddCardModal = true;
  }

  onCardAdded(cardData: CardFormData) {
    console.log('[CLIENT_PAGOS] onCardAdded ->', cardData);
    this.http.post<any>(`${environment.apiBaseUrl}/client/payment-methods`, {
      cardNumber: cardData.cardNumber,
      expiryDate: cardData.expiryDate
    }, { headers: this.headers() }).subscribe({
      next: () => {
        console.log('[CLIENT_PAGOS] card saved');
        this.showAddCardModal = false;
        this.fetchCards();
      },
      error: (err) => {
        console.error('[CLIENT_PAGOS] error saving card', err);
        alert('No se pudo guardar la tarjeta');
      }
    });
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
