import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';

type WalletMovementType = 'credit' | 'debit';

interface WalletMovement {
  id: number;
  type: WalletMovementType;
  title: string;
  description: string;
  rule?: string;
  amount: number;
  currency: 'CLP';
  date: string;
}

@Component({
  selector: 'app-c-wallet',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class ClientWalletComponent {
  private readonly formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  });

  walletSummary = {
    balance: 41500,
    currency: 'CLP' as const,
    note: 'Tu saldo no expira y solo se genera por reembolsos y compensaciones.'
  };

  movements: WalletMovement[] = [
    {
      id: 1,
      type: 'credit',
      title: 'Reembolso (Cancelación >24h)',
      description: 'Cita #12345',
      rule: 'Regla 3.1',
      amount: 30000,
      currency: 'CLP',
      date: '2025-11-10'
    },
    {
      id: 2,
      type: 'credit',
      title: 'Compensación (Proveedor No Asiste)',
      description: 'Cita #12300',
      rule: 'Regla 5.2',
      amount: 16500,
      currency: 'CLP',
      date: '2025-11-08'
    },
    {
      id: 3,
      type: 'debit',
      title: 'Uso de saldo en servicio',
      description: 'Cita #12400',
      amount: 5000,
      currency: 'CLP',
      date: '2025-11-05'
    }
  ];

  formatCurrency(amount: number): string {
    return this.formatter.format(amount);
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}


