import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { Service } from '../index';

@Component({
  selector: 'ui-service-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './service-card.component.html',
  styleUrls: ['./service-card.component.scss']
})
export class ServiceCardComponent {
  @Input() service!: Service;
  @Output() editClicked = new EventEmitter<Service>();
  @Output() deleteClicked = new EventEmitter<Service>();

  onEdit() {
    this.editClicked.emit(this.service);
  }

  onDelete() {
    this.deleteClicked.emit(this.service);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}









