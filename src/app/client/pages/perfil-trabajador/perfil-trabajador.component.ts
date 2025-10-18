import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProviderPublicService, ProviderDetailResponse } from '../../services/provider-public.service';
import { AppointmentsService } from '../../../services/appointments.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../../libs/shared-ui/notifications/services/notification.service';
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
  confirming: boolean = false;
  confirmError: string | null = null;
  closeConfirmSignal: number = 0;

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

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationSvc = inject(Location);
  private providerService = inject(ProviderPublicService);
  private appointments = inject(AppointmentsService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

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
    const id = Number(this.workerId);
    this.providerService.getProviderDetail(id).subscribe({
      next: (resp: ProviderDetailResponse) => {
        if (!resp.success) {
          this.loading = false;
          return;
        }
        const d = resp.data;
        this.workerData = {
          id: d.profile.id,
          name: d.profile.name,
          title: d.profile.title,
          rating: d.profile.rating,
          reviews: d.profile.reviews_count,
          location: d.profile.location,
          experience: d.profile.years_experience,
          // Conservar ids y valores numéricos para booking
          services: d.services.map(s => ({ id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes, image: s.image_url })),
          photos: d.portfolio.map(p => p.image_url).filter(Boolean),
          bio: d.profile.bio,
          verified: d.profile.is_verified,
          coverImage: d.profile.cover_url,
          avatar: d.profile.avatar_url
        };
        this.initializeComponentData();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/client/explorar']);
      }
    });
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
        id: String(service.id),
        name: service.name,
        duration: `${service.duration_minutes} min`,
        price: `$${Number(service.price).toLocaleString('es-CL')}`,
        isActive: index === 0
      })),
      timeSlots: [],
      summary: {
        service: this.workerData.services[0]?.name || '',
        date: this.formatToday(),
        time: '',
        price: this.workerData.services[0] ? `$${Number(this.workerData.services[0].price).toLocaleString('es-CL')}` : ''
      }
    };

    // Cargar slots iniciales
    const firstServiceId = Number(this.bookingPanelData.services[0]?.id);
    const providerId = Number(this.workerId);
    if (firstServiceId && providerId) {
      this.loadTimeSlots(providerId, this.bookingPanelData.summary.date, firstServiceId);
    }

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
    this.locationSvc.back();
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
    // Marcar activo en el estado del padre y actualizar resumen
    this.bookingPanelData.services = this.bookingPanelData.services.map(s => ({
      ...s,
      isActive: s.id === serviceId
    }));
    const selected = this.bookingPanelData.services.find(s => s.id === serviceId);
    if (selected) {
      this.bookingPanelData.summary.service = selected.name;
      this.bookingPanelData.summary.price = selected.price;
      this.bookingPanelData.summary.time = '';
    }
    const providerId = Number(this.workerId);
    const date = this.bookingPanelData.summary.date || this.formatToday();
    this.loadTimeSlots(providerId, date, Number(serviceId));
  }

  onDateSelected(date: string): void {
    this.bookingPanelData.summary.date = date;
    const providerId = Number(this.workerId);
    let activeService = this.bookingPanelData.services.find(s => s.isActive);
    if (!activeService && this.bookingPanelData.services.length > 0) {
      activeService = this.bookingPanelData.services[0];
      this.bookingPanelData.services = this.bookingPanelData.services.map((s, i) => ({ ...s, isActive: i === 0 }));
      this.bookingPanelData.summary.service = activeService.name;
      this.bookingPanelData.summary.price = activeService.price;
      this.bookingPanelData.summary.time = '';
    }
    if (activeService) this.loadTimeSlots(providerId, date, Number(activeService.id));
  }

  onTimeSelected(time: string): void {
    this.bookingPanelData.summary.time = time;
  }

  onBookingConfirmed(summary: BookingSummary): void {
    const user = this.auth.getCurrentUser() as any;
    const clientId = user?.id;
    const providerId = Number(this.workerId);
    const activeService = this.bookingPanelData.services.find(s => s.isActive);
    if (!clientId || !activeService || !summary.date || !summary.time) {
      alert('Completa servicio, fecha y hora. Inicia sesión si es necesario.');
      return;
    }
    this.confirmError = null;
    this.confirming = true;
    const duration = this.parseDuration(activeService.duration);
    const endTime = this.addMinutes(summary.time, duration);
    this.appointments.create({
      provider_id: providerId,
      client_id: clientId,
      service_id: Number(activeService.id),
      date: this.toIsoDate(summary.date),
      start_time: summary.time,
      end_time: endTime
    }).subscribe({
      next: (resp: { success: boolean }) => {
        if (resp.success) {
          this.closeConfirmSignal++;
          this.confirming = false;
          // Crear notificación in-app para el cliente
          this.notifications.setUserProfile('client');
          this.notifications.createNotification({
            type: 'appointment',
            title: '✅ Cita agendada',
            message: `Tu cita con ${this.profileHeroData.name} fue creada. Esperando confirmación del proveedor.`,
            priority: 'high',
            profile: 'client',
            actions: ['view'],
            metadata: { providerId: this.workerId || '' }
          });
        } else {
          this.confirmError = 'No se pudo crear la cita';
          this.confirming = false;
        }
      },
      error: (err: any) => {
        console.error('Error creando cita', err);
        this.confirmError = err?.error?.error || '❌ No se pudo crear la cita';
        this.confirming = false;
      }
    });
  }

  onMessageClicked(): void {
    console.log('Message clicked - abriendo chat');
    // El chat se abre automáticamente desde el BookingPanelComponent
    // No necesitamos hacer nada aquí ya que el evento se maneja en el componente hijo
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

  private loadTimeSlots(providerId: number, date: string, serviceId: number) {
    this.appointments.getTimeSlots(providerId, this.toIsoDate(date), serviceId).subscribe({
      next: (resp: { success: boolean; time_slots: Array<{ time: string; is_available: boolean }> }) => {
        const slots = (resp.time_slots || []).map((s: { time: string; is_available: boolean }) => ({ time: s.time, isAvailable: s.is_available }));
        this.bookingPanelData.timeSlots = slots;
        // Actualizar summary conservando servicio/precio
        const active = this.bookingPanelData.services.find((s: Service) => s.isActive);
        const firstAvail = slots.find((s: any) => s.isAvailable);
        this.bookingPanelData.summary = {
          service: active?.name || '',
          date: date,
          time: firstAvail?.time || '',
          price: active?.price || ''
        };
      },
      error: (err: any) => {
        console.error('Error cargando time-slots', err);
        this.bookingPanelData.timeSlots = [];
      }
    });
  }

  private formatToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  private toIsoDate(date: string): string {
    // soporta formatos YYYY-MM-DD o DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const [dd, mm, yyyy] = date.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  private parseDuration(durationLabel: string): number {
    const m = durationLabel.match(/(\d+)/);
    return m ? Number(m[1]) : 60;
  }

  private addMinutes(hhmm: string, minutes: number): string {
    const [hh, mm] = hhmm.split(':').map(Number);
    const d = new Date(1970, 0, 1, hh, mm);
    d.setMinutes(d.getMinutes() + minutes);
    const H = String(d.getHours()).padStart(2, '0');
    const M = String(d.getMinutes()).padStart(2, '0');
    return `${H}:${M}`;
  }
}
