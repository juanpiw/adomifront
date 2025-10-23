import { Component, Input, Output, EventEmitter } from '@angular/core';
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
export class PaymentSettingsFormComponent {
  @Input() paymentSettings: PaymentSettings = {
    accountType: 'corriente',
    bankName: '',
    accountNumber: '',
    rutHolder: ''
  };
  
  @Output() settingsSaved = new EventEmitter<PaymentSettings>();
  @Output() settingsChanged = new EventEmitter<PaymentSettings>();

  isSaving = false;
  showSuccessMessage = false;
  errorMessage: string | null = null;

  constructor(private providerService: ProviderProfileService) {}

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
        account_holder: this.paymentSettings.rutHolder,
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
}








