import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'notification-toggle',
  standalone: true,
  template: `
    <label class="row">
      <input type="checkbox" [checked]="email" (change)="emailChange.emit($any($event.target).checked)" />
      <span>Email</span>
    </label>
    <label class="row">
      <input type="checkbox" [checked]="push" (change)="pushChange.emit($any($event.target).checked)" />
      <span>Push</span>
    </label>
  `,
  styles: [`.row{display:flex; align-items:center; gap:8px; padding:6px 0;}`]
})
export class NotificationToggleComponent {
  @Input() email = true;
  @Output() emailChange = new EventEmitter<boolean>();
  @Input() push = true;
  @Output() pushChange = new EventEmitter<boolean>();
}
