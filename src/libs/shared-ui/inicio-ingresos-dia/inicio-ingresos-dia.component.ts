import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IngresosDiaData {
  amount: string;
  completedAppointments: number;
  averageRating: number;
  chartData?: number[];
}

@Component({
  selector: 'app-inicio-ingresos-dia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-ingresos-dia.component.html',
  styleUrls: ['./inicio-ingresos-dia.component.scss']
})
export class InicioIngresosDiaComponent implements OnInit, OnDestroy {
  @Input() data: IngresosDiaData = {
    amount: '$25.000',
    completedAppointments: 3,
    averageRating: 4.8,
    chartData: [8, 12, 15, 18, 25, 22, 20]
  };

  @Output() viewReportClick = new EventEmitter<IngresosDiaData>();

  private chart: any = null;

  ngOnInit() {
    this.createChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  onViewReportClick() {
    this.viewReportClick.emit(this.data);
  }

  private async createChart() {
    try {
      const { Chart, registerables } = await import('chart.js/auto');
      Chart.register(...registerables);

      const canvas = document.getElementById('incomeDayChart') as HTMLCanvasElement;
      if (canvas && this.data.chartData) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['6h', '9h', '12h', '15h', '18h', '21h', '24h'],
              datasets: [{
                label: 'Ingresos',
                data: this.data.chartData,
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
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '#f1f5f9'
                  },
                  ticks: {
                    callback: function(value) {
                      return '$' + value + 'k';
                    }
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
        }
      }
    } catch (error) {
      console.error('Error loading Chart.js:', error);
    }
  }
}
