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
    chartData: [100, 150, 200, 180, 250, 300, 280]
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
            type: 'line',
            data: {
              labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
              datasets: [{
                label: 'Ingresos',
                data: this.data.chartData,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true
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
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
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
