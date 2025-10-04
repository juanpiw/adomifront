import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IngresosData {
  amount: string;
  completedAppointments: number;
  averageRating: number;
  chartData?: number[];
}

@Component({
  selector: 'app-inicio-ingresos-mes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-ingresos-mes.component.html',
  styleUrls: ['./inicio-ingresos-mes.component.scss']
})
export class InicioIngresosMesComponent implements OnInit, OnDestroy {
  @Input() data: IngresosData = {
    amount: '$450.000',
    completedAppointments: 22,
    averageRating: 4.9,
    chartData: [45, 62, 78, 55, 89, 95, 82]
  };

  @Output() viewReportClick = new EventEmitter<IngresosData>();

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

      const canvas = document.getElementById('incomeChart') as HTMLCanvasElement;
      if (canvas && this.data.chartData) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
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
