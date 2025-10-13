import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CardFormData {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardName: string;
}

@Component({
  selector: 'ui-add-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-card-modal.component.html',
  styleUrls: ['./add-card-modal.component.scss']
})
export class AddCardModalComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() cardAdded = new EventEmitter<CardFormData>();

  cardForm: CardFormData = {
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardName: ''
  };

  isSubmitting: boolean = false;
  feedbackMessage: string = '';
  feedbackType: 'success' | 'error' | '' = '';

  onClose() {
    this.close.emit();
    this.resetForm();
  }

  onCardNumberChange(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    this.cardForm.cardNumber = value;
  }

  onExpiryDateChange(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.cardForm.expiryDate = value;
  }

  onCvcChange(event: any) {
    this.cardForm.cvc = event.target.value.replace(/\D/g, '');
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.feedbackMessage = '';

    // Simular procesamiento
    setTimeout(() => {
      this.isSubmitting = false;
      this.cardAdded.emit(this.cardForm);
      this.showFeedback('✅ Tarjeta agregada exitosamente', 'success');
      
      setTimeout(() => {
        this.onClose();
      }, 1500);
    }, 2000);
  }

  private validateForm(): boolean {
    if (!this.cardForm.cardNumber || this.cardForm.cardNumber.replace(/\s/g, '').length < 16) {
      this.showFeedback('❌ Número de tarjeta inválido', 'error');
      return false;
    }

    if (!this.cardForm.expiryDate || this.cardForm.expiryDate.length < 5) {
      this.showFeedback('❌ Fecha de vencimiento inválida', 'error');
      return false;
    }

    if (!this.cardForm.cvc || this.cardForm.cvc.length < 3) {
      this.showFeedback('❌ CVC inválido', 'error');
      return false;
    }

    if (!this.cardForm.cardName.trim()) {
      this.showFeedback('❌ Nombre del titular requerido', 'error');
      return false;
    }

    return true;
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this.feedbackMessage = message;
    this.feedbackType = type;

    if (type === 'success') {
      setTimeout(() => {
        this.feedbackMessage = '';
        this.feedbackType = '';
      }, 3000);
    }
  }

  private resetForm() {
    this.cardForm = {
      cardNumber: '',
      expiryDate: '',
      cvc: '',
      cardName: ''
    };
    this.feedbackMessage = '';
    this.feedbackType = '';
    this.isSubmitting = false;
  }
}




