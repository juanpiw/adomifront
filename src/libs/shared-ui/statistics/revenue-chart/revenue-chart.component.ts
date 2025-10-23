import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'ui-revenue-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.scss']
})
export class RevenueChartComponent implements OnInit, OnDestroy {
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

      const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
      if (!ctx) return;

      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Ingresos ($)',
            data: [450000, 520000, 480000, 610000, 550000, 630000],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: 'Citas',
            data: [18, 22, 19, 25, 21, 28],
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
}








