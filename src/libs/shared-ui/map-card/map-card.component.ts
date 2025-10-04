import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { MapViewComponent } from '../map-view/map-view.component';
import { UserCardComponent, UserCardData } from '../user-card/user-card.component';

export interface ProfessionalCard {
  id: string;
  name: string;
  profession: string;
  avatar: string;
  rating: number;
  reviews: number;
  description?: string;
  location?: string;
  price?: string;
  isHighlighted?: boolean;
}

export interface MapCardMarker {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  type: 'provider' | 'service' | 'location';
  data?: any;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'ui-map-card',
  standalone: true,
  imports: [CommonModule, MapViewComponent, UserCardComponent],
  templateUrl: './map-card.component.html',
  styleUrls: ['./map-card.component.scss']
})
export class MapCardComponent implements OnInit {
  @Input() title: string = 'Profesionales disponibles';
  @Input() professionals: ProfessionalCard[] = [];
  @Input() highlightedProfessional: ProfessionalCard | null = null;
  @Input() mapMarkers: MapCardMarker[] = [];
  @Input() mapCenter: { lat: number; lng: number } = { lat: -33.4489, lng: -70.6693 };
  @Input() mapZoom: number = 12;
  @Input() height: string = '600px';
  @Input() showMapControls: boolean = true;
  @Input() showMapLegend: boolean = true;

  @Output() professionalClick = new EventEmitter<ProfessionalCard>();
  @Output() professionalBook = new EventEmitter<ProfessionalCard>();
  @Output() markerClick = new EventEmitter<MapCardMarker>();
  @Output() markerAction = new EventEmitter<{ marker: MapCardMarker; action: string }>();
  @Output() viewModeChange = new EventEmitter<'map' | 'list'>();

  ngOnInit() {
    // Si no hay profesional destacado, tomar el primero de la lista
    if (!this.highlightedProfessional && this.professionals.length > 0) {
      this.highlightedProfessional = this.professionals[0];
    }
  }

  onProfessionalClick(professional: ProfessionalCard) {
    this.professionalClick.emit(professional);
  }

  onProfessionalBook(professional: ProfessionalCard) {
    this.professionalBook.emit(professional);
  }

  onMarkerClick(marker: MapCardMarker) {
    this.markerClick.emit(marker);
  }

  onMarkerAction(event: { marker: MapCardMarker; action: string }) {
    this.markerAction.emit(event);
  }

  onViewModeChange(mode: 'map' | 'list') {
    this.viewModeChange.emit(mode);
  }

  getStarArray(rating: number): number[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(1);
    }
    
    if (hasHalfStar) {
      stars.push(0.5);
    }
    
    return stars;
  }

  getStarIcon(fill: number): string {
    if (fill === 1) return 'star';
    if (fill === 0.5) return 'star-half';
    return 'star-outline';
  }

  // Convert ProfessionalCard to UserCardData
  convertToUserCardData(professional: ProfessionalCard): UserCardData {
    return {
      id: professional.id,
      name: professional.name,
      profession: professional.profession,
      avatar: professional.avatar,
      rating: professional.rating,
      reviews: professional.reviews,
      description: professional.description,
      location: professional.location,
      isHighlighted: professional.isHighlighted
    };
  }
}
