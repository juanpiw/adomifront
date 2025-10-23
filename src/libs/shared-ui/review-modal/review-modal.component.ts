import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReviewData {
  rating: number;
  comment: string;
  workerName: string;
  serviceName: string;
  appointmentId?: string;
}

@Component({
  selector: 'app-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.scss']
})
export class ReviewModalComponent {
  @Input() isOpen: boolean = false;
  @Input() workerName: string = '';
  @Input() serviceName: string = '';
  @Input() appointmentId: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() reviewSubmitted = new EventEmitter<ReviewData>();
  @Output() reviewResult = new EventEmitter<{success: boolean, error?: string}>();

  rating: number = 0;
  hoverRating: number = 0; // Para el hover effect
  comment: string = '';
  showSuccessView: boolean = false;
  showErrorView: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';

  setRating(rating: number): void {
    this.rating = rating;
    console.log('Rating seleccionado:', rating);
  }

  onStarHover(rating: number): void {
    this.hoverRating = rating;
  }

  onStarLeave(): void {
    this.hoverRating = 0;
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSubmit(): void {
    if (this.rating === 0) {
      return; // No permitir envío sin rating
    }

    this.isSubmitting = true;

    // Simular envío
    setTimeout(() => {
      const reviewData: ReviewData = {
        rating: this.rating,
        comment: this.comment,
        workerName: this.workerName,
        serviceName: this.serviceName,
        appointmentId: this.appointmentId
      };

      this.reviewSubmitted.emit(reviewData);
      this.showSuccessView = true;
      this.isSubmitting = false;
    }, 1000);
  }

  onCloseSuccess(): void {
    this.close.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.rating = 0;
    this.hoverRating = 0;
    this.comment = '';
    this.showSuccessView = false;
    this.isSubmitting = false;
  }

  // Método para obtener las estrellas
  getStars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  // Método para verificar si una estrella está activa
  isStarActive(starIndex: number): boolean {
    // Si hay hover, usar hoverRating, sino usar rating
    const currentRating = this.hoverRating > 0 ? this.hoverRating : this.rating;
    return starIndex <= currentRating;
  }
}
