import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ReviewItem {
  clientName: string;
  serviceName?: string | null;
  rating: number; // 1-5
  comment?: string | null;
  date?: string; // ISO date
}

@Component({
  selector: 'ui-reviews-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews-table.component.html',
  styleUrls: ['./reviews-table.component.scss']
})
export class ReviewsTableComponent {
  @Input() reviews: ReviewItem[] = [];
  @Input() loading = false;

  getStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  }
}











