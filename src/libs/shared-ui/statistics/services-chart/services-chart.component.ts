import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'ui-services-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-chart.component.html',
  styleUrls: ['./services-chart.component.scss']
})
export class ServicesChartComponent implements OnInit, OnDestroy {
  private chartInstance: any = null;
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.initializeChart();
    }
  }

  ngOnDestroy() {
    if (this.chartInstance && this.isBrowser) {
      this.chartInstance.destroy();
    }
  }

  private async initializeChart() {
    if (!this.isBrowser) return;

    try {
      // Dynamic import de Chart.js solo en el browser
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const ctx = document.getElementById('servicesChart') as HTMLCanvasElement;
      if (!ctx) return;

      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            'Masaje Descontracturante',
            'Corte de Pelo y Barba',
            'Manicure y Pedicure',
            'Facial de Limpieza',
            'Depilación'
          ],
          datasets: [{
            data: [35, 28, 20, 12, 5],
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
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.label}: ${context.parsed}% (${percentage}%)`;
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



