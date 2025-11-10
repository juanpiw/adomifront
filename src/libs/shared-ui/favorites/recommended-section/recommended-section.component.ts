import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfessionalCardComponent, Professional } from '../professional-card/professional-card.component';

@Component({
  selector: 'ui-favorites-recommended-section',
  standalone: true,
  imports: [CommonModule, ProfessionalCardComponent],
  templateUrl: './recommended-section.component.html',
  styleUrls: ['./recommended-section.component.scss']
})
export class RecommendedSectionComponent {
  @Input() title = 'Servicios Recomendados Cerca de Ti';
  @Input() professionals: Professional[] = [];
  @Input() emptyTitle = 'Sin recomendaciones por ahora';
  @Input() emptyDescription = 'En cuanto tengamos datos de tu zona o favoritos similares, los verás aquí.';

  @Output() professionalClick = new EventEmitter<Professional>();
  @Output() favoriteToggle = new EventEmitter<Professional>();
  @Output() bookClick = new EventEmitter<Professional>();

  get displayProfessionals(): Professional[] {
    return this.professionals;
  }

  get hasProfessionals(): boolean {
    return this.professionals.length > 0;
  }

  onProfessionalClick(professional: Professional): void {
    this.professionalClick.emit(professional);
  }

  onFavoriteToggle(professional: Professional): void {
    this.favoriteToggle.emit(professional);
  }

  onBookClick(professional: Professional): void {
    this.bookClick.emit(professional);
  }
}













