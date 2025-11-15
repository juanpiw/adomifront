import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IngresosData {
  amount: string;
  completedAppointments: number;
  averageRating: number;
  chartData?: number[];
  chartLabels?: string[];
}

@Component({
  selector: 'app-inicio-ingresos-mes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-ingresos-mes.component.html',
  styleUrls: ['./inicio-ingresos-mes.component.scss']
})
export class InicioIngresosMesComponent implements OnDestroy, OnChanges, AfterViewInit {
  @Input() data: IngresosData = {
    amount: '$450.000',
    completedAppointments: 22,
    averageRating: 4.9,
    chartData: [45, 62, 78, 55, 89, 95, 82]
  };
  @Input() chartId = 'incomeChart';
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  @Output() viewReportClick = new EventEmitter<IngresosData>();
  @Output() navigateToReport = new EventEmitter<{period: string, type: string}>();

  private chart: any = null;
  private viewReady = false;

  ngAfterViewInit() {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].firstChange) {
      this.renderChart();
    }
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  onViewReportClick() {
    this.viewReportClick.emit(this.data);
    this.navigateToReport.emit({ period: 'month', type: 'monthly' });
  }

  private destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private async renderChart() {
    if (!this.viewReady) return;
    const dataset = this.data.chartData || [];
    if (!dataset.length) {
      this.destroyChart();
      return;
    }
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.destroyChart();

    try {
      const { Chart, registerables } = await import('chart.js/auto');
      Chart.register(...registerables);
      const labels = this.data.chartLabels && this.data.chartLabels.length
        ? this.data.chartLabels
        : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const formatCurrency = (value: unknown) => {
        const numeric = typeof value === 'number' ? value : Number(value) || 0;
        return '$' + numeric.toLocaleString('es-CL');
      };
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Ingresos',
            data: dataset,
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
            borderColor: '#4f46e5',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context: any) => formatCurrency(context.parsed.y)
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#f1f5f9'
              },
              ticks: {
                callback: (value: unknown) => formatCurrency(value)
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    } catch (error) {
      console.error('Error loading Chart.js:', error);
    }
  }
}
