import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ReviewItem {
  clientName: string;
  serviceName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date
}

@Component({
  selector: 'ui-reviews-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews-table.component.html',
  styleUrls: ['./reviews-table.component.scss']
})
export class ReviewsTableComponent {
  @Input() reviews: ReviewItem[] = [
    {
      clientName: 'Ana C.',
      serviceName: 'Masaje Descontracturante',
      rating: 5.0,
      comment: 'Excelente atención, alivió todo mi dolor de espalda.',
      date: '2024-10-01'
    },
    {
      clientName: 'Roberto M.',
      serviceName: 'Corte de Pelo y Barba',
      rating: 4.5,
      comment: 'Muy buen corte, solo un poco de espera al inicio.',
      date: '2024-09-28'
    },
    {
      clientName: 'Fabiola L.',
      serviceName: 'Manicure y Pedicure',
      rating: 5.0,
      comment: 'Servicio impecable y muy relajante. ¡Volveré!',
      date: '2024-09-25'
    },
    {
      clientName: 'Carlos P.',
      serviceName: 'Facial de Limpieza',
      rating: 4.8,
      comment: 'Mi piel se ve increíble después del tratamiento.',
      date: '2024-09-22'
    },
    {
      clientName: 'María S.',
      serviceName: 'Depilación',
      rating: 4.2,
      comment: 'Buen servicio, muy profesional.',
      date: '2024-09-20'
    }
  ];

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



