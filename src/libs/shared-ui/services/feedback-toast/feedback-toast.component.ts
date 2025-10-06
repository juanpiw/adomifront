import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'ui-feedback-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './feedback-toast.component.html',
  styleUrls: ['./feedback-toast.component.scss']
})
export class FeedbackToastComponent {
  @Input() isVisible = false;
  @Input() type: ToastType = 'info';
  @Input() message = '';
  @Output() dismissed = new EventEmitter<void>();

  onDismiss() {
    this.dismissed.emit();
  }

  getIconName(): 'check-circle' | 'x-circle' | 'alert-triangle' | 'info' {
    switch (this.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'x-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
      default:
        return 'info';
    }
  }
}
