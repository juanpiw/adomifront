import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProviderPublicService, ProviderDetailResponse, ProviderFaqResponse } from '../../services/provider-public.service';
import { environment } from '../../../../environments/environment';
import { AppointmentsService } from '../../../services/appointments.service';
import { AuthService, AuthUser } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../../libs/shared-ui/notifications/services/notification.service';
import { ProfileHeroComponent, ProfileHeroData } from '../../../../libs/shared-ui/profile-hero/profile-hero.component';
import { BookingPanelComponent, BookingPanelData, Service, TimeSlot, BookingSummary, FutureSlotSuggestion } from '../../../../libs/shared-ui/booking-panel/booking-panel.component';
import { PortfolioComponent, PortfolioData, PortfolioItem } from '../../../../libs/shared-ui/portfolio/portfolio.component';
import { ReviewsComponent, ReviewsData, Review } from '../../../../libs/shared-ui/reviews/reviews.component';
import { FaqComponent, FaqData, FaqItem } from '../../../../libs/shared-ui/faq/faq.component';
import { QuoteRequestPanelComponent } from '../../../../libs/shared-ui/quote-request-panel/quote-request-panel.component';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-perfil-trabajador',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeroComponent,
    BookingPanelComponent,
    PortfolioComponent,
    ReviewsComponent,
    FaqComponent,
    QuoteRequestPanelComponent
  ],
  templateUrl: './perfil-trabajador.component.html',
  styleUrls: ['./perfil-trabajador.component.scss']
})
export class PerfilTrabajadorComponent implements OnInit, OnDestroy {
  workerId: string | null = null;
  workerData: any = null;
  loading: boolean = true;
  confirming: boolean = false;
  confirmError: string | null = null;
  closeConfirmSignal: number = 0;
  slotSuggestions: string[] = [];
  futureSlotSuggestions: FutureSlotSuggestion[] = [];
  timeSlotsLoading = false;
  bookingSuccessMessage: string | null = null;
  private pendingAutoSelectTime: string | null = null;
  private nextAvailabilityLookup = 0;
  private authSubscription?: Subscription;

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
    },
    allowManualTime: false,
    timeSlotsMessage: null
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

  faqData: FaqData = {
    title: 'Preguntas Frecuentes',
    items: []
  };

  quoteRequestServices: string[] = [];
  isClientUser = false;
  clientDisplayName: string | null = null;
  clientEmail: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationSvc = inject(Location);
  private providerService = inject(ProviderPublicService);
  private appointments = inject(AppointmentsService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  private resolveMediaUrl(raw?: string | null): string {
    if (!raw || raw.trim() === '') return '/assets/default-avatar.png';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/uploads')) return `${environment.apiBaseUrl}${raw}`;
    return `${environment.apiBaseUrl}/${raw.replace(/^\//, '')}`;
  }

  ngOnInit(): void {
    this.workerId = this.route.snapshot.paramMap.get('workerId');

    this.syncClientContext(this.auth.getCurrentUser());
    this.authSubscription = this.auth.authState$.subscribe((user) => {
      this.syncClientContext(user);
    });
    
    if (this.workerId) {
      this.loadWorkerData();
    } else {
      this.router.navigate(['/client/explorar']);
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
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
          services: d.services.map(s => ({ id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes, image: s.image_url })),
          photos: d.portfolio.map(p => this.resolveMediaUrl(p.image_url)).filter(Boolean),
          bio: d.profile.bio,
          verified: d.profile.is_verified,
          coverImage: this.resolveMediaUrl(d.profile.cover_url),
          avatar: this.resolveMediaUrl(d.profile.avatar_url)
        };
        // Mapear reseñas reales del backend
        const mappedReviews = (d.reviews || []).map((r: any, idx: number) => {
          const name = String(r.client_name || 'Cliente');
          const initials = name.trim().split(/\s+/).slice(0,2).map((p: string) => p.charAt(0).toUpperCase()).join('') || 'CL';
          let dateStr = '';
          try { const dt = new Date(r.created_at); if (!isNaN(dt.getTime())) dateStr = dt.toLocaleDateString('es-CL'); } catch {}
          return {
            id: String(r.id ?? idx),
            clientName: name,
            clientInitials: initials,
            rating: Number(r.rating || 0),
            date: dateStr,
            text: String(r.comment || '')
          } as Review;
        });
        this.reviewsData = {
          title: 'Lo que dicen sus clientes',
          reviews: mappedReviews,
          showAllButton: true
        };
        this.initializeComponentData();
        this.loadProviderFaqs(id);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/client/explorar']);
      }
    });
  }

  private loadProviderFaqs(providerId: number): void {
    this.providerService.getProviderFaqs(providerId).subscribe({
      next: (resp: ProviderFaqResponse) => {
        if (!resp?.success) {
          this.faqData = {
            title: 'Preguntas Frecuentes',
            items: []
          };
          return;
        }
        const items = (resp.faqs || []).map(faq => ({
          id: String(faq.id),
          question: faq.question,
          answer: faq.answer,
          isExpanded: false
        }));
        this.faqData = {
          title: 'Preguntas Frecuentes',
          items
        };
      },
      error: () => {
        this.faqData = {
          title: 'Preguntas Frecuentes',
          items: []
        };
      }
    });
  }

  private initializeComponentData(): void {
    // Profile Hero Data
    this.profileHeroData = {
      name: this.workerData.name,
      title: this.workerData.title || '',
      avatar: this.resolveMediaUrl(this.workerData.avatar),
      coverImage: this.resolveMediaUrl(this.workerData.coverImage),
      location: this.workerData.location || '',
      rating: Number(this.workerData.rating || 0),
      reviewsCount: Number(this.workerData.reviews || 0),
      isVerified: !!this.workerData.verified,
      verifiedText: this.workerData.verified ? 'Profesional Verificado' : 'Perfil en validación',
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
      },
      allowManualTime: false,
      timeSlotsMessage: null
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
        imageUrl: this.resolveMediaUrl(photo),
        title: `Trabajo ${index + 1}`,
        description: `Descripción del trabajo ${index + 1}`
      }))
    };

    // FAQ Data
    this.faqData = {
      title: 'Preguntas Frecuentes',
      items: this.faqData.items || []
    };

    this.quoteRequestServices = this.workerData.services.map((service: any) => service.name).filter(Boolean);
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
    this.bookingSuccessMessage = null;
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
    this.bookingSuccessMessage = null;
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
    this.bookingSuccessMessage = null;
    this.bookingPanelData.summary.time = time;
    this.confirmError = null;
    this.slotSuggestions = [];
  }

  onFutureSlotSelected(slot: FutureSlotSuggestion): void {
    if (!slot) return;
    this.bookingSuccessMessage = null;
    this.pendingAutoSelectTime = slot.time || null;
    this.futureSlotSuggestions = this.futureSlotSuggestions.filter(s => !(s.isoDate === slot.isoDate && s.time === slot.time));
    this.onDateSelected(slot.isoDate);
  }

  onBookingConfirmed(summary: BookingSummary): void {
    console.log('🔵 [BOOKING] ==================== CONFIRMANDO CITA ====================');
    console.log('🔵 [BOOKING] Timestamp:', new Date().toISOString());
    console.log('🔵 [BOOKING] Summary:', summary);
    
    const user = this.auth.getCurrentUser() as any;
    const clientId = user?.id;
    const providerId = Number(this.workerId);
    const activeService = this.bookingPanelData.services.find(s => s.isActive);
    
    console.log('🔵 [BOOKING] User:', user);
    console.log('🔵 [BOOKING] Client ID:', clientId);
    console.log('🔵 [BOOKING] Provider ID:', providerId);
    console.log('🔵 [BOOKING] Active Service:', activeService);
    
    if (!clientId || !activeService || !summary.date || !summary.time) {
      console.error('🔴 [BOOKING] ❌ Validación fallida - datos incompletos');
      alert('Completa servicio, fecha y hora. Inicia sesión si es necesario.');
      return;
    }
    
    this.confirmError = null;
    this.confirming = true;
    const duration = this.parseDuration(activeService.duration);
    const endTime = this.addMinutes(summary.time, duration);
    
    const appointmentData: any = {
      provider_id: providerId,
      client_id: clientId,
      service_id: Number(activeService.id),
      date: this.toIsoDate(summary.date),
      start_time: summary.time,
      end_time: endTime
    };
    
    console.log('🔵 [BOOKING] Datos de la cita a crear (base):', appointmentData);

    // Snapshot opcional de coordenadas del destino (para evidencia de llegada del proveedor).
    // No bloquea la reserva si el usuario no da permiso.
    const createWithOptionalCoords = () => {
      console.log('🔵 [BOOKING] Enviando POST al backend...', appointmentData);
      this.appointments.create(appointmentData).subscribe({
      next: (resp: { success: boolean }) => {
        console.log('🔵 [BOOKING] ✅ Respuesta del backend recibida:', resp);
        
        if (resp.success) {
          console.log('🔵 [BOOKING] ✅ Cita creada exitosamente');
          this.closeConfirmSignal++;
          this.confirming = false;
          this.bookingSuccessMessage = '✅ Tu cita fue enviada. Te avisaremos cuando el profesional confirme.';
          this.slotSuggestions = [];
          this.futureSlotSuggestions = [];
          // Refrescar disponibilidades para reflejar el nuevo bloqueo
          this.loadTimeSlots(providerId, summary.date, Number(activeService.id));
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
          console.log('🔵 [BOOKING] ✅ Notificación cliente creada');
        } else {
          console.error('🔴 [BOOKING] ❌ Backend respondió con success: false');
          this.confirmError = 'No se pudo crear la cita';
          this.confirming = false;
        }
      },
      error: (err: any) => {
        console.error('🔴 [BOOKING] ❌ Error en la petición HTTP:', err);
        console.error('🔴 [BOOKING] Error status:', err.status);
        console.error('🔴 [BOOKING] Error message:', err.message);
        console.error('🔴 [BOOKING] Error completo:', err);
        this.confirming = false;
        if (err?.status === 409 && err?.error?.error === 'SLOT_TAKEN') {
          this.handleSlotTaken(appointmentData, err?.error?.nextOptions);
        } else {
          this.confirmError = err?.error?.message || err?.error?.error || '❌ No se pudo crear la cita';
        }
      }
    });
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos?.coords?.latitude;
            const lng = pos?.coords?.longitude;
            const acc = pos?.coords?.accuracy;
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              appointmentData.service_lat = lat;
              appointmentData.service_lng = lng;
              if (Number.isFinite(acc)) appointmentData.service_location_accuracy_m = acc;
              console.log('🔵 [BOOKING] Coordenadas destino adjuntas:', {
                service_lat: appointmentData.service_lat,
                service_lng: appointmentData.service_lng,
                service_location_accuracy_m: appointmentData.service_location_accuracy_m
              });
            }
            createWithOptionalCoords();
          },
          () => {
            createWithOptionalCoords();
          },
          { enableHighAccuracy: false, timeout: 2500, maximumAge: 600000 }
        );
      } else {
        createWithOptionalCoords();
      }
    } catch {
      createWithOptionalCoords();
    }
  }

  private handleSlotTaken(
    appointmentData: { provider_id: number; service_id: number; date: string; start_time: string },
    backendOptions?: string[]
  ): void {
    const { provider_id: providerId, service_id: serviceId, date: isoDate, start_time: conflictedTime } = appointmentData;
    const preservedSummary = { ...this.bookingPanelData.summary };

    this.confirmError = 'Otro usuario acaba de reservar este horario. Elige una alternativa disponible.';
    this.slotSuggestions = Array.isArray(backendOptions) && backendOptions.length
      ? backendOptions.slice(0, 3)
      : [];
    this.futureSlotSuggestions = [];

    this.appointments.getTimeSlots(providerId, isoDate, serviceId).subscribe({
      next: (resp: { success: boolean; time_slots: Array<{ time: string; is_available: boolean; reason?: string }>; meta?: { fully_blocked?: boolean; allow_manual?: boolean; blocked_reason?: string } }) => {
        const normalizedSlots: TimeSlot[] = (resp.time_slots || []).map((slot: { time: string; is_available: boolean; reason?: string }) => ({
          time: slot.time,
          isAvailable: slot.is_available,
          reason: slot.reason as 'booked' | 'blocked' | undefined
        }));

        const stillAvailable = normalizedSlots.find(slot => slot.time === preservedSummary.time && slot.isAvailable);
        const fallback = stillAvailable || normalizedSlots.find(slot => slot.isAvailable);

        this.bookingPanelData.timeSlots = normalizedSlots.map(slot => ({
          ...slot,
          isSelected: fallback ? slot.time === fallback.time : false
        }));

        const meta = resp.meta || {};
        const allowManual = !!meta.allow_manual;
        const fullyBlocked = !!meta.fully_blocked;
        const blockedReason = meta.blocked_reason;

        if (allowManual) {
          this.bookingPanelData.timeSlotsMessage = 'El profesional no tiene horarios publicados para esta fecha. Ingresa un horario para coordinar.';
        } else if (fullyBlocked) {
          this.bookingPanelData.timeSlotsMessage = blockedReason
            ? `Este profesional bloqueó la fecha (${blockedReason}). Selecciona otro día.`
            : 'Este profesional bloqueó esta fecha. Selecciona otro día.';
        } else if (!normalizedSlots.length) {
          this.bookingPanelData.timeSlotsMessage = 'No hay horarios publicados para esta fecha. Prueba con otro día o contacta al profesional para coordinar.';
        } else {
          this.bookingPanelData.timeSlotsMessage = null;
        }

        this.bookingPanelData.allowManualTime = allowManual;
        this.bookingPanelData.summary = {
          service: preservedSummary.service,
          date: preservedSummary.date,
          time: fallback?.time || '',
          price: preservedSummary.price
        };

        if (!this.slotSuggestions.length) {
          this.slotSuggestions = normalizedSlots
            .filter(slot => slot.isAvailable && slot.time !== conflictedTime)
            .slice(0, 3)
            .map(slot => slot.time);
        }

        if ((!fallback || !normalizedSlots.length) && !allowManual) {
          void this.fetchNextAvailableSlots(providerId, serviceId, isoDate);
        }
      },
      error: () => {
        if (!this.slotSuggestions.length) {
          this.slotSuggestions = [];
        }
      }
    });
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
    console.log('🟡 [PERFIL] Cargando time slots:', { providerId, date, serviceId });
    this.timeSlotsLoading = true;
    this.futureSlotSuggestions = [];
    this.slotSuggestions = [];
    const isoDate = this.toIsoDate(date);

    this.appointments.getTimeSlots(providerId, isoDate, serviceId).subscribe({
      next: (resp: { success: boolean; time_slots: Array<{ time: string; is_available: boolean; reason?: string }>; meta?: { fully_blocked?: boolean; allow_manual?: boolean; blocked_reason?: string } }) => {
        console.log('🟡 [PERFIL] Time slots recibidos:', resp.time_slots);
        this.timeSlotsLoading = false;

        const slots = (resp.time_slots || []).map((s) => ({
          time: s.time,
          isAvailable: s.is_available,
          reason: s.reason as 'booked' | 'blocked' | undefined
        })) as Array<TimeSlot & { reason?: 'booked' | 'blocked' }>;

        console.log('🟡 [PERFIL] Slots procesados:', {
          total: slots.length,
          disponibles: slots.filter(s => s.isAvailable).length,
          bloqueados: slots.filter(s => s.reason === 'blocked').length,
          ocupados: slots.filter(s => s.reason === 'booked').length
        });

        const meta = resp.meta || {};
        const allowManual = !!meta.allow_manual;
        const fullyBlocked = !!meta.fully_blocked;
        const blockedReason = meta.blocked_reason;

        if (allowManual) {
          this.bookingPanelData.timeSlotsMessage = 'El profesional no tiene horarios publicados para esta fecha. Ingresa un horario para coordinar.';
        } else if (fullyBlocked) {
          this.bookingPanelData.timeSlotsMessage = blockedReason
            ? `Este profesional bloqueó la fecha (${blockedReason}). Selecciona otro día.`
            : 'Este profesional bloqueó esta fecha. Selecciona otro día.';
        } else if (!slots.length) {
          this.bookingPanelData.timeSlotsMessage = 'No hay horarios publicados para esta fecha. Prueba con otro día o contacta al profesional.';
        } else {
          this.bookingPanelData.timeSlotsMessage = null;
        }

        this.bookingPanelData.allowManualTime = allowManual;

        const active = this.bookingPanelData.services.find((s: Service) => s.isActive);
        const previousTime = this.pendingAutoSelectTime || this.bookingPanelData.summary.time;
        this.pendingAutoSelectTime = null;

        let selectedSlot = slots.find(s => s.time === previousTime && s.isAvailable) || slots.find(s => s.isAvailable);

        this.bookingPanelData.timeSlots = slots.map(slot => ({
          ...slot,
          isSelected: selectedSlot ? slot.time === selectedSlot.time : false
        }));

        this.bookingPanelData.summary = {
          service: active?.name || '',
          date: date,
          time: selectedSlot?.time || '',
          price: active?.price || ''
        };

        if (!slots.length || !selectedSlot) {
          void this.fetchNextAvailableSlots(providerId, serviceId, isoDate);
        }
      },
      error: (err: any) => {
        console.error('🔴 [PERFIL] Error cargando time-slots:', err);
        this.timeSlotsLoading = false;
        this.bookingPanelData.timeSlots = [];
        this.bookingPanelData.allowManualTime = false;
        this.bookingPanelData.timeSlotsMessage = 'No se pudieron cargar los horarios. Intenta nuevamente.';
        this.futureSlotSuggestions = [];
        this.pendingAutoSelectTime = null;
      }
    });
  }

  private syncClientContext(user: AuthUser | null): void {
    this.isClientUser = !!(user && user.role === 'client');
    this.clientDisplayName = user?.name ?? null;
    this.clientEmail = user?.email ?? null;
  }

  private formatToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  private async fetchNextAvailableSlots(providerId: number, serviceId: number, fromIsoDate: string): Promise<void> {
    const lookupId = ++this.nextAvailabilityLookup;
    const baseDate = new Date(`${fromIsoDate}T00:00:00`);
    const suggestions: FutureSlotSuggestion[] = [];

    for (let offset = 1; offset <= 7 && suggestions.length < 3; offset++) {
      const candidate = new Date(baseDate);
      candidate.setDate(candidate.getDate() + offset);
      const iso = candidate.toISOString().slice(0, 10);
      try {
        const resp = await firstValueFrom(this.appointments.getTimeSlots(providerId, iso, serviceId));
        const available = (resp.time_slots || []).filter((slot: any) => slot.is_available);
        if (available.length) {
          suggestions.push({
            dateLabel: this.formatFriendlyDate(candidate),
            isoDate: iso,
            time: available[0].time
          });
        }
      } catch (error) {
        console.warn('⚠️ [PERFIL] No se pudo cargar disponibilidad futura', { iso, error });
      }
    }

    if (lookupId !== this.nextAvailabilityLookup) {
      return;
    }
    this.futureSlotSuggestions = suggestions;
  }

  private formatFriendlyDate(date: Date): string {
    const label = new Intl.DateTimeFormat('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }).format(date).replace(/\.$/, '');
    return label.charAt(0).toUpperCase() + label.slice(1);
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
