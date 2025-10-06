import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction } from '../interfaces';

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
      id: 1,
      date: '2025-09-28',
      description: 'Depósito Citas Semanales (18-24 Sep)',
      grossAmount: 550000,
      netAmount: 495000,
      status: 'Completado'
    },
    {
      id: 2,
      date: '2025-09-21',
      description: 'Depósito Citas Semanales (11-17 Sep)',
      grossAmount: 480000,
      netAmount: 432000,
      status: 'Completado'
    },
    {
      id: 3,
      date: '2025-09-14',
      description: 'Depósito Citas Semanales (4-10 Sep)',
      grossAmount: 620000,
      netAmount: 558000,
      status: 'Completado'
    },
    {
      id: 4,
      date: '2025-10-05',
      description: 'Depósito Citas Semanales (25 Sep - 1 Oct)',
      grossAmount: 420000,
      netAmount: 378000,
      status: 'Pendiente'
    }
  ];
  
  @Output() viewAllClicked = new EventEmitter<void>();
  @Output() transactionSelected = new EventEmitter<Transaction>();

  onViewAll() {
    this.viewAllClicked.emit();
  }

  onTransactionClick(transaction: Transaction) {
    this.transactionSelected.emit(transaction);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
