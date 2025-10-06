import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    IncomeGoalsComponent
  ],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss']
})
export class DashIngresosComponent implements OnInit {
  activeTab = 'resumen';
  
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

  private loadFinancialData() {
    // Aquí se cargarían los datos reales desde un servicio
    console.log('Cargando datos financieros...');
  }
}