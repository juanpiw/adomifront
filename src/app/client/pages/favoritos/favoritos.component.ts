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
import { FavoritesService, FavoriteItem } from '../../../services/favorites.service';
import { ProfileValidationService } from '../../../services/profile-validation.service';
import { SearchService, Provider as SearchProvider } from '../../../services/search.service';

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
  private favoritesService = inject(FavoritesService);
  private searchService = inject(SearchService);

  searchValue = '';
  favorites: FavoriteProfessional[] = [];
  recommendedProfessionals: Professional[] = [];
  recommendedLoading = false;

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
    this.favoritesService.listFavorites().subscribe({
      next: (resp) => {
        const items = (resp?.favorites || []) as FavoriteItem[];
        this.favorites = items.map(it => ({
          id: String(it.id),
          name: it.name,
          role: it.role,
          rating: Number(it.rating || 0),
          initials: it.name.split(' ').map(n => n[0]).join('').toUpperCase()
        }));
        this.syncRecommendedFavorites();
      },
      error: (err) => {
        console.error('[FAVORITOS] Error cargando favoritos:', err);
        this.favorites = [];
      }
    });
  }

  private loadRecommendedProfessionals(): void {
    this.recommendedLoading = true;

    const useNearby = !!navigator.geolocation;

    if (useNearby) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.fetchRecommended({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => this.fetchRecommended(),
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 5 * 60 * 1000
        }
      );
    } else {
      this.fetchRecommended();
    }
  }

  private fetchRecommended(coords?: { lat: number; lng: number }): void {
    const request$ = coords
      ? this.searchService.searchNearbyProviders({
          lat: coords.lat,
          lng: coords.lng,
          radius_km: 10,
          limit: 8,
          rating_min: 3.5
        })
      : this.searchService.searchProviders({
          limit: 8,
          offset: 0,
          rating_min: 3.5
        });

    request$.subscribe({
      next: (resp) => {
        const providers = resp?.data ?? [];
        this.recommendedProfessionals = providers.map((provider, index) =>
          this.mapProviderToProfessional(provider, index)
        );
        this.syncRecommendedFavorites();
        this.recommendedLoading = false;
      },
      error: (err) => {
        console.error('[FAVORITOS] Error cargando recomendados:', err);
        this.recommendedProfessionals = [];
        this.recommendedLoading = false;
      }
    });
  }

  private mapProviderToProfessional(provider: SearchProvider, index: number): Professional {
    const palette: Professional['iconColor'][] = ['pink', 'orange', 'lime', 'blue', 'teal', 'red'];
    const color = palette[index % palette.length];
    const description =
      provider.description?.trim() ||
      provider.profession?.trim() ||
      (provider.primary_commune ? `Disponible en ${provider.primary_commune}` : 'Profesional verificado en AdomiApp');

    const isFavorite = this.favorites.some(fav => fav.id === String(provider.id));

    return {
      id: String(provider.id),
      name: provider.name,
      role: provider.profession || 'Profesional',
      description,
      rating: Number(provider.rating || 0),
      reviewCount: Number(provider.review_count || 0),
      iconColor: color,
      isFavorite,
      isVerified: !!provider.is_verified
    };
  }

  private syncRecommendedFavorites(): void {
    if (!this.recommendedProfessionals.length || !this.favorites.length) {
      return;
    }
    const favoritesSet = new Set(this.favorites.map(fav => fav.id));
    this.recommendedProfessionals = this.recommendedProfessionals.map(pro => ({
      ...pro,
      isFavorite: favoritesSet.has(pro.id)
    }));
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
    this.router.navigate(['/client/conversaciones'], { queryParams: { providerId: favorite.id, providerName: favorite.name } });
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