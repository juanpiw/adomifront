import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { PaymentSettings } from '../interfaces';
import { ProviderProfileService } from '../../../../app/services/provider-profile.service';

@Component({
  selector: 'ui-payment-settings-form',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './payment-settings-form.component.html',
  styleUrls: ['./payment-settings-form.component.scss']
})
export class PaymentSettingsFormComponent implements OnInit {
  @Input() paymentSettings: PaymentSettings = {
    accountType: 'corriente',
    bankName: '',
    accountNumber: '',
    holderName: '',
    rutHolder: ''
  };
  
  @Output() settingsSaved = new EventEmitter<PaymentSettings>();
  @Output() settingsChanged = new EventEmitter<PaymentSettings>();

  isSaving = false;
  showSuccessMessage = false;
  errorMessage: string | null = null;

  constructor(private providerService: ProviderProfileService) {}

  // Stripe Connect / Billing state
  providerId: number | null = null;
  connecting = false;
  onboardingUrl: string | null = null;
  dashboardUrl: string | null = null;
  debts: Array<any> = [];
  loadingDebts = false;
  setupIntentClientSecret: string | null = null;

  // TBK Onboarding state
  tbkLoading = false;
  tbkStatus: string | null = null;
  tbkCode: string | null = null;
  tbkError: string | null = null;

  ngOnInit() {
    this.providerService.getProfile().subscribe({
      next: (p) => {
        this.providerId = p?.provider_id || p?.id || null;
        if (this.providerId) {
          this.fetchTbkStatus();
        }
      },
      error: () => {}
    });
  }

  onSettingsChange() {
    this.settingsChanged.emit(this.paymentSettings);
  }

  onSave() {
    if (this.validateForm()) {
      this.isSaving = true;
      this.errorMessage = null;
      const payload = {
        bank_name: this.paymentSettings.bankName,
        account_type: this.paymentSettings.accountType,
        bank_account: this.paymentSettings.accountNumber,
        account_holder: this.paymentSettings.holderName,
        account_rut: this.paymentSettings.rutHolder
      };

      this.providerService.updateBasicInfo(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showSuccessMessage = true;
          this.settingsSaved.emit(this.paymentSettings);
          setTimeout(() => { this.showSuccessMessage = false; }, 3000);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = 'No se pudo guardar. Reintenta.';
        }
      });
    }
  }

  private validateForm(): boolean {
    return !!(
      this.paymentSettings.accountType &&
      this.paymentSettings.bankName &&
      this.paymentSettings.accountNumber &&
      this.paymentSettings.rutHolder
    );
  }

  // ========= Stripe Connect / Billing =========
  onConnectStripe() {
    if (!this.providerId || this.connecting) return;
    this.connecting = true;
    this.providerService.createConnectAccount(this.providerId).subscribe({
      next: (res) => {
        this.onboardingUrl = res?.onboarding_url || null;
        this.connecting = false;
        if (this.onboardingUrl) {
          window.location.href = this.onboardingUrl;
        }
      },
      error: () => { this.connecting = false; }
    });
  }

  onOpenDashboard() {
    if (!this.providerId) return;
    this.providerService.getStripeDashboardLink(this.providerId).subscribe({
      next: (res) => { if (res?.url) window.open(res.url, '_blank'); },
      error: () => {}
    });
  }

  onSetupFallbackCard() {
    if (!this.providerId) return;
    this.providerService.createBillingSetupIntent(this.providerId).subscribe({
      next: (res) => {
        this.setupIntentClientSecret = res?.client_secret || null;
        // Nota: Para completar el guardado de tarjeta, integrar Stripe Elements con este client_secret
        console.log('[Billing] SetupIntent client_secret:', this.setupIntentClientSecret);
        alert('SetupIntent creado. Implementar Stripe Elements para guardar la tarjeta.');
      },
      error: () => {}
    });
  }

  onLoadDebts() {
    if (!this.providerId || this.loadingDebts) return;
    this.loadingDebts = true;
    this.providerService.getProviderDebts(this.providerId).subscribe({
      next: (res) => { this.debts = res?.debts || []; this.loadingDebts = false; },
      error: () => { this.loadingDebts = false; }
    });
  }

  // ========= TBK Onboarding =========
  fetchTbkStatus() {
    if (!this.providerId) return;
    this.tbkLoading = true;
    this.tbkError = null;
    this.providerService.tbkGetSecondaryStatus(this.providerId).subscribe({
      next: (res) => {
        this.tbkStatus = res?.tbk?.status || null;
        this.tbkCode = res?.tbk?.code || null;
        this.tbkLoading = false;
      },
      error: (err) => {
        this.tbkLoading = false;
        this.tbkError = 'No se pudo cargar el estado TBK';
      }
    });
  }

  onTbkCreate() {
    if (!this.providerId || this.tbkLoading) return;
    this.tbkLoading = true;
    this.tbkError = null;
    this.providerService.tbkCreateSecondary(this.providerId).subscribe({
      next: (res) => {
        this.tbkCode = res?.codigo || null;
        this.tbkStatus = this.tbkCode ? 'active' : (this.tbkStatus || 'pending');
        this.tbkLoading = false;
        alert('Comercio secundario creado en TBK');
      },
      error: (err) => {
        this.tbkLoading = false;
        this.tbkError = 'Error creando comercio secundario';
      }
    });
  }

  onTbkStatus() { this.fetchTbkStatus(); }

  onTbkDelete() {
    if (!this.providerId || !this.tbkCode || this.tbkLoading) return;
    const confirmDel = confirm('¿Dar de baja el comercio secundario en TBK?');
    if (!confirmDel) return;
    this.tbkLoading = true;
    this.tbkError = null;
    this.providerService.tbkDeleteSecondary(this.providerId, this.tbkCode).subscribe({
      next: () => {
        this.tbkLoading = false;
        this.tbkStatus = 'restricted';
        alert('Comercio secundario dado de baja');
      },
      error: () => {
        this.tbkLoading = false;
        this.tbkError = 'Error dando de baja comercio secundario';
      }
    });
  }
}








