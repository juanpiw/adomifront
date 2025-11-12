import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservasTabsComponent } from '../../../../libs/shared-ui/reservas/reservas-tabs.component';
import { ProximaCitaCardComponent, ProximaCitaData } from '../../../../libs/shared-ui/reservas/proxima-cita-card.component';
import { PendienteCardComponent, PendienteData } from '../../../../libs/shared-ui/reservas/pendiente-card.component';
import { ReservaPasadaCardComponent, ReservaPasadaData } from '../../../../libs/shared-ui/reservas/reserva-pasada-card.component';
import { CanceladaClienteCardComponent, CanceladaClienteData } from '../../../../libs/shared-ui/reservas/cancelada-cliente-card.component';
import { CanceladaProfesionalCardComponent, CanceladaProfesionalData } from '../../../../libs/shared-ui/reservas/cancelada-profesional-card.component';
import { ReviewModalComponent, ReviewData } from '../../../../libs/shared-ui/review-modal/review-modal.component';
import { ReviewsService } from '../../../services/reviews.service';
import { ClientProfileService } from '../../../services/client-profile.service';
import { environment } from '../../../../environments/environment';
import { ProfileRequiredModalComponent } from '../../../../libs/shared-ui/profile-required-modal/profile-required-modal.component';
import { ProfileValidationService } from '../../../services/profile-validation.service';
import { AppointmentsService, AppointmentDto } from '../../../services/appointments.service';
import { PaymentsService } from '../../../services/payments.service';
import { NotificationService } from '../../../../libs/shared-ui/notifications/services/notification.service';
import { FavoritesService } from '../../../services/favorites.service';

