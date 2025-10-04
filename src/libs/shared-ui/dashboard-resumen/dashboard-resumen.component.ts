import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardMetric {
  label: string;
  value: string | number;
  meta: string;
}

@Component({
  selector: 'app-dashboard-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-resumen.component.html',
  styleUrls: ['./dashboard-resumen.component.scss']
})
export class DashboardResumenComponent {
  @Input() title: string = 'Panel de Control Principal';
  @Input() metrics: DashboardMetric[] = [
    {
      label: 'Citas Pendientes',
      value: 42,
      meta: 'Próximos 7 días'
    },
    {
      label: 'Ingresos (Mes)',
      value: '$12.5k',
      meta: 'Meta: $15k'
    },
    {
      label: 'Nuevos Clientes',
      value: 18,
      meta: 'Este mes'
    },
    {
      label: 'Tasa de Ocupación',
      value: '85%',
      meta: 'Semana actual'
    }
  ];

  @Input() loading: boolean = false;

  trackByLabel(index: number, metric: DashboardMetric): string {
    return metric.label;
  }
}
