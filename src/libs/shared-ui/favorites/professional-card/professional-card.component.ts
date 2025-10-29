import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';

export interface Professional {
  id: string;
  name: string;
  role: string;
  description: string;
  rating: number;
  reviewCount: number;
  icon?: string;
  iconColor?: 'pink' | 'orange' | 'lime' | 'blue' | 'teal' | 'red';
  isFavorite?: boolean;
}

@Component({
  selector: 'ui-favorites-professional-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './professional-card.component.html',
  styleUrls: ['./professional-card.component.scss']
})
export class ProfessionalCardComponent {
  @Input() professional!: Professional;
  @Input() showFavoriteButton = true;
  @Input() showBookButton = true;

  @Output() favoriteToggle = new EventEmitter<Professional>();
  @Output() bookClick = new EventEmitter<Professional>();
  @Output() cardClick = new EventEmitter<Professional>();

  onFavoriteToggle(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit(this.professional);
  }

  onBookClick(event: Event): void {
    event.stopPropagation();
    this.bookClick.emit(this.professional);
  }

  onCardClick(): void {
    this.cardClick.emit(this.professional);
  }

  getProfessionalInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}











