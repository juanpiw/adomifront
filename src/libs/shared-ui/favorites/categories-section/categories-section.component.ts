import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: 'pink' | 'lime' | 'orange' | 'blue' | 'purple' | 'teal';
}

@Component({
  selector: 'ui-favorites-categories-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories-section.component.html',
  styleUrls: ['./categories-section.component.scss']
})
export class CategoriesSectionComponent {
  @Input() title = 'Explorar Categorías Populares';
  @Input() categories: Category[] = [];

  @Output() categoryClick = new EventEmitter<Category>();

  defaultCategories: Category[] = [
    {
      id: 'belleza',
      name: 'Belleza & Estilo',
      icon: '💅',
      count: 120,
      color: 'pink'
    },
    {
      id: 'hogar',
      name: 'Reparación Hogar',
      icon: '🏠',
      count: 350,
      color: 'lime'
    },
    {
      id: 'eventos',
      name: 'Eventos & Catering',
      icon: '🍽️',
      count: 50,
      color: 'orange'
    },
    {
      id: 'tecnologia',
      name: 'Soporte Técnico',
      icon: '⚙️',
      count: 90,
      color: 'blue'
    },
    {
      id: 'bienestar',
      name: 'Salud & Fitness',
      icon: '🧘',
      count: 75,
      color: 'purple'
    },
    {
      id: 'mascotas',
      name: 'Cuidado Animal',
      icon: '🐶',
      count: 40,
      color: 'teal'
    }
  ];

  get displayCategories(): Category[] {
    return this.categories.length > 0 ? this.categories : this.defaultCategories;
  }

  onCategoryClick(category: Category): void {
    this.categoryClick.emit(category);
  }
}
















