import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  IncomeGoal,
  TabConfig,
  WalletSummary,
  WalletMovement
} from '../../../../libs/shared-ui/income';
import { 
  TimeFilterComponent,
  TimeFilterChange
} from '../../../../libs/shared-ui/time-filter/time-filter.component';
import { FinancesService } from '../../../services/finances.service';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { ProviderProfileService, ProviderProfile } from '../../../services/provider-profile.service';
import { take } from 'rxjs/operators';
import { firstValueFrom, Subscription, timer } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderIncomeGoalDto } from '../../../services/finances.service';
import { TbkOnboardingService } from '../../../services/tbk-onboarding.service';

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
    ReactiveFormsModule
  ],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss']
})
export class DashIngresosComponent implements OnInit, OnDestroy {
  constructor(private route: ActivatedRoute) {}
  private finances = inject(FinancesService);
  private auth = inject(AuthService);
  private providerProfile = inject(ProviderProfileService);
  private fb = inject(FormBuilder);
  private tbkOnboarding = inject(TbkOnboardingService);
  tabsConfig: TabConfig[] = [
    { id: 'resumen', label: 'Resumen de Ingresos', isActive: true },
    { id: 'wallet', label: 'Billetera Adomi', isActive: false },
    { id: 'pagos', label: 'Configuración de Pagos', isActive: false },
    { id: 'metas', label: 'Metas de Ingreso', isActive: false }
  ];
  activeTab = 'resumen';
  selectedTimeFilter = 'month';
  currentDateRange: { startDate: Date; endDate: Date } = {
    startDate: new Date(),
    endDate: new Date()
  };
  private providerId: number | null = null;
  private currentUser: AuthUser | null = null;
  private currentProfile: ProviderProfile | null = null;
  private toastSubscription?: Subscription;
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
  tbkModalOpen = false;
  tbkPendingShopName: string | null = null;
  tbkToastMessage: string | null = null;
  tbkToastVisible = false;
  tbkSecondaryShops: Array<{ name: string; code: string; status: TbkStatus; remoteStatus?: string | null }> = [];
  tbkForm = this.fb.group({
    commerceName: ['', [Validators.required, Validators.minLength(3)]],
    commerceEmail: ['', [Validators.required, Validators.email]]
  });
  walletSummary: WalletSummary = {
    availableBalance: 0,
    pendingBalance: 0,
    holdBalance: 0,
    totalWithdrawn: 0,
    creditsEarned: 0,
    lastUpdated: null,
    nextReleaseAmount: 0,
    nextReleaseDate: null
  };
  walletMovements: WalletMovement[] = [];
  walletFilter: 'all' | 'credits' | 'debits' | 'holds' = 'all';
  walletLoading = false;
  walletLoaded = false;
  walletError: string | null = null;
  private readonly clpFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  
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
  currentGoal: IncomeGoal | null = null;
  currentIncome = 0;
  incomeGoalLoading = false;
  goalSaveError: string | null = null;
  savingIncomeGoal = false;

  ngOnInit() {
    this.setActiveTab(this.activeTab);
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
    this.setActiveTab(tabId);
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
    this.refreshProfileData();
  }

  onPaymentSettingsChanged(settings: PaymentSettings) {
    this.paymentSettings = settings;
  }

  onGoalSet(goal: IncomeGoal) {
    if (!this.providerId) return;
    this.savingIncomeGoal = true;
    this.goalSaveError = null;

    this.finances.setIncomeGoal(this.providerId, {
      amount: Number(goal.amount),
      period: goal.period || 'mensual'
    }).subscribe({
      next: (resp) => {
        if (resp.goal) {
          this.applyIncomeGoal(resp.goal);
          this.showToast('Meta de ingresos actualizada.');
        }
      },
      error: (err) => {
        const message = err?.error?.error || err?.message || 'No se pudo guardar la meta de ingresos';
        this.goalSaveError = message;
        this.showToast(message);
        this.savingIncomeGoal = false;
      },
      complete: () => {
        this.savingIncomeGoal = false;
      }
    });
  }

