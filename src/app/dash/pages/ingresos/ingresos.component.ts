import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  FinancesHeaderComponent,
  TabNavigationComponent,
  FinancialKpisComponent,
  TransactionsTableComponent,
  PaymentSettingsFormComponent,
  IncomeGoalsComponent,
  FinancialKPIs,
  Transaction,
  PaymentSettings,
  IncomeGoal
} from '../../../../libs/shared-ui/income';
import { 
  TimeFilterComponent,
  TimeFilterChange
} from '../../../../libs/shared-ui/time-filter/time-filter.component';

@Component({
  selector: 'app-dash-ingresos',
  standalone: true,
  imports: [
    CommonModule,
    FinancesHeaderComponent,
    TabNavigationComponent,
    FinancialKpisComponent,
    TransactionsTableComponent,
    PaymentSettingsFormComponent,
    IncomeGoalsComponent,
    TimeFilterComponent
  ],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss']
})
export class DashIngresosComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}
  activeTab = 'resumen';
  selectedTimeFilter = 'month';
  currentDateRange: { startDate: Date; endDate: Date } = {
    startDate: new Date(),
    endDate: new Date()
  };
  
  // Datos de KPIs financieros
  financialKPIs: FinancialKPIs = {
    netIncome: 2150000,
    commissions: 350000,
    pendingPayments: 420000,
    pendingDate: '2025-11-05'
  };
  
  // Datos de transacciones
  transactions: Transaction[] = [
    {
      id: 1,
      date: '2025-09-28',
      description: 'Depósito Citas Semanales (18-24 Sep)',
      grossAmount: 550000,
      netAmount: 495000,
      status: 'Completado'
    },
    {
      id: 2,
      date: '2025-09-21',
      description: 'Depósito Citas Semanales (11-17 Sep)',
      grossAmount: 480000,
      netAmount: 432000,
      status: 'Completado'
    },
    {
      id: 3,
      date: '2025-09-14',
      description: 'Depósito Citas Semanales (4-10 Sep)',
      grossAmount: 620000,
      netAmount: 558000,
      status: 'Completado'
    },
    {
      id: 4,
      date: '2025-10-05',
      description: 'Depósito Citas Semanales (25 Sep - 1 Oct)',
      grossAmount: 420000,
      netAmount: 378000,
      status: 'Pendiente'
    }
  ];
  
  // Configuración de pagos
  paymentSettings: PaymentSettings = {
    accountType: 'corriente',
    bankName: 'Banco de Chile',
    accountNumber: '12345678901',
    rutHolder: '12.345.678-9'
  };
  
  // Meta actual
  currentGoal: IncomeGoal | null = {
    id: 1,
    amount: 3000000,
    period: 'mensual',
    setDate: '2025-10-01',
    currentProgress: 71.7,
    isCompleted: false
  };
  
  // Ingresos actuales para calcular progreso
  currentIncome = 2150000;

  ngOnInit() {
    // Leer query parameters para configurar el filtro automáticamente
    this.route.queryParams.subscribe(params => {
      if (params['period']) {
        this.selectedTimeFilter = params['period'];
        console.log('Filtro configurado automáticamente desde query params:', params['period']);
      }
      if (params['type']) {
        console.log('Tipo de reporte:', params['type']);
      }
    });
    
    // Cargar datos iniciales
    this.loadFinancialData();
  }

  onTabChanged(tabId: string) {
    this.activeTab = tabId;
  }

  onViewDetailsClicked() {
    console.log('Ver detalles de pagos pendientes');
    // Aquí se podría abrir un modal o navegar a una página de detalles
  }

  onViewAllTransactions() {
    console.log('Ver todas las transacciones');
    // Aquí se podría navegar a una página completa de transacciones
  }

  onTransactionSelected(transaction: Transaction) {
    console.log('Transacción seleccionada:', transaction);
    // Aquí se podría mostrar detalles de la transacción
  }

  onPaymentSettingsSaved(settings: PaymentSettings) {
    console.log('Configuración de pagos guardada:', settings);
    this.paymentSettings = settings;
    // Aquí se podría mostrar un mensaje de éxito
  }

  onPaymentSettingsChanged(settings: PaymentSettings) {
    this.paymentSettings = settings;
  }

  onGoalSet(goal: IncomeGoal) {
    console.log('Meta establecida:', goal);
    this.currentGoal = goal;
    // Aquí se podría mostrar un mensaje de éxito
  }

  onGoToSummary() {
    this.activeTab = 'resumen';
  }

  onTimeFilterChanged(filterChange: TimeFilterChange) {
    this.selectedTimeFilter = filterChange.period;
    this.currentDateRange = {
      startDate: filterChange.startDate,
      endDate: filterChange.endDate
    };
    
    console.log('Filtro de tiempo cambiado:', {
      period: filterChange.period,
      startDate: filterChange.startDate,
      endDate: filterChange.endDate
    });
    
    // Recargar datos con el nuevo rango de fechas
    this.loadFinancialData();
  }

  private loadFinancialData() {
    // Aquí se cargarían los datos reales desde un servicio
    // usando this.currentDateRange.startDate y this.currentDateRange.endDate
    console.log('Cargando datos financieros para el período:', {
      desde: this.currentDateRange.startDate,
      hasta: this.currentDateRange.endDate,
      período: this.selectedTimeFilter
    });
    
    // Simular carga de datos basada en el período seleccionado
    this.updateFinancialDataBasedOnPeriod();
  }

  private updateFinancialDataBasedOnPeriod() {
    // Simular diferentes datos según el período seleccionado
    const baseData = {
      day: { netIncome: 75000, commissions: 12000, pendingPayments: 0 },
      week: { netIncome: 450000, commissions: 72000, pendingPayments: 0 },
      month: { netIncome: 2150000, commissions: 350000, pendingPayments: 420000 },
      quarter: { netIncome: 6500000, commissions: 1050000, pendingPayments: 1200000 },
      year: { netIncome: 25000000, commissions: 4000000, pendingPayments: 5000000 }
    };

    const data = baseData[this.selectedTimeFilter as keyof typeof baseData] || baseData.month;
    
    this.financialKPIs = {
      ...this.financialKPIs,
      netIncome: data.netIncome,
      commissions: data.commissions,
      pendingPayments: data.pendingPayments
    };
  }
}