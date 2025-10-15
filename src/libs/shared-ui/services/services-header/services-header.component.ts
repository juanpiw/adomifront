import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ui-services-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './services-header.component.html',
  styleUrls: ['./services-header.component.scss']
})
export class ServicesHeaderComponent {
  @Output() addService = new EventEmitter<void>();

  onAddService() {
    this.addService.emit();
  }
}






