import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiDropdownComponent } from '../ui-dropdown/ui-dropdown.component';

@Component({
  selector: 'language-select',
  standalone: true,
  imports: [UiDropdownComponent],
  template: `<ui-dropdown [options]="langs" [value]="value" (valueChange)="valueChange.emit($event)"></ui-dropdown>`
})
export class LanguageSelectComponent {
  @Input() value: string | null = 'es';
  @Output() valueChange = new EventEmitter<string>();
  langs = [
    { label: 'EspaÃ±ol', value: 'es' },
    { label: 'English', value: 'en' }
  ];
}
