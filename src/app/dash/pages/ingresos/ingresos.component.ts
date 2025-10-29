import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { FinancesService } from '../../../services/finances.service';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { ProviderProfileService, ProviderProfile } from '../../../services/provider-profile.service';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

type TbkStatus = 'none' | 'pending' | 'active' | 'restricted';

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
    TimeFilterComponent,
    RouterLink
  ],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss']
})
export class DashIngresosComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}
  private finances = inject(FinancesService);
  private auth = inject(AuthService);
  private providerProfile = inject(ProviderProfileService);
  activeTab = 'resumen';
  selectedTimeFilter = 'month';
  currentDateRange: { startDate: Date; endDate: Date } = {
    startDate: new Date(),
    endDate: new Date()
  };
  private providerId: number | null = null;
  private currentUser: AuthUser | null = null;
  private currentProfile: ProviderProfile | null = null;
  tbkStatus: TbkStatus = 'none';
  tbkSecondaryCode: string | null = null;
  tbkRemote: Record<string, any> | null = null;
  tbkSectionLoading = false;
  tbkActionLoading = false;
  tbkError: string | null = null;
  tbkLastUpdated: Date | null = null;
  tbkKycReady = false;
  tbkKycMissing: string[] = [];
  tbkCurrentAction: 'status' | 'create' | 'refresh' | 'revoke' | null = null;
  
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
    holderName: 'Juan Pérez',
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
    this.initializeTbkOnboarding();
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
    const from = this.formatDate(this.currentDateRange.startDate);
    const to = this.formatDate(this.currentDateRange.endDate);
    this.finances.getSummary(from, to).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.financialKPIs = {
            netIncome: Number(resp.summary.provider_net || 0),
            commissions: Number(resp.summary.commission_amount || 0),
            pendingPayments: 0,
            pendingDate: ''
          };
        }
      },
      error: () => {}
    });
    this.finances.getTransactions(from, to, 50, 0).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.transactions = (resp.transactions || []).map(t => ({
            id: t.id,
            date: t.paid_at ? this.toYmd(t.paid_at) : t.date,
            description: `${t.service_name || 'Servicio'} – ${t.client_name || 'Cliente'}`,
            grossAmount: Number(t.amount || 0),
            netAmount: Number(t.provider_amount || 0),
            status: 'Completado'
          }));
        }
      },
      error: () => {}
    });
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }
  private toYmd(iso: string): string {
    const dt = new Date(iso);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  private async initializeTbkOnboarding() {
    this.tbkSectionLoading = true;
    this.tbkError = null;

    this.currentUser = await this.ensureCurrentUser();
    if (this.currentUser?.id) {
      this.providerId = this.currentUser.id;
    }

    this.providerProfile.getProfile().pipe(take(1)).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        if (!this.providerId) {
          this.providerId = profile?.provider_id || profile?.id || null;
        }
        this.evaluateKycReadiness(profile, this.currentUser);
        void this.loadTbkStatus();
      },
      error: (error) => {
        console.error('[DASH_INGRESOS] Error cargando perfil para TBK:', error);
        this.tbkError = 'No pudimos cargar tu perfil de proveedor. Intenta nuevamente más tarde.';
        this.tbkSectionLoading = false;
      }
    });
  }

  private async ensureCurrentUser(): Promise<AuthUser | null> {
    const cached = this.auth.getCurrentUser();
    if (cached) return cached;
    try {
      const resp = await firstValueFrom(this.auth.getCurrentUserInfo());
      const user = (resp as any).data?.user || (resp as any).user || resp.user;
      return user || null;
    } catch (error) {
      console.warn('[DASH_INGRESOS] No se pudo hidratar el usuario actual:', error);
      return null;
    }
  }

  private evaluateKycReadiness(profile: ProviderProfile | null, user: AuthUser | null) {
    const requirements: Array<{ value: any; label: string }> = [
      { value: profile?.full_name, label: 'Nombre o razón social' },
      { value: profile?.account_rut, label: 'RUT del titular' },
      { value: profile?.account_holder, label: 'Titular de la cuenta bancaria' },
      { value: profile?.bank_name, label: 'Banco' },
      { value: profile?.account_type, label: 'Tipo de cuenta bancaria' },
      { value: profile?.bank_account, label: 'Número de cuenta bancaria' },
      { value: user?.email, label: 'Correo electrónico de facturación' },
      { value: profile?.main_commune, label: 'Comuna principal' }
    ];

    if (profile && 'business_activity' in profile) {
      requirements.push({ value: (profile as any).business_activity, label: 'Giro comercial' });
    }
    if (profile && 'billing_phone' in profile) {
      requirements.push({ value: (profile as any).billing_phone, label: 'Teléfono de contacto' });
    }
    if (profile && 'billing_address' in profile) {
      requirements.push({ value: (profile as any).billing_address, label: 'Dirección comercial' });
    }

    const missing = requirements
      .filter(req => !this.hasValue(req.value))
      .map(req => req.label);

    this.tbkKycMissing = missing;
    this.tbkKycReady = missing.length === 0;
  }

  private hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private async loadTbkStatus(action: 'status' | 'refresh' = 'status', manageLoading = true): Promise<void> {
    if (!this.providerId) {
      console.warn('[DASH_INGRESOS] No hay providerId para consultar TBK');
      this.tbkSectionLoading = false;
      return;
    }
    if (manageLoading) {
      this.tbkCurrentAction = action;
      this.tbkActionLoading = true;
    }
    this.tbkError = null;

    try {
      const resp = await firstValueFrom(this.providerProfile.tbkGetSecondaryStatus(this.providerId));
      const tbk = resp?.tbk || {};
      this.tbkStatus = (tbk.status || 'none') as TbkStatus;
      this.tbkSecondaryCode = tbk.code || null;
      this.tbkRemote = tbk.remote || null;
      this.tbkLastUpdated = new Date();
    } catch (error: any) {
      console.error('[DASH_INGRESOS] Error consultando estado TBK:', error);
      const detail = error?.error?.error || error?.error?.details || error?.message || 'Error consultando estado TBK';
      this.tbkError = typeof detail === 'string' ? detail : 'Error consultando estado TBK';
    } finally {
      if (manageLoading) {
        this.tbkActionLoading = false;
        this.tbkCurrentAction = null;
      }
      this.tbkSectionLoading = false;
    }
  }

  async onCreateTbkSecondary() {
    if (!this.providerId || !this.tbkKycReady || this.tbkActionLoading) return;
    this.tbkCurrentAction = 'create';
    this.tbkActionLoading = true;
    this.tbkError = null;

    try {
      await firstValueFrom(this.providerProfile.tbkCreateSecondary(this.providerId));
      await this.loadTbkStatus('status', false);
    } catch (error: any) {
      console.error('[DASH_INGRESOS] Error creando comercio secundario TBK:', error);
      const detail = error?.error?.error || error?.error?.details || error?.message || 'Error creando comercio secundario';
      this.tbkError = typeof detail === 'string' ? detail : 'Error creando comercio secundario';
    } finally {
      this.tbkActionLoading = false;
      this.tbkCurrentAction = null;
    }
  }

  onRefreshTbkStatus() {
    if (this.tbkActionLoading) return;
    void this.loadTbkStatus('refresh');
  }

  async onRevokeTbkSecondary() {
    if (!this.providerId || !this.tbkSecondaryCode || this.tbkActionLoading) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('¿Seguro quieres solicitar la baja del comercio secundario en TBK?')
      : true;
    if (!confirmed) return;

    this.tbkCurrentAction = 'revoke';
    this.tbkActionLoading = true;
    this.tbkError = null;

    try {
      await firstValueFrom(this.providerProfile.tbkDeleteSecondary(this.providerId, this.tbkSecondaryCode));
      await this.loadTbkStatus('status', false);
    } catch (error: any) {
      console.error('[DASH_INGRESOS] Error solicitando baja TBK:', error);
      const detail = error?.error?.error || error?.error?.details || error?.message || 'Error solicitando baja en TBK';
      this.tbkError = typeof detail === 'string' ? detail : 'Error solicitando baja en TBK';
    } finally {
      this.tbkActionLoading = false;
      this.tbkCurrentAction = null;
    }
  }

  get tbkStatusLabel(): string {
    switch (this.tbkStatus) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'En revisión';
      case 'restricted':
        return 'Restringido';
      default:
        return 'No configurado';
    }
  }

  get showCreateButton(): boolean {
    return this.tbkStatus === 'none' || !this.tbkSecondaryCode;
  }

  get showRefreshButton(): boolean {
    return !!this.tbkSecondaryCode;
  }

  get showRevokeButton(): boolean {
    return !!this.tbkSecondaryCode && (this.tbkStatus === 'active' || this.tbkStatus === 'restricted');
  }

  get tbkRemoteStatusLabel(): string | null {
    if (!this.tbkRemote) return null;
    const remote = this.tbkRemote as any;
    return remote.status || remote.estado || remote.state || null;
  }
}
}