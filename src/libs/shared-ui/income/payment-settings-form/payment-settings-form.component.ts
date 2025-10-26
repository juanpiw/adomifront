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

  ngOnInit() {
    this.providerService.getProfile().subscribe({
      next: (p) => { this.providerId = p?.provider_id || p?.id || null; },
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
      } as any;
      this.providerService.updateBasicInfo({} as any).subscribe({
        next: () => {},
        error: () => {},
      });
      // Usar el endpoint directo para campos bancarios (PUT /provider/profile)
      this.providerService['http'].put(
        `${this.providerService['apiUrl']}/provider/profile`,
        payload,
        { headers: (this.providerService as any).getHeaders() }
      ).subscribe({
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
}








