import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ui-empty-services-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './empty-services-state.component.html',
  styleUrls: ['./empty-services-state.component.scss']
})
export class EmptyServicesStateComponent {
  @Output() addService = new EventEmitter<void>();

  onAddService() {
    this.addService.emit();
  }
}
















