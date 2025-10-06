import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceCardComponent } from '../service-card/service-card.component';
import { EmptyServicesStateComponent } from '../empty-services-state/empty-services-state.component';
import { Service } from '../index';

@Component({
  selector: 'ui-services-list',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent, EmptyServicesStateComponent],
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.scss']
})
export class ServicesListComponent {
  @Input() services: Service[] = [];
  @Input() loading = false;
  @Output() serviceEdited = new EventEmitter<Service>();
  @Output() serviceDeleted = new EventEmitter<Service>();
  @Output() addService = new EventEmitter<void>();

  onServiceEdited(service: Service) {
    this.serviceEdited.emit(service);
  }

  onServiceDeleted(service: Service) {
    this.serviceDeleted.emit(service);
  }

  onAddService() {
    this.addService.emit();
  }

  trackByServiceId(index: number, service: Service): number {
    return service.id;
  }
}
