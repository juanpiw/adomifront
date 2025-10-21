import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
import { PaymentsService } from '../../../services/payments.service';
import { NotificationService } from '../../../../libs/shared-ui/notifications/services/notification.service';

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

    <ui-reservas-tabs 
      [tabs]="['Próximas','Pasadas','Canceladas','Pagadas/Realizadas']"
      (tabChange)="activeTab = $event" 
      [badges]="tabBadges"></ui-reservas-tabs>

    <div class="content" *ngIf="activeTab === 0">
      <ng-container *ngIf="(proximasConfirmadas?.length || 0) > 0; else noConfirmadas">
        <ui-proxima-cita-card 
          *ngFor="let p of proximasConfirmadas" 
          [data]="p" 
          (pagar)="onPagar($event)"
          (contactar)="onContactar(p.appointmentId)"
          style="margin-bottom:12px;">
        </ui-proxima-cita-card>
      </ng-container>
      <ng-template #noConfirmadas></ng-template>

      <ng-container *ngIf="(pendientesList?.length || 0) > 0; else noPendientes">
        <ui-pendiente-card 
          *ngFor="let pen of pendientesList" 
          [data]="pen" 
          style="margin-bottom:12px;">
        </ui-pendiente-card>
      </ng-container>
      <ng-template #noPendientes></ng-template>

      <p *ngIf="(proximasConfirmadas?.length || 0) === 0 && (pendientesList?.length || 0) === 0" style="color:#64748b;margin:8px 0 0 4px;">No tienes próximas reservas.</p>
    </div>

    <div class="content" *ngIf="activeTab === 1">
      <ui-reserva-pasada-card *ngIf="pasada1 as pa1" [data]="pa1" (onReview)="openReviewModal('Javier Núñez', 'Soporte Técnico', '1')" style="margin-bottom:12px;"></ui-reserva-pasada-card>
      <ui-reserva-pasada-card *ngIf="pasada2 as pa2" [data]="pa2" (onReview)="openReviewModal('Ana Pérez', 'Manicura', '2')"></ui-reserva-pasada-card>
      <p *ngIf="!pasada1 && !pasada2" style="color:#64748b;margin:8px 0 0 4px;">No tienes reservas pasadas para mostrar.</p>
    </div>

    <div class="content" *ngIf="activeTab === 2">
      <ui-cancelada-cliente-card 
        *ngFor="let cc of canceladasClienteList" 
        [data]="cc" 
        style="margin-bottom:12px;">
      </ui-cancelada-cliente-card>
      <ui-cancelada-profesional-card 
        *ngFor="let cp of canceladasProfesionalList" 
        [data]="cp" 
        style="margin-bottom:12px;">
      </ui-cancelada-profesional-card>
      <p *ngIf="(canceladasClienteList?.length || 0) === 0 && (canceladasProfesionalList?.length || 0) === 0" style="color:#64748b;margin:8px 0 0 4px;">No tienes reservas canceladas.</p>
    </div>

    <div class="content" *ngIf="activeTab === 3">
      <ui-reserva-pasada-card 
        *ngFor="let ra of realizadasList" 
        [data]="ra" 
        style="margin-bottom:12px;">
      </ui-reserva-pasada-card>
      <p *ngIf="(realizadasList?.length || 0) === 0" style="color:#64748b;margin:8px 0 0 4px;">No tienes citas pagadas/verificadas.</p>
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
  private router = inject(Router);
  private payments = inject(PaymentsService);
  private route = inject(ActivatedRoute);
  private notifications = inject(NotificationService);

  activeTab = 0;
  tabBadges: Array<number | null> = [null, null, null];
  
  // Profile validation
  showProfileModal: boolean = false;
  missingFields: string[] = [];
  userType: 'client' | 'provider' = 'client';
  
  // Datos de las reservas (se rellenan desde API)
  proximasConfirmadas: ProximaCitaData[] = [];
  pendientesList: PendienteData[] = [];
  pasada1: ReservaPasadaData | null = null;
  pasada2: ReservaPasadaData | null = null;
  canceladasClienteList: CanceladaClienteData[] = [];
  canceladasProfesionalList: CanceladaProfesionalData[] = [];
  realizadasList: ReservaPasadaData[] = [];

  // Estado del modal de reseñas
  showReviewModal = false;
  reviewWorkerName = '';
  reviewServiceName = '';
  reviewAppointmentId = '';

  // Mapa local: appointmentId -> providerId (para Contactar)
  private _providerByApptId: Record<number, number> = {};

  ngOnInit(): void {
    this.validateProfile();
    // Si venimos de Stripe success/cancel, procesar query y luego cargar
    const appointmentId = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (appointmentId && sessionId) {
      console.log('[RESERVAS] Processing payment return from Stripe:', { appointmentId, sessionId });
      this.payments.confirmAppointmentPayment(appointmentId, sessionId).subscribe({
        next: (resp) => {
          console.log('[RESERVAS] Payment confirmed:', resp);
          this.loadAppointments();
          this.router.navigate([], { queryParams: { appointmentId: null, session_id: null }, queryParamsHandling: 'merge' });
        },
        error: (err) => {
          console.error('[RESERVAS] Error confirming payment:', err);
          this.loadAppointments();
          this.router.navigate([], { queryParams: { appointmentId: null, session_id: null }, queryParamsHandling: 'merge' });
        }
      });
    } else {
      this.loadAppointments();
    }
    // Realtime: refrescar lista ante cambios relevantes
    this.appointments.onPaymentCompleted().subscribe(() => this.loadAppointments());
    this.appointments.onAppointmentUpdated().subscribe((appt) => {
      this.loadAppointments();
      // Crear notificación in-app para cliente sobre cambio de estado
      const statusMap: any = { scheduled: 'Programada', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };
      const statusText = statusMap[(appt as any).status] || 'Actualizada';
      this.notifications.setUserProfile('client');
      this.notifications.createNotification({
        type: 'appointment',
        title: 'Estado de tu cita',
        message: `Tu cita fue ${statusText.toLowerCase()}.`,
        priority: 'high',
        profile: 'client',
        actions: ['view'],
        metadata: { appointmentId: String((appt as any).id) }
      });
    });
    this.appointments.onAppointmentDeleted().subscribe(() => this.loadAppointments());
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
        const list = (resp.appointments || []) as (AppointmentDto & { provider_name?: string; service_name?: string; price?: number; payment_status?: 'unpaid'|'paid'|'succeeded'|'pending'|'completed' })[];
        console.log('[RESERVAS] Citas cargadas:', list);
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const nowTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        const upcoming = list.filter(a => a.date >= todayStr && (a.status === 'scheduled' || a.status === 'confirmed'))
                             .sort((a,b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
        // Pasadas: ya pasó la hora (mismo día) o la fecha es menor y no están completadas
        const isPastPending = (a: any) => {
          const dateOnly = String(a.date || '').split('T')[0];
          if (!dateOnly) return false;
          if (a.status === 'completed') return false;
          if (dateOnly < todayStr) return true;
          if (dateOnly > todayStr) return false;
          const end = String(a.end_time || a.start_time || '').slice(0,5);
          return end ? end < nowTime : false;
        };
        const past = list.filter(isPastPending)
                         .sort((a,b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
        const realizadasAll = list.filter(a => a.status === 'completed')
                                  .sort((a,b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
        const cancelled = list.filter(a => a.status === 'cancelled');

        // Todas las próximas confirmadas
        // Resetear mapa antes de reconstruir listas
        this._providerByApptId = {};

        this.proximasConfirmadas = upcoming
          .filter(a => a.status === 'confirmed')
          .map(a => {
            // Guardar relación para botón Contactar
            if (typeof (a as any).provider_id === 'number') {
              this._providerByApptId[a.id] = Number((a as any).provider_id);
            }
            const rawPayment = String((a as any).payment_status || '')
            const isPaid = ['paid', 'succeeded', 'completed'].includes(rawPayment);
            console.log(`[RESERVAS] Mapping confirmed appt #${a.id}: payment_status="${rawPayment}", isPaid=${isPaid}, date="${a.date}"`);

            const card: ProximaCitaData & { verification_code?: string } = {
              titulo: `${a.service_name || 'Servicio'} con ${a.provider_name || 'Profesional'}`,
              subtitulo: isPaid ? 'CITA PAGADA' : 'Confirmada (Esperando pago)',
              fecha: this.formatDate(a.date),
              hora: this.formatTime(a.start_time),
              diasRestantes: this.daysFromToday(a.date),
              mostrarPagar: !isPaid,
              appointmentId: a.id,
              successHighlight: isPaid
            };

            if (isPaid) {
              this.appointments.getVerificationCode(a.id).subscribe({
                next: (resp) => {
                  if (resp?.success && resp?.code) {
                    (card as any).verification_code = resp.code;
                  }
                },
                error: () => {}
              });
            }
            return card;
          });

        // Todas las próximas pendientes
        this.pendientesList = upcoming
          .filter(a => a.status === 'scheduled')
          .map(a => ({
            titulo: `${a.service_name || 'Servicio'} con ${a.provider_name || 'Profesional'}`,
            fecha: this.formatDate(a.date),
            hora: this.formatTime(a.start_time)
          }));
        // Pasadas: mostrar dos primeras (por confirmar o confirmadas pero vencidas)
        this.pasada1 = past[0] ? {
          avatarUrl: '',
          titulo: `${past[0].service_name || 'Servicio'} con ${past[0].provider_name || 'Profesional'}`,
          fecha: this.formatDate(past[0].date),
          precio: past[0].price ? `$${Number(past[0].price).toLocaleString('es-CL')}` : '',
          estado: past[0].status === 'confirmed' ? 'Confirmada' : 'Por confirmar'
        } : null;
        this.pasada2 = past[1] ? {
          avatarUrl: '',
          titulo: `${past[1].service_name || 'Servicio'} con ${past[1].provider_name || 'Profesional'}`,
          fecha: this.formatDate(past[1].date),
          precio: past[1].price ? `$${Number(past[1].price).toLocaleString('es-CL')}` : '',
          estado: past[1].status === 'confirmed' ? 'Confirmada' : 'Por confirmar'
        } : null;

        // Canceladas (placeholder: todas como canceladas por proveedor)
        this.canceladasProfesionalList = cancelled.map(c => ({
          avatarUrl: '',
          titulo: `${c.service_name || 'Servicio'} con ${c.provider_name || 'Profesional'}`,
          fecha: this.formatDate(c.date),
          pillText: 'Cancelada por proveedor'
        }));
        this.canceladasClienteList = [];

        // Realizadas/Pagadas (todas las completadas)
        this.realizadasList = realizadasAll.map(r => ({
          avatarUrl: '',
          titulo: `${r.service_name || 'Servicio'} con ${r.provider_name || 'Profesional'}`,
          fecha: this.formatDate(r.date),
          precio: r.price ? `$${Number(r.price).toLocaleString('es-CL')}` : '',
          estado: 'Completado'
        }));

        // Actualizar badges DESPUÉS de llenar listas: [Próximas, Pasadas, Canceladas]
        const upcomingCount = this.proximasConfirmadas.length + this.pendientesList.length;
        const pastCount = past.length;
        const cancelledCount = cancelled.length;
        const realizadasCount = realizadasAll.length;
        this.tabBadges = [upcomingCount || null, pastCount || null, cancelledCount || null, realizadasCount || null];
      },
      error: (err) => {
        console.error('Error cargando citas del cliente', err);
      }
    });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr || typeof dateStr !== 'string') return 'Fecha no disponible';
    try {
      const base = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [y, m, d] = base.split('-').map(Number);
      if (!y || !m || !d) return 'Fecha no disponible';
      const dt = new Date(y, m - 1, d);
      if (isNaN(dt.getTime())) return 'Fecha no disponible';
      return dt.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long' });
    } catch {
      return 'Fecha no disponible';
    }
  }
  private formatTime(hhmm: string): string {
    // Acepta HH:mm o HH:mm:ss desde backend
    if (!hhmm) return '';
    const parts = hhmm.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return hhmm;
  }
  private daysFromToday(dateIso: string): number {
    if (!dateIso || typeof dateIso !== 'string') return 0;
    const [y,m,d] = dateIso.split('-').map(Number);
    if (!y || !m || !d) return 0;
    const today = new Date();
    const target = new Date(y, m-1, d);
    if (isNaN(target.getTime())) return 0;
    const diff = Math.ceil((target.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime())/ (1000*60*60*24));
    return Math.max(diff, 0);
  }

  onPagar(appointmentId: number) {
    this.payments.createCheckoutSession(appointmentId).subscribe({
      next: (resp) => {
        if (resp.success && resp.url) {
          window.location.href = resp.url;
        }
      },
      error: (err) => {
        console.error('Error creando checkout de pago', err);
      }
    });
  }

  onContactar(appointmentId?: number | null) {
    if (!appointmentId) return;
    const providerId = this._providerByApptId ? this._providerByApptId[appointmentId] : undefined;
    if (providerId) {
      const providerName = this.proximasConfirmadas.find(x => x.appointmentId === appointmentId)?.titulo?.split(' con ')?.[1] || '';
      this.router.navigate(['/client/conversaciones'], {
        queryParams: { providerId, providerName }
      });
    } else {
      console.warn('[RESERVAS] No se encontró providerId para appointment', appointmentId, this._providerByApptId);
    }
  }

  // confirmPayment ya no es necesario; usamos PaymentsService

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
