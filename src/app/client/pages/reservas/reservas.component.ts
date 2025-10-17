import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasTabsComponent } from '../../../../libs/shared-ui/reservas/reservas-tabs.component';
import { ProximaCitaCardComponent, ProximaCitaData } from '../../../../libs/shared-ui/reservas/proxima-cita-card.component';
import { PendienteCardComponent, PendienteData } from '../../../../libs/shared-ui/reservas/pendiente-card.component';
import { ReservaPasadaCardComponent, ReservaPasadaData } from '../../../../libs/shared-ui/reservas/reserva-pasada-card.component';
import { CanceladaClienteCardComponent, CanceladaClienteData } from '../../../../libs/shared-ui/reservas/cancelada-cliente-card.component';
import { CanceladaProfesionalCardComponent, CanceladaProfesionalData } from '../../../../libs/shared-ui/reservas/cancelada-profesional-card.component';
import { ReviewModalComponent, ReviewData } from '../../../../libs/shared-ui/review-modal/review-modal.component';
import { ProfileRequiredModalComponent } from '../../../../libs/shared-ui/profile-required-modal/profile-required-modal.component';
import { ProfileValidationService } from '../../../services/profile-validation.service';
import { AppointmentsService, AppointmentDto } from '../../../services/appointments.service';

@Component({ 
  selector:'app-c-reservas', 
  standalone:true, 
  imports:[CommonModule, ReservasTabsComponent, ProximaCitaCardComponent, PendienteCardComponent, ReservaPasadaCardComponent, CanceladaClienteCardComponent, CanceladaProfesionalCardComponent, ReviewModalComponent, ProfileRequiredModalComponent],
  template:`
  <!-- Modal de Perfil Requerido -->
  <app-profile-required-modal 
    *ngIf="showProfileModal"
    [missingFields]="missingFields"
    [userType]="userType"
  ></app-profile-required-modal>

  <section class="reservas-page">
    <h2 class="title">Mis Reservas</h2>

    <ui-reservas-tabs (tabChange)="activeTab = $event"></ui-reservas-tabs>

    <div class="content" *ngIf="activeTab === 0">
      <ui-proxima-cita-card [data]="proxima" style="margin-bottom:12px;"></ui-proxima-cita-card>
      <ui-pendiente-card [data]="pendiente"></ui-pendiente-card>
    </div>

    <div class="content" *ngIf="activeTab === 1">
      <ui-reserva-pasada-card [data]="pasada1" (onReview)="openReviewModal('Javier Núñez', 'Soporte Técnico', '1')" style="margin-bottom:12px;"></ui-reserva-pasada-card>
      <ui-reserva-pasada-card [data]="pasada2" (onReview)="openReviewModal('Ana Pérez', 'Manicura', '2')"></ui-reserva-pasada-card>
    </div>

    <div class="content" *ngIf="activeTab === 2">
      <ui-cancelada-cliente-card [data]="canceladaCliente" style="margin-bottom:12px;"></ui-cancelada-cliente-card>
      <ui-cancelada-profesional-card [data]="canceladaProfesional"></ui-cancelada-profesional-card>
    </div>
  </section>

  <!-- Modal de reseñas -->
  <app-review-modal
    [isOpen]="showReviewModal"
    [workerName]="reviewWorkerName"
    [serviceName]="reviewServiceName"
    [appointmentId]="reviewAppointmentId"
    (close)="closeReviewModal()"
    (reviewSubmitted)="onReviewSubmitted($event)">
  </app-review-modal>
  `,
  styles:[`
    .reservas-page{padding:24px}
    .title{font-weight:800;font-size:24px;margin:0 0 8px;color:#0f172a}
    .content{margin-top:16px}
  `]
})
export class ClientReservasComponent implements OnInit {
  private profileValidation = inject(ProfileValidationService);
  private appointments = inject(AppointmentsService);

  activeTab = 0;
  
  // Profile validation
  showProfileModal: boolean = false;
  missingFields: string[] = [];
  userType: 'client' | 'provider' = 'client';
  
  // Datos de las reservas (se rellenan desde API)
  proxima: ProximaCitaData | null = null;
  pendiente: PendienteData | null = null;
  pasada1: ReservaPasadaData | null = null;
  pasada2: ReservaPasadaData | null = null;
  canceladaCliente: CanceladaClienteData | null = null;
  canceladaProfesional: CanceladaProfesionalData | null = null;

