import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { Service, ServiceCategory, ServiceFormData } from '../index';

@Component({
  selector: 'ui-service-form',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent implements OnInit {
  @Input() service: Service | null = null;
  @Input() categories: ServiceCategory[] = [];
  @Output() serviceSaved = new EventEmitter<ServiceFormData>();
  @Output() formCancelled = new EventEmitter<void>();

  // Form data
  formData: ServiceFormData = {
    category: '',
    type: '',
    customType: '',
    name: '',
    description: '',
    price: 0,
    duration: 60
  };

  // Available services for selected category
  availableServices: string[] = [];
  showCustomService = false;
  isEditMode = false;
  priceText: string = '';

  ngOnInit() {
    if (this.service) {
      this.isEditMode = true;
      this.formData = {
        category: this.service.category,
        type: this.service.type,
        customType: this.service.customType || '',
        name: this.service.name,
        description: this.service.description,
        price: this.service.price,
        duration: this.service.duration
      };
      this.onCategoryChange();
    }
    this.priceText = this.formatCLP(this.formData.price);
  }

  onCategoryChange() {
    const selectedCategory = this.categories.find(cat => cat.name === this.formData.category);
    this.availableServices = selectedCategory ? selectedCategory.services : [];
    this.formData.type = '';
    this.showCustomService = false;
  }

  onTypeChange() {
    this.showCustomService = this.formData.type === 'Otro';
    if (!this.showCustomService) {
      this.formData.customType = '';
    }
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.serviceSaved.emit(this.formData);
    }
  }

  onCancel() {
    this.formCancelled.emit();
  }

  private isFormValid(): boolean {
    return !!(
      this.formData.category &&
      this.formData.type &&
      this.formData.name &&
      this.formData.description &&
      this.formData.price > 0 &&
      this.formData.duration > 0 &&
      (!this.showCustomService || this.formData.customType)
    );
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D+/g, '');
    const numericValue = digitsOnly ? Number(digitsOnly) : 0;
    this.formData.price = numericValue;
    this.priceText = this.formatCLP(numericValue);
  }

  private formatCLP(value: number | string): string {
    const num = typeof value === 'string' ? Number(value) || 0 : value || 0;
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
}









