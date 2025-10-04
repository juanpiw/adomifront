import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProfileHeroComponent, ProfileHeroData } from '../../../../libs/shared-ui/profile-hero/profile-hero.component';
import { BookingPanelComponent, BookingPanelData, Service, TimeSlot, BookingSummary } from '../../../../libs/shared-ui/booking-panel/booking-panel.component';
import { PortfolioComponent, PortfolioData, PortfolioItem } from '../../../../libs/shared-ui/portfolio/portfolio.component';
import { ReviewsComponent, ReviewsData, Review } from '../../../../libs/shared-ui/reviews/reviews.component';
import { TrustStatsComponent, TrustStatsData } from '../../../../libs/shared-ui/trust-stats/trust-stats.component';
import { FaqComponent, FaqData, FaqItem } from '../../../../libs/shared-ui/faq/faq.component';

@Component({
  selector: 'app-perfil-trabajador',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeroComponent,
    BookingPanelComponent,
    PortfolioComponent,
    ReviewsComponent,
    TrustStatsComponent,
    FaqComponent
  ],
  templateUrl: './perfil-trabajador.component.html',
  styleUrls: ['./perfil-trabajador.component.scss']
})
export class PerfilTrabajadorComponent implements OnInit {
  workerId: string | null = null;
  workerData: any = null;
  loading: boolean = true;

  // Component data
  profileHeroData: ProfileHeroData = {
    name: '',
    title: '',
    avatar: '',
    coverImage: '',
    hasVideo: false
  };

  bookingPanelData: BookingPanelData = {
    services: [],
    timeSlots: [],
    summary: {
      service: '',
      date: '',
      time: '',
      price: ''
    }
  };

  portfolioData: PortfolioData = {
    title: 'Portafolio',
    items: []
  };

  reviewsData: ReviewsData = {
    title: 'Lo que dicen sus clientes',
    reviews: [],
    showAllButton: true
  };

  trustStatsData: TrustStatsData = {
    rating: 0,
    reviewsCount: 0,
    isVerified: false,
    verifiedText: 'Profesional Verificado'
  };

  faqData: FaqData = {
    title: 'Preguntas Frecuentes',
    items: []
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.workerId = this.route.snapshot.paramMap.get('workerId');
    
    if (this.workerId) {
      this.loadWorkerData();
    } else {
      this.router.navigate(['/client/explorar']);
    }
  }

  private loadWorkerData(): void {
    this.loading = true;
    
    // TODO: Implementar servicio para obtener datos del trabajador
    // Por ahora datos de ejemplo
    setTimeout(() => {
      this.workerData = {
        id: this.workerId,
        name: 'Elena Torres',
        title: 'Estilista Profesional en Providencia',
        rating: 4.9,
        reviews: 85,
        location: 'Providencia, Santiago',
        experience: '5 años',
        services: [
          { name: 'Corte de Pelo', price: '$25.000', duration: '60 min' },
          { name: 'Manicura', price: '$15.000', duration: '45 min' },
          { name: 'Maquillaje Profesional', price: '$30.000', duration: '75 min' }
        ],
        photos: [
          'https://placehold.co/400x300/ddd6fe/4338ca?text=Corte+1',
          'https://placehold.co/400x300/ddd6fe/4338ca?text=Coloraci%C3%B3n',
          'https://placehold.co/400x300/ddd6fe/4338ca?text=Peinado'
        ],
        bio: 'Estilista con más de 5 años de experiencia especializado en cortes modernos y barbas. Me apasiona crear looks únicos para cada cliente.',
        verified: true,
        responseTime: 'Respuesta en menos de 1 hora',
        availability: 'Disponible ahora',
        coverImage: 'https://placehold.co/1200x400/C7D2FE/4338CA?text=Sal%C3%B3n+de+Elena',
        avatar: 'https://placehold.co/128x128/C7D2FE/4338CA?text=ET'
      };
      
      this.initializeComponentData();
      this.loading = false;
    }, 1000);
  }

