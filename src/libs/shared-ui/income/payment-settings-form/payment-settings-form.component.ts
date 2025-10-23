import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { PaymentSettings } from '../interfaces';

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

  onSettingsChange() {
    this.settingsChanged.emit(this.paymentSettings);
  }

  onSave() {
    if (this.validateForm()) {
      this.isSaving = true;
      
      // Simular guardado
      setTimeout(() => {
        this.isSaving = false;
        this.showSuccessMessage = true;
        this.settingsSaved.emit(this.paymentSettings);
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 3000);
      }, 1000);
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








