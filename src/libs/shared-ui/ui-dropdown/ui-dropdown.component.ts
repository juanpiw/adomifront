import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-dropdown.component.html',
  styleUrls: ['./ui-dropdown.component.scss']
})
export class UiDropdownComponent {
  @Input() options: Array<{ label: string; value: string } > = [];
  @Input() placeholder = 'Seleccionar...';
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
  open = false;
  select(v: string) { this.value = v; this.valueChange.emit(v); this.open = false; }
}
