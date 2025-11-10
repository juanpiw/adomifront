import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';

export interface FavoriteProfessional {
  id: string;
  name: string;
  role: string;
  rating: number;
  initials: string;
}

@Component({
  selector: 'ui-favorites-favorites-section',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './favorites-section.component.html',
  styleUrls: ['./favorites-section.component.scss']
})
export class FavoritesSectionComponent {
  @Input() title = 'Mis Profesionales de Confianza (Favoritos)';
  @Input() description = 'Agenda más rápido con los expertos que has guardado en tu lista.';
  @Input() favorites: FavoriteProfessional[] = [];
  @Input() emptyTitle = 'Guarda tu primer profesional favorito';
  @Input() emptyDescription = 'Busca en las categorías de abajo y presiona el corazón para agregarlo aquí.';
  @Input() showViewAllLink = true;
  @Input() viewAllLinkText = 'Ver todos';

  @Output() viewAllClick = new EventEmitter<void>();
  @Output() rebookClick = new EventEmitter<FavoriteProfessional>();
  @Output() messageClick = new EventEmitter<FavoriteProfessional>();
  @Output() favoriteClick = new EventEmitter<FavoriteProfessional>();
  @Output() removeClick = new EventEmitter<FavoriteProfessional>();

  get displayFavorites(): FavoriteProfessional[] {
    return this.favorites;
  }

  get hasFavorites(): boolean {
    return this.favorites.length > 0;
  }

  onViewAllClick(): void {
    this.viewAllClick.emit();
  }

  onRebookClick(favorite: FavoriteProfessional): void {
    this.rebookClick.emit(favorite);
  }

  onMessageClick(favorite: FavoriteProfessional): void {
    this.messageClick.emit(favorite);
  }

  onFavoriteClick(favorite: FavoriteProfessional): void {
    this.favoriteClick.emit(favorite);
  }

  onRemoveClick(favorite: FavoriteProfessional): void {
    this.removeClick.emit(favorite);
  }
}













