import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Transaction {
  id: string;
  date: string;
  service: string;
  totalAmount: number;
  paymentMethod: string;
  commission: number;
}

@Component({
  selector: 'ui-transactions-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions-table.component.html',
  styleUrls: ['./transactions-table.component.scss']
})
export class TransactionsTableComponent {
  @Input() transactions: Transaction[] = [
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

  @Input() showCount: number = 5;

  get displayedTransactions(): Transaction[] {
    return this.transactions.slice(0, this.showCount);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getCommissionClass(commission: number): string {
    return commission > 0 ? 'commission-positive' : 'commission-negative';
  }
}
