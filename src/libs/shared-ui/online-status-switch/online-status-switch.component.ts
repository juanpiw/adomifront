import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-online-status-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './online-status-switch.component.html',
  styleUrls: ['./online-status-switch.component.scss']
})
export class OnlineStatusSwitchComponent {
  @Input() isOnline: boolean = true;
  @Input() disabled: boolean = false;
  @Output() statusChange = new EventEmitter<boolean>();

  onToggle() {
    if (!this.disabled) {
      this.isOnline = !this.isOnline;
      this.statusChange.emit(this.isOnline);
    }
  }
}








