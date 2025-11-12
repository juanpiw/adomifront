import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  ProviderClientService,
  ProviderClientProfile,
  ProviderClientReview,
  ProviderClientReviewSummary
} from '../../../services/provider-client.service';
import {
  ProviderClientReviewsService,
  ProviderClientReviewableAppointment
} from '../../../services/provider-client-reviews.service';
import { ReviewsComponent, ReviewsData } from '../../../../libs/shared-ui/reviews/reviews.component';
import { ReviewModalComponent, ReviewData } from '../../../../libs/shared-ui/review-modal/review-modal.component';

@Component({
  selector: 'app-perfil-solicitante',
  standalone: true,
  imports: [CommonModule, ReviewsComponent, ReviewModalComponent],
  templateUrl: './perfil-solicitante.component.html',
  styleUrls: ['../perfil/perfil.component.scss', './perfil-solicitante.component.scss']
})
export class PerfilSolicitanteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private providerClientService = inject(ProviderClientService);
  private providerClientReviews = inject(ProviderClientReviewsService);

  @ViewChild('clientReviewModal') clientReviewModal?: ReviewModalComponent;

  readonly Math = Math;

  loading = true;
  error: string | null = null;
  profile: ProviderClientProfile | null = null;
  clientId: number | null = null;
  reviewSummary: ProviderClientReviewSummary | null = null;
  recentReviews: ProviderClientReview[] = [];
  reviewableAppointments: ProviderClientReviewableAppointment[] = [];
  reviewableLoading = false;
  reviewLoading = false;
  reviewModalOpen = false;
  reviewModalSubmitting = false;
  reviewModalAppointmentId: number | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('clientId');
      const clientId = idParam ? Number(idParam) : NaN;
      if (!Number.isFinite(clientId) || clientId <= 0) {
        this.loading = false;
        this.error = 'Identificador de cliente inválido.';
        return;
      }
      this.fetchProfile(clientId);
    });
  }

  get memberSinceLabel(): string {
    if (!this.profile) return '';
    const sourceDate = this.profile.profile_created_at || this.profile.user_created_at;
    if (!sourceDate) return 'Cliente Adomi';
    try {
      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) return 'Cliente Adomi';
      const month = date.toLocaleDateString('es-ES', { month: 'long' });
      const year = date.getFullYear();
      return `Cliente Adomi desde ${this.capitalize(month)} de ${year}`;
    } catch {
      return 'Cliente Adomi';
    }
  }

  get verificationStatusVariant(): 'approved' | 'pending' | 'rejected' | 'none' {
    const status = this.profile?.verification_status;
    if (status === 'approved') return 'approved';
    if (status === 'pending') return 'pending';
    if (status === 'rejected') return 'rejected';
    return 'none';
  }

  get verificationStatusLabel(): string {
    const variant = this.verificationStatusVariant;
    switch (variant) {
      case 'approved':
        return 'Identidad verificada';
      case 'pending':
        return 'Verificación en revisión';
      case 'rejected':
        return 'Verificación rechazada';
      default:
        return 'Identidad no verificada';
    }
  }

  get showNotes(): boolean {
    return !!(this.profile && this.profile.notes && this.profile.notes.trim().length > 0);
  }

  get profilePhotoUrl(): string | null {
    return this.profile?.profile_photo_url || null;
  }

  get clientName(): string {
    if (!this.profile) return '';
    return this.profile.full_name || this.profile.display_name || 'Cliente sin nombre';
  }

  get ratingAverage(): number {
    if (this.reviewSummary && typeof this.reviewSummary.average === 'number') {
      return Number(this.reviewSummary.average.toFixed(2));
    }
    if (this.profile && typeof this.profile.rating_average === 'number') {
      return Number(this.profile.rating_average.toFixed(2));
    }
    return 0;
  }

  get ratingCount(): number {
    if (this.reviewSummary && typeof this.reviewSummary.count === 'number') {
      return this.reviewSummary.count;
    }
    if (this.profile && typeof this.profile.review_count === 'number') {
      return this.profile.review_count;
    }
    return 0;
  }

  get hasReviews(): boolean {
    return this.ratingCount > 0;
  }

  get reviewsData(): ReviewsData {
    return {
      title: 'Lo que dicen otros proveedores',
      reviews: this.recentReviews.map((review) => ({
        id: String(review.id),
        clientName: review.provider_name || 'Proveedor',
        clientInitials: this.getInitials(review.provider_name || 'Proveedor'),
        clientAvatar: undefined,
        rating: review.rating,
        date: this.formatReviewDate(review.created_at),
        text: review.comment || ''
      })),
      showAllButton: false
    };
  }

  get selectedReviewServiceName(): string {
    if (!this.reviewModalAppointmentId) {
      return 'Servicio completado';
    }
    const appointment = this.reviewableAppointments.find(
      (appt) => Number(appt.id) === Number(this.reviewModalAppointmentId)
    );
    return appointment?.service_name || 'Servicio completado';
  }

  get selectedReviewAppointmentLabel(): string {
    if (!this.reviewModalAppointmentId) {
      return '';
    }
    const appointment = this.reviewableAppointments.find(
      (appt) => Number(appt.id) === Number(this.reviewModalAppointmentId)
    );
    return appointment ? this.formatReviewableAppointment(appointment) : '';
  }

  getInitials(name?: string | null): string {
    const safe = (name || '').trim();
    if (!safe) return 'C';
    const parts = safe.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'C';
    if (parts.length === 1) return (parts[0][0] || 'C').toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    const result = `${first}${last}`.trim();
    return result ? result.toUpperCase() : 'C';
  }

  openReviewModalForAppointment(appointmentId?: number): void {
    if (!this.clientId) {
      alert('No se pudo identificar al cliente para calificar.');
      return;
    }

    const targetAppointmentId =
      appointmentId ??
      (this.reviewableAppointments.length > 0 ? this.reviewableAppointments[0].id : null);

    if (!targetAppointmentId) {
      alert('No tienes citas completadas pendientes de calificar.');
      return;
    }

    this.reviewModalAppointmentId = Number(targetAppointmentId);
    this.reviewModalOpen = true;
    this.reviewModalSubmitting = false;
  }

  onReviewModalClose(): void {
    this.reviewModalOpen = false;
    this.reviewModalSubmitting = false;
    this.reviewModalAppointmentId = null;
  }

  onReviewModalSubmit(data: ReviewData): void {
    if (!this.clientId) {
      this.clientReviewModal?.showError('No se pudo identificar al cliente.');
      return;
    }
    if (!this.reviewModalAppointmentId) {
      this.clientReviewModal?.showError('Selecciona una cita completada para calificar.');
      return;
    }
    if (!data.rating || data.rating < 1) {
      this.clientReviewModal?.showError('Selecciona una puntuación para el cliente.');
      return;
    }

    this.reviewModalSubmitting = true;
    this.providerClientReviews.createReview(this.clientId, {
      appointment_id: this.reviewModalAppointmentId,
      rating: data.rating,
      comment: data.comment?.trim() ? data.comment.trim() : null
    }).subscribe({
      next: (resp) => {
        this.reviewModalSubmitting = false;
        if (!resp?.success) {
          const message = resp?.error || 'No se pudo registrar la reseña.';
          this.clientReviewModal?.showError(message);
          return;
        }

        this.applyReviewSummary(resp.summary);
        this.clientReviewModal?.showSuccess();

        if (Number.isFinite(this.clientId)) {
          this.loadRecentReviews(this.clientId!);
          this.loadReviewableAppointments(this.clientId!);
        }
      },
      error: (err) => {
        console.error('[PERFIL SOLICITANTE] Error creando reseña de cliente', err);
        this.reviewModalSubmitting = false;
        const message = err?.error?.error || 'No se pudo registrar la reseña. Intenta nuevamente.';
        this.clientReviewModal?.showError(message);
      }
    });
  }

  private loadReviewableAppointments(clientId: number): void {
    this.reviewableLoading = true;
    this.providerClientReviews.listReviewableAppointments(clientId).subscribe({
      next: (resp) => {
        this.reviewableLoading = false;
        if (!resp?.success || !Array.isArray(resp.appointments)) {
          this.reviewableAppointments = [];
          return;
        }
        this.reviewableAppointments = resp.appointments;
      },
      error: (err) => {
        console.error('[PERFIL SOLICITANTE] Error cargando citas calificables', err);
        this.reviewableLoading = false;
        this.reviewableAppointments = [];
      }
    });
  }

  private loadRecentReviews(clientId: number, skipSummaryUpdate = false): void {
    this.reviewLoading = true;
    this.providerClientReviews.listReviews(clientId, { limit: 5 }).subscribe({
      next: (resp) => {
        this.reviewLoading = false;
        if (!resp?.success) {
          return;
        }
        if (!skipSummaryUpdate) {
          this.applyReviewSummary(resp.summary);
        }
        this.recentReviews = Array.isArray(resp.reviews)
          ? resp.reviews.map((review) => ({
              ...review,
              rating: Number(review.rating)
            }))
          : [];
      },
      error: (err) => {
        console.error('[PERFIL SOLICITANTE] Error cargando reseñas del cliente', err);
        this.reviewLoading = false;
      }
    });
  }

  private applyReviewSummary(summary: ProviderClientReviewSummary | null | undefined): void {
    if (!summary) {
      const fallbackCount = Number(this.profile?.review_count ?? 0);
      const fallbackAverage = Number(this.profile?.rating_average ?? 0);
      this.reviewSummary = { count: fallbackCount, average: fallbackAverage };
    } else {
      this.reviewSummary = {
        count: Number(summary.count ?? 0),
        average: Number(summary.average ?? 0)
      };
    }

    if (this.profile) {
      this.profile = {
        ...this.profile,
        review_count: this.reviewSummary.count,
        rating_average: this.reviewSummary.average
      };
    }
  }

  private formatReviewDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatReviewableAppointment(appointment: ProviderClientReviewableAppointment): string {
    if (!appointment) return '';
    const date = appointment.date ? new Date(`${appointment.date}T${appointment.start_time || '00:00'}`) : null;
    const dateLabel =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
        : appointment.date;
    const timeLabel = appointment.start_time ? appointment.start_time.slice(0, 5) : '';
    const serviceLabel = appointment.service_name ? ` • ${appointment.service_name}` : '';
    return `${dateLabel}${timeLabel ? ` · ${timeLabel}` : ''}${serviceLabel}`;
  }

  private fetchProfile(clientId: number): void {
    this.loading = true;
    this.error = null;

    this.providerClientService.getClientProfile(clientId).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response?.success || !response.client) {
          this.error = response?.error || 'No se encontró información del cliente.';
          return;
        }
        const normalizedProfile: ProviderClientProfile = {
          ...response.client,
          rating_average: Number(response.client?.rating_average ?? 0),
          review_count: Number(response.client?.review_count ?? 0)
        };
        this.profile = normalizedProfile;
        this.clientId = normalizedProfile.client_id;
        this.reviewModalAppointmentId = null;

        const summary = response.reviews?.summary
          ? {
              count: Number(response.reviews.summary.count ?? 0),
              average: Number(response.reviews.summary.average ?? 0)
            }
          : {
              count: normalizedProfile.review_count ?? 0,
              average: normalizedProfile.rating_average ?? 0
            };
        this.applyReviewSummary(summary);

        this.recentReviews = Array.isArray(response.reviews?.recent)
          ? response.reviews.recent.map((review) => ({
              ...review,
              rating: Number(review.rating)
            }))
          : [];

        if (Number.isFinite(this.clientId)) {
          this.loadReviewableAppointments(this.clientId!);
          this.loadRecentReviews(this.clientId!, true);
        }
      },
      error: (err) => {
        console.error('[PERFIL SOLICITANTE] Error cargando perfil', err);
        this.loading = false;
        this.error = err?.error?.error || 'No se pudo cargar la información del cliente.';
      }
    });
  }

  private capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

