import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BalanceStatus = 'positive' | 'negative' | 'zero';

@Component({
  selector: 'ui-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss']
})
export class BalanceCardComponent {
  @Input() balance: number = 0;
  @Input() status: BalanceStatus = 'zero';
  @Output() liquidationRequested = new EventEmitter<void>();
  @Output() withdrawalRequested = new EventEmitter<void>();

  get balanceFormatted(): string {
    return this.balance.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    });
  }

  get statusMessage(): string {
    switch (this.status) {
      case 'positive':
        return '¡Saldo a favor! Puedes solicitar un retiro.';
      case 'negative':
        return 'Tienes una deuda pendiente. Considera liquidarla.';
      case 'zero':
      default:
        return 'Saldo en equilibrio. ¡Todo en orden!';
    }
  }

  get showLiquidationButton(): boolean {
    return this.status === 'negative';
  }

  get showWithdrawalButton(): boolean {
    return this.status === 'positive';
  }

  onLiquidation() {
    this.liquidationRequested.emit();
  }

  onWithdrawal() {
    this.withdrawalRequested.emit();
  }
}