  onGoToSummary() {
    this.setActiveTab('resumen');
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

  ngOnDestroy(): void {
    this.toastSubscription?.unsubscribe();
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
        this.loadIncomeGoal();
        void this.loadTbkStatus();
        
        // Cargar datos bancarios en el formulario
        this.paymentSettings = {
          accountType: this.normalizeAccountType(profile.account_type),
          bankName: profile.bank_name || '',
          accountNumber: profile.bank_account || '',
          holderName: profile.account_holder || '',
          rutHolder: profile.account_rut || ''
        };
      },
      error: (error) => {
        console.error('[DASH_INGRESOS] Error cargando perfil para TBK:', error);
        this.tbkError = 'No pudimos cargar tu perfil de proveedor. Intenta nuevamente más tarde.';
        this.tbkSectionLoading = false;
      }
    });
  }

  private loadIncomeGoal() {
    if (!this.providerId) return;
    this.incomeGoalLoading = true;
    this.goalSaveError = null;

    this.finances.getIncomeGoal(this.providerId).subscribe({
      next: (resp) => {
        if (resp.goal) {
          this.applyIncomeGoal(resp.goal);
        } else {
          this.currentGoal = null;
          this.currentIncome = 0;
        }
      },
      error: (err) => {
        const message = err?.error?.error || err?.message || 'No se pudo obtener la meta de ingresos';
        this.goalSaveError = message;
        this.incomeGoalLoading = false;
      },
      complete: () => {
        this.incomeGoalLoading = false;
      }
    });
  }

  private applyIncomeGoal(goal: ProviderIncomeGoalDto) {
    this.currentIncome = Number(goal.currentIncome || 0);
    this.currentGoal = {
      id: goal.id,
      amount: Number(goal.amount || 0),
      period: goal.period,
      setDate: goal.setDate,
      currentProgress: Number(goal.progress || 0),
      isCompleted: Number(goal.progress || 0) >= 100
    };
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
      this.tbkSecondaryShops = this.buildSecondaryShops(tbk);
      this.tbkOnboarding.updateStatus(this.tbkStatus, this.tbkSecondaryCode);
    } catch (error: any) {
      console.error('[DASH_INGRESOS] Error consultando estado TBK:', error);
      const detail = error?.error?.error || error?.error?.details || error?.message || 'Error consultando estado TBK';
      this.tbkError = typeof detail === 'string' ? detail : 'Error consultando estado TBK';
      if (error?.status === 409) {
        this.showToast('Ya existe un comercio secundario registrado para este proveedor.');
      }
      this.tbkOnboarding.updateStatus('none', null);
    } finally {
      if (manageLoading) {
        this.tbkActionLoading = false;
        this.tbkCurrentAction = null;
      }
      this.tbkSectionLoading = false;
    }
  }

  async onCreateTbkSecondary() {
    if (!this.providerId || this.tbkActionLoading) return;
    this.tbkCurrentAction = 'create';
    this.tbkActionLoading = true;
    this.tbkError = null;

    try {
      await firstValueFrom(this.providerProfile.tbkCreateSecondary(this.providerId));
      await this.loadTbkStatus('status', false);
      this.showToast('Solicitud enviada a Transbank.');
    } catch (error: any) {
      console.error('[DASH_INGRESOS] Error creando comercio secundario TBK:', error);
      const detail = error?.error?.error || error?.error?.details || error?.message || 'Error creando comercio secundario';
      if (error?.status === 409) {
        this.showToast('Ya cuentas con un comercio secundario activo.');
        await this.loadTbkStatus('status', false);
      } else {
        this.tbkError = typeof detail === 'string' ? detail : 'Error creando comercio secundario';
      }
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

  get tbkRemoteStatusLabel(): string | null {
    if (!this.tbkRemote) return null;
    const remote = this.tbkRemote as any;
    return remote.status || remote.estado || remote.state || remote?.comercio?.estado || null;
  }

  get tbkCanCreate(): boolean {
    return !this.tbkSecondaryCode || this.tbkStatus === 'none';
  }

  get filteredWalletMovements(): WalletMovement[] {
    if (this.walletFilter === 'all') return this.walletMovements;
    if (this.walletFilter === 'credits') {
      return this.walletMovements.filter(movement => movement.type === 'credit');
    }
    if (this.walletFilter === 'debits') {
      return this.walletMovements.filter(movement => movement.type === 'debit');
    }
    return this.walletMovements.filter(movement => movement.type === 'hold' || movement.type === 'release');
  }

  goToPaymentsTab() {
    this.setActiveTab('pagos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openTbkModal() {
    if (!this.tbkCanCreate) {
      this.showToast('Ya cuentas con un comercio secundario activo.');
      return;
    }
    const presetName = this.currentProfile?.full_name || this.currentUser?.name || '';
    const presetEmail = this.currentUser?.email || '';
    this.tbkForm.reset({
      commerceName: presetName,
      commerceEmail: presetEmail
    });
    this.tbkModalOpen = true;
  }

  closeTbkModal() {
    this.tbkModalOpen = false;
    this.tbkForm.reset();
  }

  submitTbkForm() {
    if (this.tbkForm.invalid) {
      this.tbkForm.markAllAsTouched();
      return;
    }
    this.tbkPendingShopName = this.tbkForm.value.commerceName || null;
    this.onCreateTbkSecondary().finally(() => this.closeTbkModal());
  }

  showToast(message: string) {
    this.tbkToastMessage = message;
    this.tbkToastVisible = true;
    this.toastSubscription?.unsubscribe();
    this.toastSubscription = timer(3000).subscribe(() => {
      this.tbkToastVisible = false;
    });
  }

  onCancelTbkRequest(shop: { code: string }) {
    this.showToast(`Contacta a soporte para gestionar la baja de ${shop.code}.`);
  }

  chipClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'active':
      case 'autorizado':
        return 'chip--success';
      case 'restricted':
      case 'rechazado':
        return 'chip--danger';
      case 'pending':
      case 'pendiente de inscripción':
        return 'chip--warning';
      default:
        return 'chip--neutral';
    }
  }

  private buildSecondaryShops(tbk: any): Array<{ name: string; code: string; status: TbkStatus; remoteStatus?: string | null }> {
    const shops: Array<{ name: string; code: string; status: TbkStatus; remoteStatus?: string | null }> = [];
    const code = tbk?.code || this.tbkSecondaryCode;
    if (!code) return shops;
    const remote = tbk?.remote || this.tbkRemote || {};
    const name = remote?.razonSocial || remote?.nombreFantasia || this.currentProfile?.full_name || this.currentUser?.name || 'Comercio registrado';
    shops.push({
      name,
      code,
      status: (tbk?.status || 'active') as TbkStatus,
      remoteStatus: remote?.estado || remote?.status || null
    });
    return shops;
  }

  private refreshProfileData() {
    this.providerProfile.getProfile().pipe(take(1)).subscribe(profile => {
      this.currentProfile = profile;
      this.evaluateKycReadiness(profile, this.currentUser);
      
      this.paymentSettings = {
        accountType: this.normalizeAccountType(profile.account_type),
        bankName: profile.bank_name || '',
        accountNumber: profile.bank_account || '',
        holderName: profile.account_holder || '',
        rutHolder: profile.account_rut || ''
      };
    });
  }

  private normalizeAccountType(value: any): 'corriente' | 'vista' | 'ahorro' {
    const allowed: Array<'corriente' | 'vista' | 'ahorro'> = ['corriente', 'vista', 'ahorro'];
    if (typeof value === 'string') {
      const lowered = value.toLowerCase() as 'corriente' | 'vista' | 'ahorro';
      if (allowed.includes(lowered)) {
        return lowered;
      }
    }
    return 'corriente';
  }

  private setActiveTab(tabId: string) {
    this.activeTab = tabId;
    this.tabsConfig = this.tabsConfig.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    }));

    if (tabId === 'wallet' && !this.walletLoaded && !this.walletLoading) {
      this.loadWalletData();
    }
  }

  private loadWalletData() {
    this.walletLoading = true;
    this.walletError = null;
    try {
      const now = new Date();
      this.walletSummary = {
        availableBalance: 785710,
        pendingBalance: 120000,
        holdBalance: 85000,
        totalWithdrawn: 1650000,
        creditsEarned: 6,
        lastUpdated: now,
        nextReleaseAmount: 180000,
        nextReleaseDate: '2025-11-18'
      };
      this.walletMovements = [
        {
          id: 101,
          date: '2025-11-11',
          type: 'credit',
          title: 'Depósito Cita Confirmada',
          description: 'Corte colegial – Impact Render',
          amount: 142860,
          status: 'completado',
          reference: 'PAY-2025-11-11-01',
          relatedAppointmentId: 421
        },
        {
          id: 102,
          date: '2025-11-09',
          type: 'hold',
          title: 'En retención por verificación',
          description: 'Coloración full glam – Carolina Díaz',
          amount: 85000,
          status: 'retenido',
          reference: 'HOLD-2025-11-09-02',
          relatedAppointmentId: 419
        },
        {
          id: 103,
          date: '2025-11-08',
          type: 'credit',
          title: 'Penalización por No-Show',
          description: 'Cobro 50% por inasistencia del cliente',
          amount: 60000,
          status: 'completado',
          reference: 'NSC-2025-11-08-07',
          relatedAppointmentId: 415
        },
        {
          id: 104,
          date: '2025-11-05',
          type: 'debit',
          title: 'Retiro a cuenta bancaria',
          description: 'Transferido a Banco de Chile',
          amount: 350000,
          status: 'completado',
          reference: 'WD-2025-11-05-01'
        },
        {
          id: 105,
          date: '2025-11-02',
          type: 'credit',
          title: 'Depósito semanal',
          description: 'Servicios 28 Oct – 1 Nov',
          amount: 298570,
          status: 'completado',
          reference: 'PAY-2025-11-02-03'
        },
        {
          id: 106,
          date: '2025-10-30',
          type: 'debit',
          title: 'Pago comisión cash',
          description: 'Comisión cobrada por citas en efectivo',
          amount: 120000,
          status: 'completado',
          reference: 'COM-2025-10-30-05'
        }
      ];
      this.walletLoaded = true;
    } catch (error) {
      console.error('[DASH_INGRESOS] Error cargando datos de wallet:', error);
      this.walletError = 'No pudimos cargar tu billetera. Intenta nuevamente en unos minutos.';
    } finally {
      this.walletLoading = false;
    }
  }

  onRequestWithdrawal() {
    if (this.walletSummary.availableBalance <= 0) {
      this.showToast('Necesitas saldo disponible para solicitar un retiro.');
      return;
    }
    this.showToast('Solicitud de retiro enviada. Te notificaremos cuando esté procesada.');
  }

  onViewWithdrawalHistory() {
    this.showToast('Muy pronto podrás revisar tu historial de retiros desde esta sección.');
  }

  setWalletFilter(filter: 'all' | 'credits' | 'debits' | 'holds') {
    this.walletFilter = filter;
  }

  walletTypeLabel(type: WalletMovement['type']): string {
    switch (type) {
      case 'credit':
        return 'Ingreso';
      case 'debit':
        return 'Retiro';
      case 'hold':
        return 'Retención';
      case 'release':
        return 'Liberación';
      default:
        return 'Movimiento';
    }
  }

  walletTypeClass(type: WalletMovement['type']): string {
    switch (type) {
      case 'credit':
        return 'wallet-tag--credit';
      case 'debit':
        return 'wallet-tag--debit';
      case 'hold':
        return 'wallet-tag--hold';
      case 'release':
        return 'wallet-tag--release';
      default:
        return 'wallet-tag--neutral';
    }
  }

  walletStatusClass(status: WalletMovement['status']): string {
    switch (status) {
      case 'completado':
        return 'chip--success';
      case 'pendiente':
        return 'chip--warning';
      case 'retenido':
        return 'chip--danger';
      default:
        return 'chip--neutral';
    }
  }

  walletStatusLabel(status: WalletMovement['status']): string {
    switch (status) {
      case 'completado':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'retenido':
        return 'Retenido';
      default:
        return status;
    }
  }

  formatCurrency(value: number): string {
    return this.clpFormatter.format(value || 0);
  }
}