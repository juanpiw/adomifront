import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';

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
  @ViewChild('transactionsSection') transactionsSectionRef?: ElementRef<HTMLDivElement>;

  // Estado del modal
  showAddCardModal = false;
  // Evitar uso de inject() por compatibilidad con builder
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}
  
  // Datos de las tarjetas
  cards: Card[] = [];
  paymentPreference: 'card'|'cash'|null = null;

  // Datos de transacciones
  transactions: Transaction[] = [];
  transactionsLoading = false;
  transactionsError = '';

  // Estado del saldo
  balance = 0;
  balanceStatus: 'positive' | 'negative' | 'zero' = 'zero';

  ngOnInit() {
    this.loadPaymentData();
    this.fetchCards();
    this.fetchTransactions();

    this.route.queryParamMap.subscribe(params => {
      const view = params.get('view');
      if (view === 'history') {
        setTimeout(() => this.scrollToTransactions(), 200);
      } else if (view === 'methods') {
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
      }
    });
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

  private fetchTransactions() {
    this.transactionsLoading = true;
    this.transactionsError = '';

    this.http.get<any>(`${environment.apiBaseUrl}/client/payments/history?limit=100`, { headers: this.headers() }).subscribe({
      next: (res: any) => {
        this.transactionsLoading = false;
        const rows = res?.transactions || [];
        this.transactions = rows.map((row: any) => this.mapTransaction(row));
      },
      error: (err) => {
        console.error('[CLIENT_PAGOS] Error al cargar historial de pagos:', err);
        this.transactionsLoading = false;
        this.transactionsError = err?.error?.error || err?.message || 'No se pudieron cargar las transacciones.';
      }
    });
  }

  private mapTransaction(row: any): Transaction {
    const paymentMethod = this.normalizePaymentMethod(row?.paymentMethod || row?.payment_method);
    const commission = Number(row?.commissionAmount ?? row?.commission_amount ?? 0);

    const dateSource = this.resolveDateSource(row);
    const date = dateSource.toISOString();

    return {
      id: String(row?.id || ''),
      date,
      service: row?.service || row?.service_name || 'Servicio reservado',
      totalAmount: Number(row?.amount ?? row?.totalAmount ?? 0),
      paymentMethod,
      commission
    };
  }

  private resolveDateSource(row: any): Date {
    const paidAt = row?.paidAt || row?.paid_at || row?.created_at;
    const appointmentDate = row?.appointmentDate || row?.appointment_date;
    const appointmentTime = row?.appointmentTime || row?.appointment_time;

    if (paidAt) {
      const paidDate = new Date(paidAt);
      if (!Number.isNaN(paidDate.getTime())) {
        return paidDate;
      }
    }

    if (appointmentDate) {
      const dateString = appointmentTime
        ? `${appointmentDate}T${appointmentTime}`
        : `${appointmentDate}T00:00:00`;
      const appointment = new Date(dateString);
      if (!Number.isNaN(appointment.getTime())) {
        return appointment;
      }
    }

    return new Date();
  }

  private normalizePaymentMethod(method: string): string {
    switch (method) {
      case 'card':
      case 'tarjeta':
        return 'Tarjeta';
      case 'cash':
      case 'efectivo':
        return 'Efectivo';
      case 'transfer':
        return 'Transferencia';
      case 'wallet':
        return 'Wallet';
      default:
        return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Otro';
    }
  }

  private scrollToTransactions() {
    if (this.transactionsSectionRef?.nativeElement) {
      this.transactionsSectionRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
