import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { FinancialKPIs, KpiCard } from '../interfaces';

@Component({
  selector: 'ui-financial-kpis',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './financial-kpis.component.html',
  styleUrls: ['./financial-kpis.component.scss']
})
export class FinancialKpisComponent {
  @Input() kpis: FinancialKPIs = {
    netIncome: 2150000,
    commissions: 350000,
    pendingPayments: 420000,
    pendingDate: '2025-11-05'
  };
  
  @Output() viewDetailsClicked = new EventEmitter<void>();

  get kpiCards(): KpiCard[] {
    return [
      {
        id: 'net-income',
        label: 'Ingresos Netos Totales',
        value: this.kpis.netIncome,
        description: 'Monto depositado en tu cuenta.',
        color: 'indigo',
        icon: 'trending-up'
      },
      {
        id: 'commissions',
        label: 'Comisiones Adomi',
        value: this.kpis.commissions,
        description: 'Costo de la plataforma y servicios.',
        color: 'red',
        icon: 'banknote'
      },
      {
        id: 'pending-payments',
        label: 'Pagos Pendientes (A depositar)',
        value: this.kpis.pendingPayments,
        description: this.kpis.pendingDate ? `Se depositará el ${this.formatDate(this.kpis.pendingDate)}.` : 'Pendiente de depósito.',
        color: 'yellow',
        icon: 'clock',
        actionText: 'Ver detalles de pagos'
      }
    ];
  }

  onViewDetails() {
    this.viewDetailsClicked.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  }
}
