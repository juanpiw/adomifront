import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Review {
  id: string;
  clientName: string;
  clientInitials: string;
  clientAvatar?: string;
  rating: number;
  date: string;
  text: string;
}

export interface ReviewsData {
  title?: string;
  reviews: Review[];
  showAllButton?: boolean;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent {
  @Input() data: ReviewsData = {
    title: 'Lo que dicen sus clientes',
    reviews: [],
    showAllButton: false
  };

  @Output() reviewClick = new EventEmitter<Review>();
  @Output() showAllClick = new EventEmitter<void>();

  onReviewClick(review: Review) {
    this.reviewClick.emit(review);
  }

  onShowAllClick() {
    this.showAllClick.emit();
  }

  generateStars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < rating);
  }
}







