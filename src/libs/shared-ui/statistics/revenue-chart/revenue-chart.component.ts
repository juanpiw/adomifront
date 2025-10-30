import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface RevenueSeriesItem {
  period: string;
  income: number;
  appointments: number;
  payments?: number;
}

@Component({
  selector: 'ui-revenue-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.scss']
})
export class RevenueChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() series: RevenueSeriesItem[] = [];
  @Input() group: 'month' | 'week' = 'month';
  @Input() loading = false;
  @ViewChild('revenueCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  private chartInstance: any = null;
  private isBrowser = false;
  private ChartLib: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser && this.series?.length) {
      this.initializeChart();
    }
  }

  ngOnDestroy() {
    if (this.chartInstance && this.isBrowser) {
      this.chartInstance.destroy();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;
    if (changes['series'] && !changes['series'].firstChange) {
      this.initializeChart();
    }
    if (changes['group'] && !changes['group'].firstChange) {
      this.initializeChart();
    }
  }

  private async loadChartLib() {
    if (this.ChartLib) return;
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    this.ChartLib = Chart;
  }

  private async initializeChart() {
    if (!this.isBrowser) return;
    if (!this.series || !this.series.length) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      return;
    }

    try {
      await this.loadChartLib();
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) return;

      const labels = this.series.map(item => this.formatPeriodLabel(item.period));
      const incomeData = this.series.map(item => Number(item.income || 0));
      const appointmentsData = this.series.map(item => Number(item.appointments || 0));

      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }

      this.chartInstance = new this.ChartLib(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Ingresos ($)',
            data: incomeData,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: 'Citas',
            data: appointmentsData,
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Ingresos ($)'
              },
              ticks: {
                callback: function(value: any) {
                  return '$' + value.toLocaleString();
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Citas'
              },
              grid: {
                drawOnChartArea: false,
              },
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  if (context.datasetIndex === 0) {
                    return 'Ingresos: $' + context.parsed.y.toLocaleString();
                  } else {
                    return 'Citas: ' + context.parsed.y;
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading Chart.js:', error);
    }
  }

  private formatPeriodLabel(period: string): string {
    if (this.group === 'week') {
      return `Sem ${period.split('-')[1] || period}`;
    }
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const date = new Date(year, month, 1);
      return date.toLocaleDateString('es-CL', { month: 'short' });
    }
    return period;
  }
}