  private initializeComponentData(): void {
    // Profile Hero Data
    this.profileHeroData = {
      name: this.workerData.name,
      title: this.workerData.title,
      avatar: this.workerData.avatar,
      coverImage: this.workerData.coverImage,
      hasVideo: false
    };

    // Booking Panel Data
    this.bookingPanelData = {
      services: this.workerData.services.map((service: any, index: number) => ({
        id: `service-${index}`,
        name: service.name,
        duration: service.duration,
        price: service.price,
        isActive: index === 2 // Maquillaje Profesional activo por defecto
      })),
      timeSlots: [
        { time: '11:00', isAvailable: true, isSelected: true },
        { time: '12:00', isAvailable: false },
        { time: '13:00', isAvailable: false },
        { time: '15:00', isAvailable: true },
        { time: '16:00', isAvailable: false }
      ],
      summary: {
        service: 'Maquillaje Profesional',
        date: '29-10-2025',
        time: '11:00',
        price: '$30.000'
      }
    };

    // Portfolio Data
    this.portfolioData = {
      title: 'Portafolio',
      items: this.workerData.photos.map((photo: string, index: number) => ({
        id: `portfolio-${index}`,
        imageUrl: photo,
        title: `Trabajo ${index + 1}`,
        description: `Descripción del trabajo ${index + 1}`
      }))
    };

    // Reviews Data
    this.reviewsData = {
      title: 'Lo que dicen sus clientes',
      reviews: [
        {
          id: 'review-1',
          clientName: 'María C.',
          clientInitials: 'MC',
          rating: 5.0,
          date: 'Hace 2 semanas',
          text: '¡Elena es increíble! Dejó mi pelo exactamente como lo quería. Es súper profesional, puntual y muy amable. ¡La recomiendo 100%!'
        }
      ],
      showAllButton: true
    };

    // Trust Stats Data
    this.trustStatsData = {
      rating: this.workerData.rating,
      reviewsCount: this.workerData.reviews,
      isVerified: this.workerData.verified,
      verifiedText: 'Profesional Verificado'
    };

    // FAQ Data
    this.faqData = {
      title: 'Preguntas Frecuentes',
      items: [
        {
          id: 'faq-1',
          question: '¿Qué tipo de productos utilizas?',
          answer: 'Utilizo productos profesionales de alta gama, principalmente de marcas libres de crueldad animal y con opciones veganas disponibles bajo petición.',
          isExpanded: false
        },
        {
          id: 'faq-2',
          question: '¿Necesito tener estacionamiento disponible?',
          answer: 'No es estrictamente necesario, pero se agradece mucho si hay un lugar cercano para estacionar, ya que facilita el transporte de mis equipos.',
          isExpanded: false
        }
      ]
    };
  }

  goBack(): void {
    this.location.back();
  }

  // Event handlers for components
  onPlayVideoClick(): void {
    console.log('Play video clicked');
    // TODO: Implementar reproducción de video
  }

  onAvatarClick(): void {
    console.log('Avatar clicked');
    // TODO: Implementar lógica de avatar
  }

  onServiceSelected(serviceId: string): void {
    console.log('Service selected:', serviceId);
    // TODO: Implementar lógica de selección de servicio
  }

  onDateSelected(date: string): void {
    console.log('Date selected:', date);
    // TODO: Implementar lógica de selección de fecha
  }

  onTimeSelected(time: string): void {
    console.log('Time selected:', time);
    // TODO: Implementar lógica de selección de hora
  }

  onBookingConfirmed(summary: BookingSummary): void {
    console.log('Booking confirmed:', summary);
    // TODO: Implementar lógica de confirmación de reserva
  }

  onMessageClicked(): void {
    console.log('Message clicked');
    // TODO: Implementar lógica de mensaje
  }

  onPortfolioItemClick(item: PortfolioItem): void {
    console.log('Portfolio item clicked:', item);
    // TODO: Implementar modal de imagen
  }

  onReviewClick(review: Review): void {
    console.log('Review clicked:', review);
    // TODO: Implementar lógica de reseña
  }

  onShowAllReviewsClick(): void {
    console.log('Show all reviews clicked');
    // TODO: Implementar vista de todas las reseñas
  }

  onRatingClick(rating: number): void {
    console.log('Rating clicked:', rating);
    // TODO: Implementar lógica de rating
  }

  onVerificationClick(): void {
    console.log('Verification clicked');
    // TODO: Implementar lógica de verificación
  }

  onFaqItemClick(item: FaqItem): void {
    console.log('FAQ item clicked:', item);
    // TODO: Implementar lógica de FAQ
  }

  onFaqItemToggle(item: FaqItem): void {
    console.log('FAQ item toggled:', item);
    // TODO: Implementar lógica de toggle FAQ
  }

  // Legacy methods
  bookService(service: any): void {
    console.log('Reservar servicio:', service);
    // TODO: Implementar lógica de reserva
  }

  contactWorker(): void {
    console.log('Contactar trabajador:', this.workerId);
    // TODO: Implementar lógica de contacto
  }
}
