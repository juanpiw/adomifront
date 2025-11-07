import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrustStatsData {
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  verifiedText?: string;
}

@Component({
  selector: 'app-trust-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-stats.component.html',
  styleUrls: ['./trust-stats.component.scss']
})
export class TrustStatsComponent {
  @Input() data: TrustStatsData = {
    rating: 0,
    reviewsCount: 0,
    isVerified: false,
    verifiedText: 'Profesional Verificado'
  };

  @Output() ratingClick = new EventEmitter<number>();
  @Output() verificationClick = new EventEmitter<void>();

  onRatingClick() {
    this.ratingClick.emit(this.data.rating);
  }

  onVerificationClick() {
    this.verificationClick.emit();
  }

  formatReviewsCount(count: number): string {
    return `(${count} reseñas)`;
  }
}












