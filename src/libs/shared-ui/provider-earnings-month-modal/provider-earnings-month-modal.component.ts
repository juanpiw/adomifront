import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FinanceTransactionDto } from '../../../app/services/finances.service';

@Component({
  selector: 'ui-provider-earnings-month-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-earnings-month-modal.component.html',
  styleUrls: ['./provider-earnings-month-modal.component.scss']
})
export class ProviderEarningsMonthModalComponent {
  @Input() isOpen = false;
  @Input() monthLabel: string | null = null;
  @Input() commissionRate: number | null = null;

  @Input() loading = false;
  @Input() error: string | null = null;

  @Input() transactions: FinanceTransactionDto[] = [];
  @Input() total = 0;

  @Output() close = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('earnings-modal__backdrop')) {
      this.close.emit();
    }
  }

  hasMore(): boolean {
    return (this.total || 0) > (this.transactions?.length || 0);
  }

  formatMoney(amount: number, currency?: string | null): string {
    const value = Number(amount || 0);
    const curr = String(currency || 'CLP').toUpperCase();
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: curr === 'CLP' ? 'CLP' : curr,
        maximumFractionDigits: 0
      }).format(value);
    } catch {
      return `$${value.toLocaleString('es-CL')}`;
    }
  }

  formatWhen(tx: FinanceTransactionDto): string {
    const date = (tx?.date || '').trim();
    const time = (tx?.start_time || '').trim();
    if (date && time) return `${date} · ${time}`;
    if (date) return date;
    return (tx?.paid_at || '').toString();
  }

  totalNet(): number {
    return (this.transactions || []).reduce((acc, t) => acc + Number(t?.provider_amount || 0), 0);
  }

  totalGross(): number {
    return (this.transactions || []).reduce((acc, t) => acc + Number(t?.amount || 0), 0);
  }

  totalCommission(): number {
    return (this.transactions || []).reduce((acc, t) => acc + Number(t?.commission_amount || 0), 0);
  }
}


