import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface Service {
  id: string;
  name: string;
  duration: number; // en minutos
  price: number;
}

@Component({
  selector: 'app-mis-servicios',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './mis-servicios.component.html',
  styleUrls: ['./mis-servicios.component.scss']
})
export class MisServiciosComponent {
  @Input() services: Service[] = [
    { id: '1', name: 'Corte de Pelo', duration: 60, price: 25000 },
    { id: '2', name: 'Manicura', duration: 45, price: 15000 },
    { id: '3', name: 'Maquillaje Profesional', duration: 75, price: 30000 }
  ];

  @Output() editService = new EventEmitter<Service>();
  @Output() deleteService = new EventEmitter<string>();
  @Output() addService = new EventEmitter<void>();

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  }

  onEdit(service: Service) {
    this.editService.emit(service);
  }

  onDelete(serviceId: string) {
    this.deleteService.emit(serviceId);
  }

  onAdd() {
    this.addService.emit();
  }
}