@Component({ 
  selector:'app-c-reservas', 
  standalone:true, 
  imports:[CommonModule, FormsModule, ReservasTabsComponent, ProximaCitaCardComponent, PendienteCardComponent, ReservaPasadaCardComponent, CanceladaClienteCardComponent, CanceladaProfesionalCardComponent, ReviewModalComponent, ProfileRequiredModalComponent],
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
          (pedirDevolucion)="onRefund($event)"
          (contactar)="onContactar(p.appointmentId)"
          (cancelar)="openCancelModal($event)"
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
        (onReview)="openReviewModal((ra.titulo.split(' con ')[1] || 'Profesional'), (ra.titulo.split(' con ')[0] || 'Servicio'), ('' + (ra.appointmentId || '')))"
        (onToggleFavorite)="onToggleFavorite(ra)"
        style="margin-bottom:12px;">
      </ui-reserva-pasada-card>
      <p *ngIf="(realizadasList?.length || 0) === 0" style="color:#64748b;margin:8px 0 0 4px;">No tienes citas pagadas/verificadas.</p>
    </div>
  </section>

  <!-- Modal de reseñas -->
  <app-review-modal
    #reviewModal
    [isOpen]="showReviewModal"
    [workerName]="reviewWorkerName"
    [serviceName]="reviewServiceName"
    [appointmentId]="reviewAppointmentId"
    (close)="closeReviewModal()"
    (reviewSubmitted)="onReviewSubmitted($event)">
  </app-review-modal>
  
  <!-- Modal método de pago -->
  <div *ngIf="showPayMethodModal" class="pay-modal__backdrop" (click)="closePayModal()"></div>
  <div *ngIf="showPayMethodModal" class="pay-modal__container">
    <div class="pay-modal__header">
      <h4>¿Cómo deseas pagar?</h4>
      <button class="pay-modal__close" (click)="closePayModal()">✕</button>
    </div>
    <div class="pay-modal__body">
      <div *ngIf="isCurrentAppointmentOverCashLimit()" class="pay-modal__cash-limit-warning">
        <div class="pay-modal__cash-limit-icon">💳</div>
        <div class="pay-modal__cash-limit-content">
          <div class="pay-modal__cash-limit-title">Solo pago con tarjeta</div>
          <div class="pay-modal__cash-limit-text">Por el momento no podemos procesar pagos en efectivo de {{ cashCapCurrency }} o más. Este servicio debe pagarse con tarjeta.</div>
        </div>
      </div>
      <div *ngIf="!isCurrentAppointmentOverCashLimit()" class="pay-pref-pill" [class.pay-pref-pill--cash]="clientPaymentPref==='cash'" [class.pay-pref-pill--card]="clientPaymentPref==='card'">
        Predeterminado: {{ clientPaymentPref==='cash' ? 'Efectivo' : 'Tarjeta' }}
      </div>
      <p *ngIf="!isCurrentAppointmentOverCashLimit()" style="margin:8px 0 0;color:#475569;">Puedes cambiarlo para esta reserva.</p>
    </div>
    <div class="pay-modal__actions">
      <button *ngIf="!isCurrentAppointmentOverCashLimit()" class="pay-modal__btn" (click)="payWithCash()" [disabled]="payModalLoading || isCurrentAppointmentOverCashLimit()">
        <span *ngIf="!payModalLoading">Pagar en Efectivo</span>
        <span *ngIf="payModalLoading">Procesando...</span>
      </button>
      <button class="pay-modal__btn pay-modal__btn--primary" (click)="payWithCard()" [disabled]="payModalLoading">
        <span *ngIf="!payModalLoading">Pagar con Tarjeta</span>
        <span *ngIf="payModalLoading">Procesando...</span>
      </button>
    </div>
  </div>

  <!-- Modal cancelar cita -->
  <div *ngIf="showCancelModal" class="cancel-modal__backdrop" (click)="closeCancelModal()"></div>
  <div *ngIf="showCancelModal" class="cancel-modal__container">
    <div class="cancel-modal__header">
      <h4>Cancelar cita</h4>
      <button class="cancel-modal__close" (click)="closeCancelModal()">✕</button>
    </div>
    <div class="cancel-modal__body">
      <p class="cancel-modal__warning">¿Seguro que deseas cancelar esta cita? Una vez cancelada el horario quedará disponible nuevamente.</p>
      <label class="cancel-modal__label">Escribe <strong>CANCELAR</strong> para confirmar</label>
      <input [(ngModel)]="cancelModalConfirm" class="cancel-modal__input" placeholder="CANCELAR" autocomplete="off" />
      <label class="cancel-modal__label" style="margin-top:12px;">Motivo (opcional)</label>
      <textarea [(ngModel)]="cancelModalReason" class="cancel-modal__textarea" rows="3" placeholder="Cuéntale al profesional el motivo"></textarea>
      <div *ngIf="cancelModalError" class="cancel-modal__error">{{ cancelModalError }}</div>
    </div>
    <div class="cancel-modal__actions">
      <button class="cancel-modal__btn" (click)="closeCancelModal()" [disabled]="cancelModalLoading">Mantener cita</button>
      <button class="cancel-modal__btn cancel-modal__btn--danger" (click)="confirmCancel()" [disabled]="cancelModalLoading">
        <span *ngIf="!cancelModalLoading">Cancelar cita</span>
        <span *ngIf="cancelModalLoading">Cancelando...</span>
      </button>
    </div>
  </div>
  `,
  styles:[`
    .reservas-page{padding:24px}
    .title{font-weight:800;font-size:24px;margin:0 0 8px;color:#0f172a}
    .content{margin-top:16px}
    .pay-modal__backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:90}
    .pay-modal__container{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:92%;max-width:420px;background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.2);z-index:91;overflow:hidden}
    .pay-modal__header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e5e7eb}
    .pay-modal__close{background:transparent;border:none;font-size:18px;cursor:pointer}
    .pay-modal__body{padding:16px}
    .pay-pref-pill{display:inline-block;padding:8px 12px;border-radius:9999px;font-weight:800;font-size:12px;border:1px solid transparent;background:#1f2937;color:#fff}
    .pay-pref-pill--cash{background:#065f46;border-color:#059669}
    .pay-pref-pill--card{background:#1f2937;border-color:#374151}
    .pay-modal__actions{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #e5e7eb}
    .pay-modal__btn{padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;background:#f3f4f6;color:#374151;font-weight:700;cursor:pointer}
    .pay-modal__btn--primary{background:#4f46e5;color:#fff;border-color:#4f46e5}
    .pay-modal__cash-limit-warning{display:flex;gap:8px;align-items:flex-start;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px;margin-bottom:12px}
    .pay-modal__cash-limit-icon{font-size:18px;line-height:1}
    .pay-modal__cash-limit-content{flex:1}
    .pay-modal__cash-limit-title{font-weight:700;color:#92400e;margin-bottom:4px}
    .pay-modal__cash-limit-text{color:#b45309;font-size:14px;line-height:1.4}
    .cancel-modal__backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:92}
    .cancel-modal__container{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:92%;max-width:420px;background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(15,23,42,.25);z-index:93;overflow:hidden;display:flex;flex-direction:column}
    .cancel-modal__header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
    .cancel-modal__close{background:transparent;border:none;font-size:18px;cursor:pointer;color:#64748b}
    .cancel-modal__body{padding:16px;display:flex;flex-direction:column;gap:10px}
    .cancel-modal__warning{margin:0;color:#0f172a;font-weight:600;font-size:14px}
    .cancel-modal__label{font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em}
    .cancel-modal__input{padding:10px;border:1px solid #cbd5f5;border-radius:8px;font-weight:700;text-transform:uppercase}
    .cancel-modal__textarea{padding:10px;border:1px solid #e2e8f0;border-radius:8px;resize:vertical;min-height:90px}
    .cancel-modal__error{color:#b91c1c;font-weight:600;font-size:12px}
    .cancel-modal__actions{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #e2e8f0;background:#f8fafc}
    .cancel-modal__btn{padding:8px 12px;border-radius:8px;border:1px solid #cbd5f5;background:#fff;color:#1f2937;font-weight:700;cursor:pointer}
    .cancel-modal__btn--danger{background:#ef4444;border-color:#ef4444;color:#fff}
  `]
})
export class ClientReservasComponent implements OnInit {
  @ViewChild('reviewModal') reviewModal!: ReviewModalComponent;
  
  private profileValidation = inject(ProfileValidationService);
  private appointments = inject(AppointmentsService);
  private router = inject(Router);
  private payments = inject(PaymentsService);
  private route = inject(ActivatedRoute);
  private notifications = inject(NotificationService);
  private reviews = inject(ReviewsService);
  private favorites = inject(FavoritesService);
  private clientProfile = inject(ClientProfileService);

  activeTab = 0;
  tabBadges: Array<number | null> = [null, null, null];

  private resolveAvatar(raw?: string | null): string {
    if (!raw || raw.trim() === '') return '/assets/default-avatar.png';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/uploads')) return `${environment.apiBaseUrl}${raw}`;
    return `${environment.apiBaseUrl}/${raw.replace(/^\//, '')}`;
  }
  
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
  private favoritesSet: Set<number> = new Set<number>();

  // Estado del modal de reseñas
  showReviewModal = false;
  reviewWorkerName = '';
  reviewServiceName = '';
  reviewAppointmentId = '';

  // Mapa local: appointmentId -> providerId (para Contactar)
  private _providerByApptId: Record<number, number> = {};
  // Pref. de pago y modal
  clientPaymentPref: 'card'|'cash'|null = null;
  showPayMethodModal = false;
  payModalApptId: number | null = null;
  cashCap = 150000;
  private readonly clpFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  payModalLoading = false;

  // Cancel modal state
  showCancelModal = false;
  cancelModalAppointmentId: number | null = null;
  cancelModalConfirm = '';
  cancelModalReason = '';
  cancelModalError: string | null = null;
  cancelModalLoading = false;

  get cashCapCurrency(): string {
    return this.clpFormatter.format(this.cashCap);
  }

  ngOnInit(): void {
    this.validateProfile();
    // Preferencia de pago del cliente
    try { this.clientProfile.getPaymentPreference().subscribe({ next: (res:any) => this.clientPaymentPref = (res?.preference ?? null) as any, error: () => this.clientPaymentPref = null }); } catch {}
    // Si venimos de Stripe success/cancel, procesar query y luego cargar
    const appointmentId = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (appointmentId && sessionId) {
      console.log('[RESERVAS] Processing payment return from Stripe:', { appointmentId, sessionId });
      this.payments.confirmAppointmentPayment(appointmentId, sessionId).subscribe({
        next: (resp) => {
          console.log('[RESERVAS] Payment confirmed:', resp);
          // Log adicional para trazar envío de emails en backend
          console.log('[RESERVAS][TRACE] Confirm API returned. If webhook ran, backend should have logged email sending.');
          this.loadAppointments();
          this.router.navigate([], { queryParams: { appointmentId: null, session_id: null }, queryParamsHandling: 'merge' });
        },
        error: (err) => {
          console.error('[RESERVAS] Error confirming payment:', err);
          console.warn('[RESERVAS][TRACE] Confirm API error; webhook may still send emails asynchronously if event delivered.');
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
      const statusMap: any = { scheduled: 'Programada', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada', expired: 'Expirada' };
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
    // Cargar favoritos del cliente al iniciar
    this.loadFavorites();
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
        console.log('[RESERVAS] Precios en datos:', list.map(a => ({ id: a.id, price: a.price, service_name: a.service_name })));
        console.log('[RESERVAS] Estado de pago por cita:', list.map(a => ({ id: a.id, payment_status: (a as any).payment_status, status: a.status })));
        const paid = list.filter(a => ['paid','succeeded','completed'].includes(String((a as any).payment_status || '')));
        console.log('[RESERVAS][TRACE] Paid appointments mapping:', paid.map(a => ({ id: a.id, status: (a as any).payment_status, date: a.date })));
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
        const realizadasCompletadas = list.filter(a => a.status === 'completed')
                                  .sort((a,b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
        const cancelled = list.filter(a => ['cancelled', 'expired'].includes(String(a.status)));

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
            console.log(`[RESERVAS] Mapping confirmed appt #${a.id}: payment_status="${rawPayment}", isPaid=${isPaid}, date="${a.date}", price=${a.price}, rawPrice=${JSON.stringify(a.price)}`);

            const card: ProximaCitaData & { verification_code?: string } = {
              titulo: `${a.service_name || 'Servicio'} con ${a.provider_name || 'Profesional'}`,
              subtitulo: isPaid ? 'CITA PAGADA' : 'Confirmada (Esperando pago)',
              fecha: this.formatDate(a.date),
              hora: this.formatTime(a.start_time),
              diasRestantes: this.daysFromToday(a.date),
              mostrarPagar: !isPaid,
              appointmentId: a.id,
              successHighlight: isPaid,
              precio: Number(a.price || 30000), // Valor por defecto para testing
              paymentPreference: (a as any).payment_method || null,
              verification_code: (a as any).verification_code || undefined,
              cashCap: this.cashCap,
              cashCapLabel: this.cashCapCurrency
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
              console.log('[RESERVAS][TRACE] isPaid=true; verification code requested for appointment', a.id);
            }
            return card;
          })
          // Quitar de Próximas si ya está pagada (queda visible en Pagadas/Realizadas)
          .filter(c => !c.successHighlight);

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
          avatarUrl: this.resolveAvatar((past[0] as any).provider_avatar_url || (past[0] as any).avatar_url || ''),
          titulo: `${past[0].service_name || 'Servicio'} con ${past[0].provider_name || 'Profesional'}`,
          fecha: this.formatDate(past[0].date),
          precio: past[0].price ? `$${Number(past[0].price).toLocaleString('es-CL')}` : '',
          estado: past[0].status === 'confirmed' ? 'Confirmada' : 'Por confirmar'
        } : null;
        this.pasada2 = past[1] ? {
          avatarUrl: this.resolveAvatar((past[1] as any).provider_avatar_url || (past[1] as any).avatar_url || ''),
          titulo: `${past[1].service_name || 'Servicio'} con ${past[1].provider_name || 'Profesional'}`,
          fecha: this.formatDate(past[1].date),
          precio: past[1].price ? `$${Number(past[1].price).toLocaleString('es-CL')}` : '',
          estado: past[1].status === 'confirmed' ? 'Confirmada' : 'Por confirmar'
        } : null;

        this.canceladasClienteList = cancelled
          .filter(c => String((c as any).cancelled_by || 'client') === 'client')
          .map(c => ({
            avatarUrl: this.resolveAvatar((c as any).provider_avatar_url || (c as any).avatar_url || ''),
            titulo: `${c.service_name || 'Servicio'} con ${c.provider_name || 'Profesional'}`,
            fecha: this.formatDate(c.date),
            estadoPill: (c as any).cancellation_reason ? `Motivo: ${(c as any).cancellation_reason}` : undefined
          }));

        this.canceladasProfesionalList = cancelled
          .filter(c => String((c as any).cancelled_by || 'provider') !== 'client')
          .map(c => {
            const isExpired = String(c.status) === 'expired';
            const pillText = isExpired
              ? 'Expirada por falta de confirmación'
              : ((c as any).cancellation_reason ? `Motivo: ${(c as any).cancellation_reason}` : 'Cancelada por el profesional');
            return {
              avatarUrl: this.resolveAvatar((c as any).provider_avatar_url || (c as any).avatar_url || ''),
              titulo: `${c.service_name || 'Servicio'} con ${c.provider_name || 'Profesional'}`,
              fecha: this.formatDate(c.date),
              pillText
            };
          });

        // Pagadas/Realizadas: incluir completadas o pagadas
        const isPaidStatus = (s: any) => ['paid','succeeded','completed'].includes(String(s || ''));
        const realizadasAll = list
          .filter(r => r.status === 'completed' || isPaidStatus((r as any).payment_status))
          .sort((a,b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));

        this.realizadasList = realizadasAll.map(r => ({
          avatarUrl: this.resolveAvatar((r as any).provider_avatar_url || (r as any).avatar_url || (r as any).client_avatar_url || ''),
          titulo: `${r.service_name || 'Servicio'} con ${r.provider_name || 'Profesional'}`,
          fecha: this.formatDate(r.date),
          precio: r.price ? `$${Number(r.price).toLocaleString('es-CL')}` : '',
          estado: r.status === 'completed' ? 'Completado' : 'Pagada',
          appointmentId: r.id as number,
          providerId: (r as any).provider_id as number,
          serviceId: (r as any).service_id as number,
          isFavorite: (r as any).is_favorite === true || this.favoritesSet.has(Number((r as any).provider_id))
        }));

        // Para las pagadas (no completadas), obtener y mostrar código
        this.realizadasList.forEach((card, idx) => {
          const src = realizadasAll[idx];
          const rawPayment = String((src as any).payment_status || '');
          const isPaid = ['paid','succeeded','completed'].includes(rawPayment);
          if (isPaid && (src as any).status !== 'completed' && card.appointmentId) {
            this.appointments.getVerificationCode(card.appointmentId).subscribe({
              next: (resp) => {
                if (resp?.success && resp?.code) {
                  this.realizadasList = this.realizadasList.map(c => c.appointmentId === card.appointmentId ? { ...c, verificationCode: resp.code } : c);
                }
              },
              error: () => {}
            });
          }
        });

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

  private loadFavorites(): void {
    this.favorites.listFavorites().subscribe({
      next: (resp) => {
        const ids = new Set<number>();
        (resp.favorites || []).forEach(f => ids.add(Number(f.id)));
        this.favoritesSet = ids;
        // Marcar en realizadasList si ya está cargada
        this.realizadasList = (this.realizadasList || []).map(r => ({ ...r, isFavorite: r.providerId ? this.favoritesSet.has(r.providerId) : r.isFavorite }));
      },
      error: () => {}
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
    // No permitir 0: mínimo 1 día para hoy o futuras
    return diff <= 0 ? 1 : diff;
  }

  private setCashCapFromResponse(value: any): void {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return;
    }
    this.cashCap = Math.round(numeric);
    this.applyCashCapToCards();
  }

  private applyCashCapToCards(): void {
    this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => (
      { ...card, cashCap: this.cashCap, cashCapLabel: this.cashCapCurrency } as any
    ));
  }

  onPagar(appointmentId: number) {
    this.payModalApptId = appointmentId || null;
    this.showPayMethodModal = true;
    // Evitar redirección automática a Stripe en reintentos: no llames createCheckoutSession aquí
  }
  closePayModal(){
    this.showPayMethodModal = false;
    this.payModalApptId = null;
    this.payModalLoading = false;
  }

  openCancelModal(appointmentId: number | undefined | null) {
    if (!appointmentId) {
      return;
    }
    this.cancelModalAppointmentId = Number(appointmentId);
    this.cancelModalConfirm = '';
    this.cancelModalReason = '';
    this.cancelModalError = null;
    this.cancelModalLoading = false;
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.cancelModalAppointmentId = null;
    this.cancelModalLoading = false;
    this.cancelModalError = null;
  }
  
  isCurrentAppointmentOverCashLimit(): boolean {
    if (!this.payModalApptId) return false;
    const appointment = this.proximasConfirmadas.find(a => a.appointmentId === this.payModalApptId);
    return appointment?.precio ? appointment.precio > this.cashCap : false;
  }
  payWithCard(){
    if (!this.payModalApptId || this.payModalLoading) return;
    this.payModalLoading = true;
    const apptId = this.payModalApptId;
    console.log('[RESERVAS] payWithCard clicked for appt:', apptId);
    this.payments.tbkCreateMallTransaction({
      appointment_id: apptId,
      client_reference: `appt-${apptId}`
    }).subscribe({
      next: (resp) => {
        this.payModalLoading = false;
        this.closePayModal();
        console.log('[RESERVAS] tbkCreateMallTransaction resp:', resp);
        if (resp?.success && resp?.url && resp?.token) {
          try {
            // TBK requiere POST con token_ws al URL entregado
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = String(resp.url);
            form.style.display = 'none';
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'token_ws';
            input.value = String(resp.token);
            form.appendChild(input);
            console.log('[RESERVAS] Submitting POST to TBK with token_ws:', resp.token);
            document.body.appendChild(form);
            form.submit();
          } catch (e) {
            console.error('[RESERVAS] Error enviando POST a TBK', e);
            window.location.href = String(resp.url);
          }
        } else {
          console.error('[RESERVAS] TBK create tx sin URL', resp);
        }
      },
      error: (err) => {
        this.payModalLoading = false;
        console.error('[RESERVAS] Error creando transacción TBK', err);
      }
    });
  }
  confirmCancel(){
    if (!this.cancelModalAppointmentId || this.cancelModalLoading) {
      return;
    }
    if (this.cancelModalConfirm.trim().toLowerCase() !== 'cancelar') {
      this.cancelModalError = 'Debes escribir CANCELAR para confirmar.';
      return;
    }
    this.cancelModalLoading = true;
    this.cancelModalError = null;
    const reason = this.cancelModalReason?.trim() || undefined;
    const appointmentId = this.cancelModalAppointmentId;
    this.appointments.cancelAppointment(appointmentId, reason).subscribe({
      next: (resp) => {
        this.cancelModalLoading = false;
        if (resp?.success) {
          this.notifications.setUserProfile('client');
          this.notifications.createNotification({
            type: 'appointment',
            profile: 'client',
            title: 'Cita cancelada',
            message: 'Tu cita se canceló correctamente.',
            priority: 'high',
            actions: ['view'],
            metadata: { appointmentId: String(appointmentId) }
          });
          this.closeCancelModal();
          this.loadAppointments();
        } else {
          this.cancelModalError = 'No pudimos cancelar la cita. Intenta nuevamente.';
        }
      },
      error: (err) => {
        this.cancelModalLoading = false;
        this.cancelModalError = err?.error?.error || 'No pudimos cancelar la cita. Intenta nuevamente.';
      }
    });
  }
  payWithCash(){
    if (!this.payModalApptId || this.payModalLoading) { return; }
    const apptId = this.payModalApptId;
    this.payModalLoading = true;
    // Marcar la cita como pago en efectivo y obtener código
    this.payments.selectCash(apptId).subscribe({
      next: (res) => {
        this.setCashCapFromResponse((res as any)?.cashCap);
        const code = String((res as any)?.code || '').trim();
        // Buscar datos para enriquecer notificación
        const card = (this.proximasConfirmadas || []).find(c => c.appointmentId === apptId);
        const serviceName = card?.titulo ? String(card.titulo).split(' con ')[0] : 'Tu servicio';
        const fecha = card?.fecha || '';
        const hora = card?.hora || '';
        const messageSuffix = code ? ` Entrega el código ${code} al profesional.` : '';
        this.notifications.createNotification({
          type: 'system',
          profile: 'client',
          title: `Pago en efectivo: ${serviceName}`,
          message: `Pagarás en efectivo al finalizar. Fecha: ${fecha} • Hora: ${hora}.${messageSuffix}`,
          priority: 'low',
          actions: []
        });
        // Refrescar tarjeta: marcar efectivo y pedir/actualizar código desde backend
        this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => (
          card.appointmentId === apptId
            ? { ...card, paymentPreference: 'cash', mostrarPagar: false, verification_code: code || (card as any).verification_code, cashCap: this.cashCap, cashCapLabel: this.cashCapCurrency } as any
            : card
        ));
        // Forzar obtener código (endpoint de cliente)
        this.appointments.getVerificationCode(apptId).subscribe({
          next: (vc) => {
            if (vc?.success && vc?.code) {
              this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => (
                card.appointmentId === apptId ? { ...card, verification_code: vc.code } as any : card
              ));
            }
          },
          error: () => {}
        });
        this.clientPaymentPref = 'cash';
        this.payModalLoading = false;
        this.closePayModal();
        this.loadAppointments();
      },
      error: (err) => {
        this.payModalLoading = false;
        console.error('[RESERVAS] Error seleccionando efectivo', err);
        const errorMessage = err?.error?.error || 'No pudimos seleccionar pago en efectivo. Intenta nuevamente.';
        this.setCashCapFromResponse(err?.error?.cashCap);
        this.notifications.createNotification({ type: 'system', profile: 'client', title: 'Error', message: errorMessage, priority: 'high', actions: [] });
      }
    });
  }

  onContactar(appointmentId?: number | null) {
    if (!appointmentId) return;
    const providerId = this._providerByApptId ? this._providerByApptId[appointmentId] : undefined;
    if (providerId) {
      const providerName = this.proximasConfirmadas.find(x => x.appointmentId === appointmentId)?.titulo?.split(' con ')[1] || '';
      this.router.navigate(['/client/conversaciones'], {
        queryParams: { providerId, providerName }
      });
    } else {
      console.warn('[RESERVAS] No se encontró providerId para appointment', appointmentId, this._providerByApptId);
    }
  }

  onRefund(ev: { appointmentId: number; reason: string }) {
    if (!ev || !ev.appointmentId) return;
    if (!ev.reason || ev.reason.trim().length < 10) {
      this.notifications.createNotification({
        type: 'system', profile: 'client', title: 'Motivo muy corto', message: 'Escribe al menos 10 caracteres.', priority: 'low', actions: []
      });
      return;
    }
    this.payments.requestRefund(ev.appointmentId, ev.reason).subscribe({
      next: (resp) => {
        if (resp?.success) {
          this.notifications.createNotification({
            type: 'system', profile: 'client', title: 'Solicitud enviada', message: 'Revisaremos tu solicitud de devolución.', priority: 'low', actions: []
          });
          // Marcar tarjeta como "Solicitud en proceso"
          this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => {
            if (card.appointmentId === ev.appointmentId) {
              return { ...card, refundRequested: true } as any;
            }
            return card;
          });
        }
      },
      error: () => {
        this.notifications.createNotification({
          type: 'system', profile: 'client', title: 'Error', message: 'No pudimos registrar tu solicitud. Intenta nuevamente.', priority: 'high', actions: []
        });
      }
    });
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
    try {
      const apptIdNum = Number(this.reviewAppointmentId || reviewData.appointmentId);
      let providerName = this.proximasConfirmadas.find(x => String(x.appointmentId) === String(apptIdNum))?.titulo?.split(' con ')[1] || '';
      let providerId = this._providerByApptId[apptIdNum];
      // Fallback: buscar en realizadasList cuando viene desde "Pagadas/Realizadas"
      if (!providerId) {
        const ra = this.realizadasList.find(r => String(r.appointmentId) === String(apptIdNum));
        if (ra && ra.providerId) providerId = Number(ra.providerId);
        if (!providerName && ra?.titulo) providerName = ra.titulo.split(' con ')[1] || '';
      }
      const rating = Math.max(1, Math.min(5, Number((reviewData as any).rating || 5)));
      const comment = (reviewData as any).comment || reviewData?.comment || '';
      if (!providerId) {
        console.warn('[REVIEWS] No providerId for appointment', apptIdNum);
      }
      this.reviews.createReview({ appointment_id: apptIdNum, provider_id: Number(providerId || 0), rating, comment }).subscribe({
        next: (resp) => {
          console.log('[REVIEWS] createReview resp', resp);
          this.notifications.createNotification({
            type: 'rating',
            profile: 'client',
            title: '¡Gracias por tu reseña!',
            message: `Calificaste a ${providerName || 'el profesional'} con ${rating} estrellas`,
            priority: 'low',
            actions: []
          });
          // Mostrar vista de éxito en el modal
          this.reviewModal.showSuccess();
        },
        error: (err) => {
          console.error('[REVIEWS] createReview error', err);
          console.error('[REVIEWS] Error details:', err.status, err.statusText, err.url);
          
          // Determinar mensaje de error específico
          let errorMessage = 'No se pudo enviar la reseña. Intenta nuevamente.';
          if (err.status === 404) {
            errorMessage = 'El servicio de reseñas no está disponible. Por favor, contacta al soporte.';
          } else if (err.status === 500) {
            errorMessage = 'Error interno del servidor. Intenta nuevamente más tarde.';
          } else if (err.status === 400) {
            errorMessage = 'Datos inválidos. Verifica la información e intenta nuevamente.';
          }
          
          // Mostrar vista de error en el modal
          this.reviewModal.showError(errorMessage);
        }
      });
    } catch (e) {
      console.error('[REVIEWS] exception', e);
      this.closeReviewModal();
    }
  }

  onToggleFavorite(ra: ReservaPasadaData): void {
    const providerId = Number(ra.providerId || 0);
    const serviceId = Number((ra as any).serviceId || 0) || null;
    if (!providerId) return;

    // Favorito por tarjeta (provider+service). No usamos favoritesSet global por provider.
    const isFav = !!ra.isFavorite;
    const op$ = isFav 
      ? this.favorites.removeFavorite(providerId, serviceId)
      : this.favorites.addFavorite(providerId, serviceId);
    op$.subscribe({
      next: () => {
        // Actualizar solo esta tarjeta
        this.realizadasList = this.realizadasList.map(x => x.appointmentId === ra.appointmentId ? { ...x, isFavorite: !isFav } : x);
        this.notifications.createNotification({
          type: 'system',
          profile: 'client',
          title: isFav ? 'Eliminado de favoritos' : 'Añadido a favoritos',
          message: ra.titulo,
          priority: 'low',
          actions: []
        });
      },
      error: () => {}
    });
  }
}
