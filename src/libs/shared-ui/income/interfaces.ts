// Interfaces para el sistema de ingresos

export interface Transaction {
  id: number;
  date: string; // ISO date
  description: string;
  grossAmount: number;
  netAmount: number;
  status: 'Completado' | 'Pendiente' | 'Procesando';
}

export interface PaymentSettings {
  accountType: 'corriente' | 'vista' | 'ahorro';
  bankName: string;
  accountNumber: string;
  rutHolder: string;
}

export interface IncomeGoal {
  id?: number;
  amount: number;
  period: 'mensual' | 'trimestral';
  setDate: string; // ISO date
  currentProgress?: number; // 0-100
  isCompleted?: boolean;
}

export interface FinancialKPIs {
  netIncome: number;
  commissions: number;
  pendingPayments: number;
  pendingDate?: string; // ISO date
}

export interface TabConfig {
  id: string;
  label: string;
  isActive: boolean;
}

export interface KpiCard {
  id: string;
  label: string;
  value: number;
  description: string;
  color: 'indigo' | 'red' | 'yellow';
  icon: 'trending-up' | 'banknote' | 'clock';
  actionText?: string;
  actionCallback?: () => void;
}
