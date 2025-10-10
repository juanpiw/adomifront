import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  HeroSectionComponent,
  CategoriesSectionComponent,
  FavoritesSectionComponent,
  RecommendedSectionComponent,
  Professional,
  Category,
  FavoriteProfessional
} from '../../../../libs/shared-ui/favorites';
import { ProfileRequiredModalComponent } from '../../../../libs/shared-ui/profile-required-modal/profile-required-modal.component';
import { ProfileValidationService } from '../../../services/profile-validation.service';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    CategoriesSectionComponent,
    FavoritesSectionComponent,
    RecommendedSectionComponent,
    ProfileRequiredModalComponent
  ],
  templateUrl: './favoritos.component.html',
  styleUrls: ['./favoritos.component.scss']
})
export class FavoritosComponent implements OnInit {
  private router = inject(Router);
  private profileValidation = inject(ProfileValidationService);

  searchValue = '';
  favorites: FavoriteProfessional[] = [];
  recommendedProfessionals: Professional[] = [];

  // Profile validation
  showProfileModal: boolean = false;
  missingFields: string[] = [];
  userType: 'client' | 'provider' = 'client';

  ngOnInit(): void {
    this.validateProfile();
    this.loadFavorites();
    this.loadRecommendedProfessionals();
  }

  private validateProfile() {
    this.profileValidation.validateProfile().subscribe({
      next: (response) => {
        if (!response.isComplete) {
          this.showProfileModal = true;
          this.missingFields = response.missingFields;
          this.userType = response.userType;
        }
      },
      error: (error) => console.error('Error validando perfil:', error)
    });
  }

  private loadFavorites(): void {
    // Mock data - replace with actual API call
    this.favorites = [
      {
        id: '1',
        name: 'Elena Torres',
        role: 'Estilista Profesional',
        rating: 4.9,
        initials: 'ET'
      },
      {
        id: '2',
        name: 'Mario Rojas',
        role: 'Chef a Domicilio',
        rating: 5.0,
        initials: 'MR'
      }
    ];
  }

  private loadRecommendedProfessionals(): void {
    // Mock data - replace with actual API call
    this.recommendedProfessionals = [
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
  }

  // Event handlers
  onSearchChange(value: string): void {
    this.searchValue = value;
    console.log('Search changed:', value);
  }

  onSearchSubmit(value: string): void {
    console.log('Search submitted:', value);
    // Navigate to search results
    this.router.navigate(['/client/explorar'], { 
      queryParams: { q: value } 
    });
  }

  onCategoryClick(category: Category): void {
    console.log('Category clicked:', category);
    // Navigate to category results
    this.router.navigate(['/client/explorar'], { 
      queryParams: { category: category.id } 
    });
  }

  onViewAllFavorites(): void {
    console.log('View all favorites');
    // Navigate to full favorites page
  }

  onRebookFavorite(favorite: FavoriteProfessional): void {
    console.log('Rebook favorite:', favorite);
    // Navigate to booking page
    this.router.navigate(['/client/explorar', favorite.id]);
  }

  onMessageFavorite(favorite: FavoriteProfessional): void {
    console.log('Message favorite:', favorite);
    // Navigate to chat
    this.router.navigate(['/client/conversaciones']);
  }

  onFavoriteClick(favorite: FavoriteProfessional): void {
    console.log('Favorite clicked:', favorite);
    // Navigate to professional profile
    this.router.navigate(['/client/explorar', favorite.id]);
  }

  onProfessionalClick(professional: Professional): void {
    console.log('Professional clicked:', professional);
    // Navigate to professional profile
    this.router.navigate(['/client/explorar', professional.id]);
  }

  onFavoriteToggle(professional: Professional): void {
    console.log('Favorite toggled:', professional);
    // Toggle favorite status
    professional.isFavorite = !professional.isFavorite;
    
    if (professional.isFavorite) {
      // Add to favorites
      const favorite: FavoriteProfessional = {
        id: professional.id,
        name: professional.name,
        role: professional.role,
        rating: professional.rating,
        initials: professional.name.split(' ').map(n => n[0]).join('').toUpperCase()
      };
      this.favorites.push(favorite);
    } else {
      // Remove from favorites
      this.favorites = this.favorites.filter(f => f.id !== professional.id);
    }
  }

  onBookProfessional(professional: Professional): void {
    console.log('Book professional:', professional);
    // Navigate to booking page
    this.router.navigate(['/client/explorar', professional.id]);
  }
}