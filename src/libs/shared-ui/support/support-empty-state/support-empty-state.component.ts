import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ui-support-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './support-empty-state.component.html',
  styleUrls: ['./support-empty-state.component.scss']
})
export class SupportEmptyStateComponent {
  @Input() title = 'No tienes tickets creados aún';
  @Input() description = 'Crea un ticket para que el equipo de soporte pueda ayudarte.';
  @Input() actionLabel = 'Crear ticket';

  @Output() action = new EventEmitter<void>();
}



