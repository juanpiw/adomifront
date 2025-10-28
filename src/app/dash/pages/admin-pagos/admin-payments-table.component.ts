import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-payments-table',
  standalone: true,
  imports: [CommonModule],
  template: `
  <table *ngIf="rows?.length" class="table">
    <thead>
      <tr>
        <th (click)="sortBy('id')">ID</th>
        <th (click)="sortBy('paid_at')">Pagado</th>
        <th (click)="sortBy('service_name')">Servicio</th>
        <th (click)="sortBy('client_name')">Cliente</th>
        <th (click)="sortBy('provider_name')">Proveedor</th>
        <th (click)="sortBy('amount')">Monto</th>
        <th (click)="sortBy('commission_amount')">Comisión</th>
        <th (click)="sortBy('provider_amount')">Neto</th>
        <th (click)="sortBy('gateway')">Gateway</th>
        <th>Banco</th>
        <th>Cuenta</th>
        <th>Estado</th>
        <th>Monto a transferir</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let r of paginatedRows()">
        <td>{{ r.id }}</td>
        <td>{{ r.paid_at | date:'short' }}</td>
        <td>{{ r.service_name }}</td>
        <td>{{ r.client_name || r.client_email }}</td>
        <td>{{ r.provider_name || r.provider_email }}</td>
        <td>{{ r.amount | number:'1.0-0' }} {{ r.currency }}</td>
        <td>{{ r.commission_amount | number:'1.0-0' }}</td>
        <td>{{ r.provider_amount | number:'1.0-0' }}</td>
        <td>{{ r.gateway || '-' }}</td>
        <td>{{ r.bank_name || '-' }}</td>
        <td>{{ r.bank_last4 ? ('•••• ' + r.bank_last4) : '-' }}</td>
        <td><span [ngStyle]="statusStyle(r.settlement_status)">{{ r.settlement_status }}</span></td>
        <td><strong>{{ r.provider_amount | number:'1.0-0' }} {{ r.currency }}</strong></td>
        <td>
          <select (change)="onActionSelect($event, r)">
            <option value="">Acción</option>
            <option value="pay" [disabled]="r.settlement_status === 'completed'">A pagar</option>
          </select>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="paginator" *ngIf="(rows?.length || 0) > pageSize">
    <button (click)="prevPage()" [disabled]="page===1">«</button>
    <span>Página {{ page }} / {{ totalPages() }}</span>
    <button (click)="nextPage()" [disabled]="page>=totalPages()">»</button>
  </div>
  `,
  styles: [`
    .table { width:100%; border-collapse: collapse; }
    .table th, .table td { padding:10px; border-bottom:1px solid var(--border); font-size:13px; }
    .table th { cursor:pointer; user-select:none; }
    .paginator { display:flex; align-items:center; gap:8px; margin-top:8px; }
  `]
})
export class AdminPaymentsTableComponent {
  @Input() rows: any[] = [];
  @Output() action = new EventEmitter<{ type: 'pay'; row: any }>();
  page = 1;
  pageSize = 25;
  sortKey: string | null = null;
  sortDir: 'asc' | 'desc' = 'desc';

  statusStyle(status: string) {
    const map: any = {
      pending: { background: '#fff7ed', color: '#b45309', padding: '2px 6px', borderRadius: '8px' },
      eligible: { background: '#ecfeff', color: '#0e7490', padding: '2px 6px', borderRadius: '8px' },
      completed: { background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '8px' },
      failed: { background: '#fef2f2', color: '#b91c1c', padding: '2px 6px', borderRadius: '8px' }
    };
    return map[status] || {};
  }

  onAction(val: string, row: any) {
    if (val === 'pay') this.action.emit({ type: 'pay', row });
  }

  onActionSelect(event: Event, row: any) {
    const target = event.target as HTMLSelectElement | null;
    const val = target && typeof target.value === 'string' ? target.value : '';
    this.onAction(val, row);
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }

  sortedRows() {
    if (!this.sortKey) return this.rows || [];
    const k = this.sortKey;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...(this.rows || [])].sort((a: any, b: any) => {
      const av = a[k]; const bv = b[k];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });
  }

  paginatedRows() {
    const rows = this.sortedRows();
    const start = (this.page - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  }

  totalPages() {
    return Math.ceil((this.rows?.length || 0) / this.pageSize) || 1;
  }

  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages()) this.page++; }
}


