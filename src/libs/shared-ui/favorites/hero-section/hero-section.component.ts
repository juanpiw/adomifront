import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ui-favorites-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent {
  @Input() title = 'Encuentra tu Profesional Perfecto.';
  @Input() subtitle = 'Agenda con expertos verificados para hogar, belleza, tecnología y más.';
  @Input() searchPlaceholder = 'Ej. Plomero de urgencia, Corte de cabello...';
  @Input() searchValue = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  onSearchSubmit(): void {
    this.searchSubmit.emit(this.searchValue);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchSubmit();
    }
  }
}