  // Estado del modal de reseñas
  showReviewModal = false;
  reviewWorkerName = '';
  reviewServiceName = '';
  reviewAppointmentId = '';

  ngOnInit(): void {
    this.validateProfile();
    this.loadAppointments();
  }

  private validateProfile() {
    this.profileValidation.validateProfile().subscribe({
      next: (response) => {
        if (!response.isComplete) {
          this.showProfileModal = true;
          this.missingFields = response.missingFields;
          this.userType = response.userType;
        }
      },
      error: (error) => console.error('Error validando perfil:', error)
    });
  }

  private loadAppointments(): void {
    this.appointments.listClientAppointments().subscribe({
      next: (resp) => {
        const list = (resp.appointments || []) as (AppointmentDto & { provider_name?: string; service_name?: string; price?: number })[];
        const todayIso = new Date();
        const todayStr = `${todayIso.getFullYear()}-${String(todayIso.getMonth()+1).padStart(2,'0')}-${String(todayIso.getDate()).padStart(2,'0')}`;

        const upcoming = list.filter(a => a.date >= todayStr && (a.status === 'scheduled' || a.status === 'confirmed'))
                             .sort((a,b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
        const past = list.filter(a => a.date < todayStr && a.status === 'completed')
                         .sort((a,b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
        const cancelled = list.filter(a => a.status === 'cancelled');

        // Próxima confirmada → tarjeta principal; si no, mostrar pendiente
        const nextConfirmed = upcoming.find(a => a.status === 'confirmed');
        if (nextConfirmed) {
          this.proxima = {
            titulo: `${nextConfirmed.service_name || 'Servicio'} con ${nextConfirmed.provider_name || 'Profesional'}`,
            subtitulo: 'Confirmada (Esperando pago)',
            fecha: this.formatDate(nextConfirmed.date),
            hora: this.formatTime(nextConfirmed.start_time),
            diasRestantes: this.daysFromToday(nextConfirmed.date),
            mostrarPagar: true,
            appointmentId: nextConfirmed.id
          };
        } else {
          const nextScheduled = upcoming.find(a => a.status === 'scheduled');
          this.pendiente = nextScheduled ? {
            titulo: `${nextScheduled.service_name || 'Servicio'} con ${nextScheduled.provider_name || 'Profesional'}`,
            fecha: this.formatDate(nextScheduled.date),
            hora: this.formatTime(nextScheduled.start_time)
          } : null;
        }
        // Pasadas/canceladas demo: mapear primeras (en producción haríamos bucles para listarlas todas)
        this.pasada1 = past[0] ? {
          avatarUrl: '',
          titulo: `${past[0].service_name || 'Servicio'} con ${past[0].provider_name || 'Profesional'}`,
          fecha: this.formatDate(past[0].date),
          precio: past[0].price ? `$${Number(past[0].price).toLocaleString('es-CL')}` : '',
          estado: 'Completado'
        } : null;
      },
      error: (err) => {
        console.error('Error cargando citas del cliente', err);
      }
    });
  }

  private formatDate(iso: string): string {
    const [y,m,d] = iso.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    return dt.toLocaleDateString('es-CL', { weekday:'long', day:'2-digit', month:'long' });
  }
  private formatTime(hhmm: string): string { return hhmm; }
  private daysFromToday(dateIso: string): number {
    const [y,m,d] = dateIso.split('-').map(Number);
    const today = new Date();
    const target = new Date(y, m-1, d);
    const diff = Math.ceil((target.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime())/ (1000*60*60*24));
    return Math.max(diff, 0);
  }

  // Métodos del modal de reseñas
  openReviewModal(workerName: string, serviceName: string, appointmentId: string): void {
    this.reviewWorkerName = workerName;
    this.reviewServiceName = serviceName;
    this.reviewAppointmentId = appointmentId;
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.reviewWorkerName = '';
    this.reviewServiceName = '';
    this.reviewAppointmentId = '';
  }

  onReviewSubmitted(reviewData: ReviewData): void {
    console.log('Reseña enviada:', reviewData);
    // TODO: Implementar envío de reseña al backend
    // Por ahora solo cerramos el modal después de un delay
    setTimeout(() => {
      this.closeReviewModal();
    }, 2000);
  }
}
