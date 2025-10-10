import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionFormData } from '../index';

@Component({
  selector: 'ui-collapsible-promo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collapsible-promo-form.component.html',
  styleUrls: ['./collapsible-promo-form.component.scss']
})
export class CollapsiblePromoFormComponent {
  @Input() isExpanded = false;
  @Output() formSubmitted = new EventEmitter<PromotionFormData>();
  @Output() formToggled = new EventEmitter<boolean>();

  formData: PromotionFormData = {
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: ''
  };

  toggle() {
    this.isExpanded = !this.isExpanded;
    this.formToggled.emit(this.isExpanded);
  }

  onSubmit() {
    if (!this.formData.name || !this.formData.description || !this.formData.discountType || !this.formData.discountValue || !this.formData.startDate) {
      return;
    }
    this.formSubmitted.emit({ ...this.formData });
    this.reset();
    this.isExpanded = false;
    this.formToggled.emit(this.isExpanded);
  }

  private reset() {
    this.formData = {
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: ''
    };
  }
}





