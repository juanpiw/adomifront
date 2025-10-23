import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-summary-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="cards">
    <div class="card">
      <div class="label">Total cobrado</div>
      <div class="value">{{ summary?.total_gross | number:'1.0-0' }} CLP</div>
    </div>
    <div class="card">
      <div class="label">Impuestos</div>
      <div class="value">{{ summary?.total_tax | number:'1.0-0' }} CLP</div>
    </div>
    <div class="card">
      <div class="label">Comisión</div>
      <div class="value">{{ summary?.total_commission | number:'1.0-0' }} CLP</div>
    </div>
    <div class="card">
      <div class="label">Neto proveedores</div>
      <div class="value">{{ summary?.total_provider | number:'1.0-0' }} CLP</div>
    </div>
    <div class="card accent">
      <div class="label">Adeudado hoy</div>
      <div class="value">{{ (summary?.pending_total_provider || 0) + (summary?.eligible_total_provider || 0) | number:'1.0-0' }} CLP</div>
      <div class="sub">Pendiente: {{ summary?.pending_total_provider | number:'1.0-0' }} • Elegible: {{ summary?.eligible_total_provider | number:'1.0-0' }}</div>
    </div>
    <div class="card good">
      <div class="label">Pagado</div>
      <div class="value">{{ summary?.completed_total_provider | number:'1.0-0' }} CLP</div>
    </div>
  </div>
  `,
  styles: [`
    .cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:12px; margin:12px 0; }
    .card { background: var(--panel); border:1px solid var(--border); border-radius:12px; padding:12px; }
    .label { color: var(--text-secondary); font-size:12px; }
    .value { font-size:18px; font-weight:700; }
    .sub { color: var(--text-secondary); font-size:12px; margin-top:4px; }
    .card.accent { border-color:#f59e0b33; background:#fff7ed; }
    .card.good { border-color:#10b98133; background:#ecfdf5; }
  `]
})
export class AdminSummaryCardsComponent {
  @Input() summary: any;
}


