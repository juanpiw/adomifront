import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-date',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-date.component.html',
  styleUrls: ['./ui-date.component.scss']
})
export class UiDateComponent {
  @Input() label = '';
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
}
