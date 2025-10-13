import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

@Component({
  selector: 'app-dashboard-grafico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-grafico.component.html',
  styleUrls: ['./dashboard-grafico.component.scss']
})
export class DashboardGraficoComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Rendimiento de Citas';
  @Input() data: ChartData | null = null;
  @Input() loading: boolean = false;

  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: any = null;
  private chartInstance: any = null;

  ngOnInit() {
    // Datos de ejemplo si no se proporcionan
    if (!this.data) {
      this.data = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Citas',
          data: [12, 19, 8, 15, 22, 18, 14],
          borderColor: '#4338ca',
          backgroundColor: 'rgba(67, 56, 202, 0.1)',
          tension: 0.4
        }]
      };
    }

    this.initializeChart();
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  private async initializeChart() {
    try {
      // Importar Chart.js dinámicamente
      const Chart = await import('chart.js/auto');
      this.chart = Chart.default;

      if (this.chartCanvas && this.data) {
        this.createChart();
      }
    } catch (error) {
      console.error('Error loading Chart.js:', error);
      this.createFallbackChart();
    }
  }

  private createChart() {
    if (!this.chart || !this.chartCanvas || !this.data) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new this.chart(ctx, {
      type: 'line',
      data: this.data,
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
              color: '#f3f4f6'
            },
            ticks: {
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280'
            }
          }
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          }
        }
      }
    });
  }

  private createFallbackChart() {
    // Crear un gráfico simple con CSS si Chart.js no está disponible
    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.data) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dibujar gráfico simple
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const data = this.data.datasets[0].data;
    const maxValue = Math.max(...data);
    const stepX = width / (data.length - 1);
    
    data.forEach((value, index) => {
      const x = index * stepX;
      const y = height - (value / maxValue) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }

  updateChart(newData: ChartData) {
    this.data = newData;
    if (this.chartInstance) {
      this.chartInstance.data = newData;
      this.chartInstance.update();
    } else {
      this.createChart();
    }
  }
}




