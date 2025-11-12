import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../libs/shared-ui/icon/icon.component';
import {
  ClientWalletMovement,
  ClientWalletService,
  ClientWalletSummary
} from '../../../services/client-wallet.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-c-wallet',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class ClientWalletComponent implements OnInit {
  private walletService = inject(ClientWalletService);
  private router = inject(Router);

  private readonly formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  });

  summaryLoading = true;
  summaryError: string | null = null;
  movementsLoading = true;
  movementsError: string | null = null;

  walletSummary: ClientWalletSummary = {
    balance: 0,
    pending_balance: 0,
    hold_balance: 0,
    total_received: 0,
    total_spent: 0,
    credits_count: 0,
    currency: 'CLP',
    last_updated: null,
    note: 'Tu saldo no expira y solo se genera por reembolsos y compensaciones.'
  };

  movements: ClientWalletMovement[] = [];
  movementsTotal = 0;
  private movementsLimit = 50;
  private movementsOffset = 0;

  ngOnInit(): void {
    this.loadSummary();
    this.loadMovements();
  }

  loadSummary(): void {
    this.summaryLoading = true;
    this.summaryError = null;

    this.walletService.getSummary().subscribe({
      next: ({ summary }) => {
        this.walletSummary = {
          ...summary,
          note: summary.note || this.walletSummary.note
        };
        this.summaryLoading = false;
      },
      error: (err) => {
        console.error('[CLIENT WALLET] Error cargando resumen:', err);
        this.summaryError = err?.error?.error || 'No pudimos cargar tu saldo disponible.';
        this.summaryLoading = false;
      }
    });
  }

  loadMovements(): void {
    this.movementsLoading = true;
    this.movementsError = null;

    this.walletService.getMovements(this.movementsLimit, this.movementsOffset).subscribe({
      next: ({ movements, pagination }) => {
        this.movements = movements;
        this.movementsTotal = pagination?.total ?? movements.length;
        this.movementsLoading = false;
      },
      error: (err) => {
        console.error('[CLIENT WALLET] Error cargando movimientos:', err);
        this.movementsError = err?.error?.error || 'No pudimos cargar el historial de movimientos.';
        this.movementsLoading = false;
      }
    });
  }

  retrySummary(): void {
    this.loadSummary();
  }

  retryMovements(): void {
    this.loadMovements();
  }

  onUseBalance(): void {
    this.router.navigate(['/client/explorar']);
  }

  formatCurrency(amount: number): string {
    return this.formatter.format(amount);
  }

  formatDate(value: string): string {
    if (!value) {
      return '-';
    }
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


