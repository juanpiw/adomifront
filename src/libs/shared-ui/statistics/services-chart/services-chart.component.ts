import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface ServiceChartItem {
  name: string;
  bookings: number;
  income: number;
}

@Component({
  selector: 'ui-services-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-chart.component.html',
  styleUrls: ['./services-chart.component.scss']
})
export class ServicesChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() services: ServiceChartItem[] = [];
  @Input() loading = false;
  @ViewChild('servicesCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  private chartInstance: any = null;
  private isBrowser = false;
  private ChartLib: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser && this.services?.length) {
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
    if (changes['services'] && !changes['services'].firstChange) {
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
    if (!this.services || !this.services.length) {
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

      const labels = this.services.map(item => item.name);
      const bookings = this.services.map(item => Number(item.bookings || 0));

      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }

      this.chartInstance = new this.ChartLib(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: bookings,
            backgroundColor: [
              '#4f46e5', // indigo-600
              '#0d9488', // teal-600
              '#eab308', // yellow-500
              '#9333ea', // purple-600
              '#ef4444'  // red-500
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                  return `${context.label}: ${context.parsed} reservas (${percentage}%)`;
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
}











