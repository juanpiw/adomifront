import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction } from '../interfaces';

@Component({
  selector: 'ui-transaction-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-row.component.html',
  styleUrls: ['./transaction-row.component.scss']
})
export class TransactionRowComponent {
  @Input() transaction: Transaction = {
    id: 1,
    date: '2025-09-28',
    description: 'Depósito Citas Semanales (18-24 Sep)',
    grossAmount: 550000,
    netAmount: 495000,
    status: 'Completado'
  };

  get statusClass(): string {
    switch (this.transaction.status) {
      case 'Completado':
        return 'status-completed';
      case 'Pendiente':
        return 'status-pending';
      case 'Procesando':
        return 'status-processing';
      default:
        return 'status-completed';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  }
}






