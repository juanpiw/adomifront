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

  @Output() professionalClick = new EventEmitter<Professional>();
  @Output() favoriteToggle = new EventEmitter<Professional>();
  @Output() bookClick = new EventEmitter<Professional>();

  defaultProfessionals: Professional[] = [
    {
      id: '1',
      name: 'Elena Torres',
      role: 'Estilista Profesional',
      description: 'Con más de 10 años de experiencia en color y cortes de vanguardia.',
      rating: 4.9,
      reviewCount: 85,
      iconColor: 'pink'
    },
    {
      id: '2',
      name: 'Mario Rojas',
      role: 'Chef a Domicilio',
      description: 'Especialista en cocina mediterránea para eventos privados y cenas.',
      rating: 5.0,
      reviewCount: 89,
      iconColor: 'orange'
    },
    {
      id: '3',
      name: 'Luis Gómez',
      role: 'Armador de Muebles',
      description: 'Montaje rápido y profesional de todo tipo de muebles. Experiencia garantizada.',
      rating: 4.8,
      reviewCount: 204,
      iconColor: 'lime'
    }
  ];

  get displayProfessionals(): Professional[] {
    return this.professionals.length > 0 ? this.professionals : this.defaultProfessionals;
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






