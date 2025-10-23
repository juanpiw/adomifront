import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-payments-table',
  standalone: true,
  imports: [CommonModule],
  template: `
  <table *ngIf="rows?.length" class="table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Pagado</th>
        <th>Servicio</th>
        <th>Cliente</th>
        <th>Proveedor</th>
        <th>Monto</th>
        <th>Comisión</th>
        <th>Neto</th>
        <th>Banco</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let r of rows">
        <td>{{ r.id }}</td>
        <td>{{ r.paid_at | date:'short' }}</td>
        <td>{{ r.service_name }}</td>
        <td>{{ r.client_name || r.client_email }}</td>
        <td>{{ r.provider_name || r.provider_email }}</td>
        <td>{{ r.amount | number:'1.0-0' }} {{ r.currency }}</td>
        <td>{{ r.commission_amount | number:'1.0-0' }}</td>
        <td>{{ r.provider_amount | number:'1.0-0' }}</td>
        <td>{{ r.bank_name || '-' }}</td>
        <td>{{ r.settlement_status }}</td>
      </tr>
    </tbody>
  </table>
  `,
  styles: [`
    .table { width:100%; border-collapse: collapse; }
    .table th, .table td { padding:10px; border-bottom:1px solid var(--border); font-size:13px; }
  `]
})
export class AdminPaymentsTableComponent {
  @Input() rows: any[] = [];
}


