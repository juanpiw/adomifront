import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent, IconName } from '../../icon/icon.component';

@Component({
  selector: 'ui-support-shell',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './support-shell.component.html',
  styleUrls: ['./support-shell.component.scss']
})
export class SupportShellComponent {
  @Input() title = 'Centro de soporte';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Input() actionIcon: IconName = 'plus';
  @Input() actionDisabled = false;

  @Output() action = new EventEmitter<void>();

  onAction(): void {
    if (!this.actionDisabled) {
      this.action.emit();
    }
  }
}

