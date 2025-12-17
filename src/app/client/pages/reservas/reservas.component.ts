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
import { ClientQuotesComponent } from '../quotes/client-quotes.component';
import { ClientQuoteTabId } from '../../../services/quotes-client.service';

@Component({ 
  selector:'app-c-reservas', 
  standalone:true, 
  imports:[CommonModule, FormsModule, ReservasTabsComponent, ProximaCitaCardComponent, PendienteCardComponent, ReservaPasadaCardComponent, CanceladaClienteCardComponent, CanceladaProfesionalCardComponent, ReviewModalComponent, ProfileRequiredModalComponent, ClientQuotesComponent],
  template:`
  <!-- Modal de Perfil Requerido -->
  <app-profile-required-modal 
    *ngIf="showProfileModal"
    [missingFields]="missingFields"
    [userType]="userType"
  ></app-profile-required-modal>

  <section class="reservas-page">
    <h2 class="title">Mis Reservas</h2>

    <section *ngIf="rescheduleRequestsForRespond.length" class="reschedule-banner reschedule-banner--action">
      <div *ngFor="let request of rescheduleRequestsForRespond" class="reschedule-banner__item">
        <div class="reschedule-banner__info">
          <p class="reschedule-banner__title">Solicitud de reprogramación</p>
          <p class="reschedule-banner__text">
            {{ request.provider_name || 'El profesional' }} propone {{ formatRescheduleLabel(request) }}.
            <span *ngIf="request.reschedule_reason">Motivo: {{ request.reschedule_reason }}</span>
          </p>
        </div>
        <div class="reschedule-banner__actions">
          <button class="reschedule-btn accept" (click)="respondReschedule(request.id, 'accept')" [disabled]="rescheduleActionLoadingId === request.id">
            {{ rescheduleActionLoadingId === request.id ? 'Aceptando...' : 'Aceptar' }}
          </button>
          <button class="reschedule-btn reject" (click)="respondReschedule(request.id, 'reject')" [disabled]="rescheduleActionLoadingId === request.id">
            {{ rescheduleActionLoadingId === request.id ? 'Procesando...' : 'Rechazar' }}
          </button>
        </div>
      </div>
    </section>

    <section *ngIf="rescheduleRequestsOutgoing.length" class="reschedule-banner reschedule-banner--info">
      <div *ngFor="let request of rescheduleRequestsOutgoing" class="reschedule-banner__item">
        <div class="reschedule-banner__info">
          <p class="reschedule-banner__title">Reprogramación en revisión</p>
          <p class="reschedule-banner__text">
            Esperando respuesta del profesional para mover la cita a {{ formatRescheduleLabel(request) }}.
          </p>
        </div>
      </div>
    </section>

    <!-- Modal reprogramación -->
    <div *ngIf="showRescheduleModal" class="reschedule-modal__backdrop" (click)="closeRescheduleModal()"></div>
    <div *ngIf="showRescheduleModal" class="reschedule-modal__container" role="dialog" aria-modal="true">
      <header class="reschedule-modal__header">
        <h4>Reprogramar cita</h4>
        <button type="button" class="reschedule-modal__close" (click)="closeRescheduleModal()" [disabled]="rescheduleForm.loading">✕</button>
      </header>
      <section class="reschedule-modal__body">
        <p class="reschedule-modal__context" *ngIf="rescheduleForm.originalDate">
          Cita original: {{ rescheduleForm.originalDate }} · {{ rescheduleForm.originalTime }}
        </p>
        <form (ngSubmit)="submitReschedule()" class="reschedule-modal__form">
          <label class="reschedule-modal__label">
            Nueva fecha
            <input type="date" name="rescheduleDate" [(ngModel)]="rescheduleForm.date" (change)="updateRescheduleLateFlag()" (blur)="updateRescheduleLateFlag()" required [disabled]="rescheduleForm.loading">
          </label>
          <label class="reschedule-modal__label">
            Nuevo horario
            <input type="time" name="rescheduleTime" [(ngModel)]="rescheduleForm.time" (change)="updateRescheduleLateFlag()" (blur)="updateRescheduleLateFlag()" required [disabled]="rescheduleForm.loading">
          </label>
          <label class="reschedule-modal__label">
            Mensaje para el profesional (opcional)
            <textarea name="rescheduleReason" rows="3" [(ngModel)]="rescheduleForm.reason" placeholder="Comparte un contexto breve" [disabled]="rescheduleForm.loading"></textarea>
          </label>
          <div class="reschedule-modal__note" *ngIf="rescheduleForm.isLate">
            El cambio es dentro de las próximas 24 horas. Enviaremos una solicitud al profesional para que la apruebe.
          </div>
          <div class="reschedule-modal__note reschedule-modal__note--instant" *ngIf="!rescheduleForm.isLate">
            El cambio es con suficiente anticipación. Reprogramaremos automáticamente la cita.
          </div>
          <div class="reschedule-modal__error" *ngIf="rescheduleForm.error">{{ rescheduleForm.error }}</div>
          <div class="reschedule-modal__actions">
            <button type="button" class="reschedule-modal__btn" (click)="closeRescheduleModal()" [disabled]="rescheduleForm.loading">Cerrar</button>
            <button type="submit" class="reschedule-modal__btn reschedule-modal__btn--primary" [disabled]="rescheduleForm.loading">
              {{ rescheduleForm.loading ? 'Enviando...' : (rescheduleForm.isLate ? 'Solicitar reprogramación' : 'Reprogramar cita') }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <ui-reservas-tabs 
      [tabs]="['Próximas','Pasadas','Canceladas','Pagadas/Realizadas','Mis Cotizaciones']"
      (tabChange)="activeTab = $event" 
      [activeIndex]="activeTab"
      [badges]="tabBadges"></ui-reservas-tabs>

    <div class="content" *ngIf="activeTab === 0">
      <ng-container *ngIf="(proximasConfirmadas?.length || 0) > 0; else noConfirmadas">
        <ng-container *ngFor="let p of proximasConfirmadas">
          <div
            class="appt-anchor"
            [attr.id]="'appt-' + p.appointmentId"
            [class.appt-anchor--highlight]="highlightAppointmentId === p.appointmentId"
            style="margin-bottom:12px;"
          >
            <ui-proxima-cita-card 
              [data]="p" 
              (pagar)="onPagar($event)"
              (pagarTarjeta)="onPagar($event)"
              (pagarEfectivo)="onPagarEfectivo($event)"
              (pedirDevolucion)="onRefund($event)"
              (reprogramar)="onRequestReschedule($event)"
              (contactar)="onContactar(p.appointmentId)"
              (cancelar)="openCancelModal($event)"
              (finalizarServicio)="openFinalizeModal($event)"
              (reportarProblema)="openClaimFlow($event)">
            </ui-proxima-cita-card>
          </div>

          <!-- Flujo de reclamo embebido por cita (mismo ngFor: evita duplicados) -->
          <ng-container [ngSwitch]="getClaimState(p.appointmentId)">
            <div *ngSwitchCase="'claim'" class="claim-panel">
              <ng-container *ngIf="p.appointmentId as apptId">
                <ng-container *ngIf="claimData[apptId] as claim">
                <div class="claim-panel__header">
                  <div class="claim-panel__title">
                    <span class="chip chip--danger">Reclamo / Devolución</span>
                    <p class="claim-panel__subtitle">Transacción #{{ apptId }} • Tarjeta</p>
                  </div>
                  <button class="claim-panel__close" (click)="closeClaim(apptId)">✕</button>
                </div>

                <div class="claim-panel__body">
                  <div class="claim-panel__notice">
                    <p><strong>Antes de ir al banco:</strong> repórtalo aquí primero. Esto acelera la solución y nos permite gestionar reembolso o evidencia si fuese necesario.</p>
                    <p class="muted">Tiempo de respuesta estimado: {{ claimSlaText }}</p>
                    <p class="muted">
                      Recordatorio: confirmaste que el servicio se completó antes de pagar. Revisa nuestros
                      <a href="/terminos" target="_blank" rel="noopener">Términos y Condiciones</a>.
                    </p>
                  </div>

                  <form (ngSubmit)="submitClaim(apptId)">
                    <label class="claim-panel__label">
                      Motivo del reclamo
                      <select [(ngModel)]="claim.reason" name="reason-{{apptId}}" required>
                        <option value="" disabled>Selecciona un motivo</option>
                        <option value="fraude_no_reconozco">No reconozco este cargo (posible fraude)</option>
                        <option value="proveedor_no_show">El proveedor no asistió (no-show)</option>
                        <option value="servicio_no_prestado">El servicio no se realizó</option>
                        <option value="servicio_incompleto">El servicio fue incompleto / distinto</option>
                        <option value="cancelacion_proveedor">Cancelación por proveedor</option>
                        <option value="cobro_duplicado">Cobro duplicado en mi tarjeta</option>
                        <option value="monto_incorrecto">El monto cobrado no corresponde</option>
                        <option value="cancelacion_fallida">Cancelé pero me cobraron igual</option>
                        <option value="otro">Otro</option>
                      </select>
                    </label>

                    <div class="claim-panel__triage" *ngIf="claim.reason === 'fraude_no_reconozco'">
                      <p class="warn"><strong>Importante:</strong> si no reconoces el cargo, cambia tu contraseña y cierra sesión en tus dispositivos. Soporte te contactará para validar.</p>
                    </div>
                    <div class="claim-panel__triage" *ngIf="claim.reason === 'cobro_duplicado' || claim.reason === 'monto_incorrecto'">
                      <p class="muted">Sugerido: pega una captura del banco/comprobante en “Evidencia” (URLs) para resolver más rápido.</p>
                    </div>
                    <div class="claim-panel__triage" *ngIf="claim.reason === 'proveedor_no_show' || claim.reason === 'servicio_no_prestado' || claim.reason === 'servicio_incompleto'">
                      <p class="muted">Cuéntanos qué pasó y adjunta evidencia (chat/fotos/ubicación si aplica). Esto ayuda a decidir devolución vs defensa.</p>
                    </div>

                    <label class="claim-panel__label">
                      Descripción detallada
                      <textarea [(ngModel)]="claim.description" name="description-{{apptId}}" rows="3" placeholder="Explícanos qué sucedió..."></textarea>
                      <small class="muted">Mínimo 10 caracteres.</small>
                    </label>

                    <label class="claim-panel__check">
                      <input type="checkbox" [(ngModel)]="claim.confirmTruth" name="truth-{{apptId}}" />
                      Declaro que la información entregada es verdadera.
                    </label>
                    <label class="claim-panel__check">
                      <input type="checkbox" [(ngModel)]="claim.confirmChargebackInfo" name="cb-{{apptId}}" />
                      Entiendo que abrir un contracargo puede retrasar la resolución en Adomi.
                    </label>

                    <div class="claim-panel__actions">
                      <button type="button" class="btn ghost" (click)="closeClaim(apptId)" [disabled]="claim.loading">Cancelar</button>
                      <button type="submit" class="btn primary" [disabled]="claim.loading">
                        <span *ngIf="!claim.loading">Enviar solicitud</span>
                        <span *ngIf="claim.loading">Enviando…</span>
                      </button>
                    </div>
                    <div class="claim-panel__error" *ngIf="claim.error">{{ claim.error }}</div>
                  </form>
                </div>
                </ng-container>
              </ng-container>
            </div>

            <div *ngSwitchCase="'success'" class="claim-success">
              <ng-container *ngIf="p.appointmentId as apptId">
                <div class="claim-success__icon">✓</div>
                <h4>Solicitud recibida</h4>
                <p *ngIf="claimData[apptId]?.ticketId as tid">Ticket: {{ tid }}</p>
                <p *ngIf="!claimData[apptId]?.ticketId">Ticket: {{ 'REQ-' + apptId }}</p>
                <p class="muted">Mientras revisamos, el pago al proveedor queda retenido.</p>
                <button class="btn primary" (click)="resetClaim(apptId)">Volver a mis reservas</button>
              </ng-container>
            </div>
          </ng-container>
        </ng-container>
      </ng-container>
      <ng-template #noConfirmadas></ng-template>

      <ng-container *ngIf="(pendientesList?.length || 0) > 0; else noPendientes">
        <div
          *ngFor="let pen of pendientesList"
          class="appt-anchor"
          [attr.id]="pen.appointmentId ? ('appt-' + pen.appointmentId) : null"
          [class.appt-anchor--highlight]="highlightAppointmentId === pen.appointmentId"
          style="margin-bottom:12px;"
        >
          <ui-pendiente-card [data]="pen"></ui-pendiente-card>
        </div>
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
      <div
        *ngFor="let cc of canceladasClienteList"
        class="appt-anchor"
        [attr.id]="cc.appointmentId ? ('appt-' + cc.appointmentId) : null"
        [class.appt-anchor--highlight]="highlightAppointmentId === cc.appointmentId"
        style="margin-bottom:12px;"
      >
        <ui-cancelada-cliente-card 
          [data]="cc"
          (rebook)="onRebookCancelled(cc)">
        </ui-cancelada-cliente-card>
      </div>
      <div
        *ngFor="let cp of canceladasProfesionalList"
        class="appt-anchor"
        [attr.id]="cp.appointmentId ? ('appt-' + cp.appointmentId) : null"
        [class.appt-anchor--highlight]="highlightAppointmentId === cp.appointmentId"
        style="margin-bottom:12px;"
      >
        <ui-cancelada-profesional-card 
          [data]="cp"
          (findSimilar)="onFindSimilar(cp)">
        </ui-cancelada-profesional-card>
      </div>
      <p *ngIf="(canceladasClienteList?.length || 0) === 0 && (canceladasProfesionalList?.length || 0) === 0" style="color:#64748b;margin:8px 0 0 4px;">No tienes reservas canceladas.</p>
    </div>

    <div class="content" *ngIf="activeTab === 3">
      <div
        *ngFor="let ra of realizadasList"
        class="appt-anchor"
        [attr.id]="ra.appointmentId ? ('appt-' + ra.appointmentId) : null"
        [class.appt-anchor--highlight]="highlightAppointmentId === ra.appointmentId"
        style="margin-bottom:12px;"
      >
        <ui-reserva-pasada-card 
          [data]="ra" 
          (onReview)="openReviewModal((ra.titulo.split(' con ')[1] || 'Profesional'), (ra.titulo.split(' con ')[0] || 'Servicio'), ('' + (ra.appointmentId || '')))"
          (onToggleFavorite)="onToggleFavorite(ra)">
        </ui-reserva-pasada-card>
      </div>
      <p *ngIf="(realizadasList?.length || 0) === 0" style="color:#64748b;margin:8px 0 0 4px;">No tienes citas pagadas/verificadas.</p>
    </div>

    <div class="content" *ngIf="activeTab === 4">
      <app-client-quotes (countersChange)="onQuotesCounters($event)"></app-client-quotes>
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
      <button class="pay-modal__btn pay-modal__btn--primary" (click)="payWithCard()" [disabled]="payModalLoading || !canPayWithCard(payModalApptId)">
        <span *ngIf="!payModalLoading">Pagar con Tarjeta</span>
        <span *ngIf="payModalLoading">Procesando...</span>
      </button>
      <button *ngIf="tbkNeedsInscription" class="pay-modal__btn" (click)="startOcInscription()" [disabled]="payModalInscribing">
        <span *ngIf="!payModalInscribing">Inscribir tarjeta (Oneclick)</span>
        <span *ngIf="payModalInscribing">Redirigiendo...</span>
      </button>
    </div>
    <div *ngIf="tbkNeedsInscription && !payModalLoading && !canPayWithCard(payModalApptId)" class="pay-modal__hint">
      Necesitas inscribir tu tarjeta Oneclick antes de pagar con tarjeta.
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

  <!-- Modal finalizar servicio -->
  <div *ngIf="finalizeModal.open" class="cancel-modal__backdrop" (click)="closeFinalizeModal()"></div>
  <div *ngIf="finalizeModal.open" class="cancel-modal__container">
    <div class="cancel-modal__header">
      <h4>Confirmar que el servicio se completó</h4>
      <button class="cancel-modal__close" (click)="closeFinalizeModal()">✕</button>
    </div>
    <div class="cancel-modal__body">
      <p class="cancel-modal__warning">
          Al confirmar habilitaremos el pago al profesional. Usa esta opción solo si el servicio se realizó correctamente. Los reembolsos podrán requerir revisión adicional.
      </p>
      <div *ngIf="finalizeModal.error" class="cancel-modal__error">{{ finalizeModal.error }}</div>
    </div>
    <div class="cancel-modal__actions">
      <button class="cancel-modal__btn" (click)="closeFinalizeModal()" [disabled]="finalizeModal.submitting">Cancelar</button>
      <button class="cancel-modal__btn cancel-modal__btn--danger" (click)="confirmFinalizeService()" [disabled]="finalizeModal.submitting">
        <span *ngIf="!finalizeModal.submitting">Confirmar servicio</span>
        <span *ngIf="finalizeModal.submitting">Procesando...</span>
      </button>
    </div>
  </div>

  <!-- Modal reporte de no-show -->
  <div *ngIf="reportModal.open" class="cancel-modal__backdrop" (click)="closeReportModal()"></div>
  <div *ngIf="reportModal.open" class="cancel-modal__container">
    <div class="cancel-modal__header">
      <h4>Reportar problema / No-Show</h4>
      <button class="cancel-modal__close" (click)="closeReportModal()">✕</button>
    </div>
    <div class="cancel-modal__body">
      <p class="cancel-modal__warning">
        Cuéntanos qué ocurrió. Notificaremos al equipo de soporte antes de liberar el pago.
      </p>
      <label class="cancel-modal__label">Descripción</label>
      <textarea [(ngModel)]="reportModal.reason" class="cancel-modal__textarea" rows="4" placeholder="Ej: El profesional no llegó al lugar acordado."></textarea>
      <label class="cancel-modal__label" style="margin-top:12px;">Enlaces o evidencia (opcional)</label>
      <textarea [(ngModel)]="reportModal.evidenceText" class="cancel-modal__textarea" rows="3" placeholder="URL de fotos, drive, etc. Separa por coma o salto de línea."></textarea>
      <div *ngIf="reportModal.error" class="cancel-modal__error">{{ reportModal.error }}</div>
    </div>
    <div class="cancel-modal__actions">
      <button class="cancel-modal__btn" (click)="closeReportModal()" [disabled]="reportModal.submitting">Cerrar</button>
      <button class="cancel-modal__btn cancel-modal__btn--danger" (click)="submitReport()" [disabled]="reportModal.submitting">
        <span *ngIf="!reportModal.submitting">Enviar reporte</span>
        <span *ngIf="reportModal.submitting">Enviando...</span>
      </button>
    </div>
  </div>
  `,
  styles:[`
    .reservas-page{padding:24px}
    .title{font-weight:800;font-size:24px;margin:0 0 8px;color:#0f172a}
    .content{margin-top:16px}
    .reschedule-banner{margin:16px 0;padding:16px;border-radius:12px;background:#eef2ff;border:1px solid #c7d2fe;display:flex;flex-direction:column;gap:12px}
    .reschedule-banner--action{background:#fff7ed;border-color:#fed7aa}
    .reschedule-banner--info{background:#f8fafc;border-color:#e2e8f0}
    .reschedule-banner__item{display:flex;flex-direction:column;gap:12px;border-radius:10px;padding:0}
    .reschedule-banner__info{display:flex;flex-direction:column;gap:4px}
    .reschedule-banner__title{margin:0;font-weight:700;color:#1f2937;font-size:15px}
    .reschedule-banner__text{margin:0;color:#475569;font-size:14px;line-height:1.5}
    .reschedule-banner__actions{display:flex;gap:8px;flex-wrap:wrap}
    .reschedule-btn{padding:8px 16px;border-radius:999px;border:none;font-weight:700;cursor:pointer;transition:opacity .2s ease}
    .reschedule-btn.accept{background:#16a34a;color:#fff}
    .reschedule-btn.reject{background:#ef4444;color:#fff}
    .reschedule-btn:disabled{opacity:.7;cursor:not-allowed}
    .reschedule-modal__backdrop{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:94}
    .reschedule-modal__container{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:92%;max-width:460px;background:#fff;border-radius:16px;box-shadow:0 30px 60px rgba(15,23,42,.25);z-index:95;overflow:hidden;display:flex;flex-direction:column}
    .reschedule-modal__header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
    .reschedule-modal__header h4{margin:0;font-size:18px;font-weight:700;color:#0f172a}
    .reschedule-modal__close{border:none;background:transparent;font-size:20px;cursor:pointer;color:#64748b}
    .reschedule-modal__body{padding:20px;display:flex;flex-direction:column;gap:16px}
    .reschedule-modal__context{margin:0;color:#475569;font-size:14px;font-weight:600}
    .reschedule-modal__form{display:flex;flex-direction:column;gap:16px}
    .reschedule-modal__label{display:flex;flex-direction:column;font-size:13px;font-weight:700;color:#334155;gap:6px;text-transform:uppercase;letter-spacing:.05em}
    .reschedule-modal__label input,
    .reschedule-modal__label textarea{border:1px solid #cbd5f5;border-radius:10px;padding:10px;font-size:15px;font-weight:500;color:#0f172a}
    .reschedule-modal__label textarea{resize:vertical;min-height:90px}
    .reschedule-modal__note{background:#fff7ed;border:1px solid #fed7aa;color:#92400e;font-weight:600;border-radius:10px;padding:12px;font-size:13px}
    .reschedule-modal__note--instant{background:#ecfdf5;border-color:#6ee7b7;color:#047857}
    .reschedule-modal__error{color:#dc2626;font-weight:600;font-size:13px}
    .reschedule-modal__actions{display:flex;justify-content:flex-end;gap:12px;padding-top:8px}
    .reschedule-modal__btn{padding:10px 16px;border-radius:10px;border:1px solid #cbd5f5;background:#fff;color:#0f172a;font-weight:700;cursor:pointer;transition:background .2s ease,transform .2s ease}
    .reschedule-modal__btn--primary{background:#4338ca;color:#fff;border-color:#4338ca}
    .reschedule-modal__btn:disabled{opacity:.6;cursor:not-allowed}
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
    .pay-modal__hint{margin-top:6px;font-size:13px;color:#047857;font-weight:600}
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

    /* Reclamo de pago */
    .claim-panel{margin:12px 0 24px;border:1px solid #fee2e2;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(248,113,113,0.08)}
    .claim-panel__header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#fef2f2;border-bottom:1px solid #fee2e2}
    .claim-panel__title{display:flex;flex-direction:column;gap:4px}
    .claim-panel__subtitle{margin:0;font-size:12px;color:#9f1239}
    .claim-panel__close{background:none;border:none;cursor:pointer;color:#dc2626;font-weight:700}
    .claim-panel__body{padding:14px}
    .claim-panel__context{font-size:13px;color:#334155;margin-bottom:12px;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #e2e8f0}
    .claim-panel__label{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;font-size:14px;color:#0f172a}
    .claim-panel__label select,
    .claim-panel__label textarea{border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font-size:14px}
    .claim-panel__actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
    .claim-panel__error{margin-top:8px;color:#b91c1c;font-size:13px}
    .btn{border:none;border-radius:8px;padding:10px 12px;cursor:pointer;font-weight:600}
    .btn.primary{background:#dc2626;color:#fff}
    .btn.primary:disabled{opacity:.6;cursor:not-allowed}
    .btn.ghost{background:#fff;border:1px solid #e5e7eb;color:#475569}
    .chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:700}
    .chip--danger{background:#fee2e2;color:#b91c1c}
    .claim-success{margin:12px 0 24px;padding:24px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:12px;text-align:center}
    .claim-success__icon{width:48px;height:48px;border-radius:50%;background:#22c55e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 8px}

    /* Anchor/highlight al llegar desde notificaciones */
    .appt-anchor{scroll-margin-top:96px}
    .appt-anchor--highlight{
      outline: 2px solid #22c55e;
      box-shadow: 0 0 0 6px rgba(34,197,94,0.14);
      border-radius: 16px;
    }
    /* =========================
       Mobile/Tablet (<=1024px)
       Solo visual: mantener desktop intacto
       ========================= */
    @media (max-width: 1024px){
      .reservas-page{
        background:#f3f4f6;
        padding:16px;
        max-width:520px;
        margin:0 auto;
        min-height:100vh;
      }
      .title{
        font-size:24px;
        margin:0 0 12px;
        color:#111827;
      }
      /* Space between cards like mock */
      .content{
        margin-top:16px;
        display:flex;
        flex-direction:column;
        gap:16px;
      }
      /* Banners más compactos */
      .reschedule-banner{
        margin:12px 0;
        padding:12px;
        border-radius:16px;
        gap:10px;
      }
      .reschedule-banner__title{font-size:13px}
      .reschedule-banner__text{font-size:13px}
      .reschedule-btn{padding:8px 12px}
    }
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
  tabBadges: Array<number | null> = [null, null, null, null, null];
  highlightAppointmentId: number | null = null;
  private focusAppointmentId: number | null = null;

  private resolveAvatar(raw?: string | null): string {
    if (!raw || raw.trim() === '') return '/assets/default-avatar.png';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/uploads')) return `${environment.apiBaseUrl}${raw}`;
    return `${environment.apiBaseUrl}/${raw.replace(/^\//, '')}`;
  }

  private processOneclickReturn(tbkToken: string, appointmentId: number) {
    console.log('[RESERVAS][ONECLICK] Processing return', { tbkToken: tbkToken ? `${tbkToken.substring(0,8)}...` : '', appointmentId });
    this.ocReturnProcessing = true;
    this.ocReturnError = null;
    if (!appointmentId) {
      console.error('[RESERVAS][ONECLICK] Falta appointmentId para autorizar');
      this.ocReturnProcessing = false;
      this.ocReturnError = 'Falta appointmentId para completar el pago.';
      this.router.navigate([], { queryParams: { tbk_token: null, appointmentId: null }, queryParamsHandling: 'merge' });
      return;
    }
    // 1) Finish inscription to save tbk_user
    this.payments.ocFinishInscription(tbkToken, appointmentId, this.loadOcPendingUsername() || undefined).subscribe({
      next: (finishResp) => {
        console.log('[RESERVAS][ONECLICK] Finish inscription OK', finishResp);
        this.tbkNeedsInscription = false;
        // 2) Authorize payment for the appointment
        // Pasamos tbk_user/username devueltos por finish para evitar race si DB aún no replica
        const tbk_user = (finishResp as any)?.inscription?.tbk_user || (finishResp as any)?.inscription?.tbkUser;
        const username =
          (finishResp as any)?.inscription?.username ||
          this.loadOcPendingUsername() ||
          undefined;
        this.payments.ocAuthorize(appointmentId, tbk_user, username).subscribe({
          next: (authResp) => {
            console.log('[RESERVAS][ONECLICK] Authorization OK', authResp);
            this.ocReturnProcessing = false;
            this.loadAppointments();
            this.clearOcPendingAppt();
            this.router.navigate([], { queryParams: { tbk_token: null, appointmentId: null }, queryParamsHandling: 'merge' });
          },
          error: (err) => {
            const tbkData = (err as any)?.error?.tbkData || (err as any)?.error?.details || (err as any)?.error;
            console.error('[RESERVAS][ONECLICK] Authorization error', err, tbkData);
            if (tbkData) {
              console.error('[RESERVAS][ONECLICK] Authorization tbkData detail:', JSON.stringify(tbkData));
            }
            this.ocReturnProcessing = false;
            this.ocReturnError = err?.error?.error || 'No se pudo autorizar el pago.';
            this.loadAppointments();
            this.clearOcPendingAppt();
            this.router.navigate([], { queryParams: { tbk_token: null, appointmentId: null }, queryParamsHandling: 'merge' });
          }
        });
      },
      error: (err) => {
        console.error('[RESERVAS][ONECLICK] Finish inscription error', err);
        this.ocReturnProcessing = false;
        this.ocReturnError = err?.error?.error || 'No se pudo finalizar la inscripción.';
        this.loadAppointments();
        this.clearOcPendingAppt();
        this.router.navigate([], { queryParams: { tbk_token: null, appointmentId: null }, queryParamsHandling: 'merge' });
      }
    });
  }

  private loadOcPendingAppt(): string | null {
    try {
      return sessionStorage.getItem(this.ocPendingKey);
    } catch {
      return null;
    }
  }

  private clearOcPendingAppt(): void {
    try {
      sessionStorage.removeItem(this.ocPendingKey);
      sessionStorage.removeItem(this.ocPendingUsernameKey);
    } catch {}
  }

  private loadOcPendingUsername(): string | null {
    try {
      return sessionStorage.getItem(this.ocPendingUsernameKey);
    } catch {
      return null;
    }
  }

  private loadClientConfirmedFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.clientConfirmedKey);
      if (!raw) {
        this.clientConfirmedSet = new Set<number>();
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
        this.clientConfirmedSet = new Set<number>(clean);
      }
    } catch {
      this.clientConfirmedSet = new Set<number>();
    }
  }

  private persistClientConfirmed(): void {
    try {
      const arr = Array.from(this.clientConfirmedSet.values());
      localStorage.setItem(this.clientConfirmedKey, JSON.stringify(arr));
    } catch {}
  }

  private markClientConfirmed(apptId: number): void {
    if (!Number.isFinite(apptId) || apptId <= 0) return;
    this.clientConfirmedSet.add(apptId);
    this.persistClientConfirmed();
  }

  private clearClientConfirmed(apptId: number): void {
    if (!Number.isFinite(apptId) || apptId <= 0) return;
    if (this.clientConfirmedSet.has(apptId)) {
      this.clientConfirmedSet.delete(apptId);
      this.persistClientConfirmed();
    }
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
  quotesCount: number | null = null;
  private quotesCounters: Record<ClientQuoteTabId, number> | null = null;
  private favoritesSet: Set<number> = new Set<number>();

  private appointmentIndex = new Map<number, (AppointmentDto & any)>();
  rescheduleRequestsForRespond: Array<AppointmentDto & any> = [];
  rescheduleRequestsOutgoing: Array<AppointmentDto & any> = [];
  rescheduleActionLoadingId: number | null = null;
  showRescheduleModal = false;
  rescheduleForm: {
    appointmentId: number | null;
    date: string;
    time: string;
    reason: string;
    loading: boolean;
    error: string;
    isLate: boolean;
    originalDate: string;
    originalTime: string;
  } = {
    appointmentId: null,
    date: '',
    time: '',
    reason: '',
    loading: false,
    error: '',
    isLate: false,
    originalDate: '',
    originalTime: ''
  };

  // Estado del modal de reseñas
  showReviewModal = false;
  reviewWorkerName = '';
  reviewServiceName = '';
  reviewAppointmentId = '';

  // Reclamos de pago (estado por cita)
  claimViewState: Record<number, 'details' | 'claim' | 'success'> = {};
  claimSlaText = '24–48 horas hábiles';
  claimData: Record<number, {
    reason: string;
    description: string;
    evidenceText?: string;
    confirmTruth?: boolean;
    confirmChargebackInfo?: boolean;
    loading?: boolean;
    error?: string;
    ticketId?: string;
  }> = {};

  // Mapa local: appointmentId -> providerId (para Contactar)
  private _providerByApptId: Record<number, number> = {};
  // Pref. de pago y modal
  clientPaymentPref: 'card'|'cash'|null = null;
  showPayMethodModal = false;
  payModalApptId: number | null = null;
  cashCap = 150000;
  private readonly clpFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  payModalLoading = false;
  payModalInscribing = false;
  tbkInfoByProvider: Record<number, { code: string | null; status: string; email: string | null }> = {};
  tbkClientProfile: { tbk_user?: string | null; username?: string | null } | null = null;
  tbkNeedsInscription = false;
  ocReturnProcessing = false;
  ocReturnError: string | null = null;
  private readonly ocPendingKey = 'adomi_oc_pending_appt';
  private readonly ocPendingUsernameKey = 'adomi_oc_pending_username';
  private readonly clientConfirmedKey = 'adomi_client_confirmed_services';
  private clientConfirmedSet = new Set<number>();
  finalizeModal = {
    open: false,
    appointmentId: null as number | null,
    submitting: false,
    error: ''
  };
  reportModal = {
    open: false,
    appointmentId: null as number | null,
    reason: '',
    evidenceText: '',
    submitting: false,
    error: ''
  };

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

  onQuotesCounters(counters: Record<ClientQuoteTabId, number>) {
    this.quotesCounters = counters;
    const total = Object.values(counters || {}).reduce((sum, value) => sum + (value || 0), 0);
    this.quotesCount = total > 0 ? total : null;
    this.tabBadges = [
      this.tabBadges[0] ?? null,
      this.tabBadges[1] ?? null,
      this.tabBadges[2] ?? null,
      this.tabBadges[3] ?? null,
      this.quotesCount
    ];
  }

  ngOnInit(): void {
    // Deep-link desde notificaciones: /client/reservas?focusAppointmentId=123
    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('focusAppointmentId');
      const id = raw ? Number(raw) : NaN;
      if (Number.isFinite(id) && id > 0) {
        this.focusAppointmentId = id;
        this.tryFocusAppointment();
      }
    });

    this.loadClientConfirmedFromStorage();
    this.validateProfile();
    // Preferencia de pago del cliente
    try { this.clientProfile.getPaymentPreference().subscribe({ next: (res:any) => this.clientPaymentPref = (res?.preference ?? null) as any, error: () => this.clientPaymentPref = null }); } catch {}
    // Si venimos de Oneclick (TBK_TOKEN) o Stripe success/cancel, procesar query y luego cargar
    const tbkToken = this.route.snapshot.queryParamMap.get('tbk_token');
    const appointmentIdOc = Number(this.route.snapshot.queryParamMap.get('appointmentId') || this.loadOcPendingAppt());
    const appointmentId = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (tbkToken && appointmentIdOc) {
      this.processOneclickReturn(tbkToken, appointmentIdOc);
      return;
    }
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
        metadata: {
          appointmentId: String((appt as any).id),
          appointmentDate: String((appt as any).date || '').includes('T')
            ? String((appt as any).date).split('T')[0]
            : String((appt as any).date || ''),
          appointmentTime: String((appt as any).start_time || (appt as any).appointment_time || '').slice(0, 5),
          serviceName: (appt as any).service_name || (appt as any).serviceName || null,
          providerName: (appt as any).provider_name || (appt as any).providerName || null,
          location: (appt as any).client_location || (appt as any).client_location_label || (appt as any).location || null
        }
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
        const list = (resp.appointments || []) as (AppointmentDto & {
          provider_name?: string;
          service_name?: string;
          price?: number;
          payment_status?: 'unpaid'|'paid'|'succeeded'|'pending'|'completed';
          reschedule_requested_by?: 'none'|'client'|'provider';
          reschedule_target_date?: string | null;
          reschedule_target_start_time?: string | null;
          reschedule_reason?: string | null;
        })[];
        console.log('[RESERVAS] Citas cargadas:', list);
        console.log('[RESERVAS] Precios en datos:', list.map(a => ({ id: a.id, price: a.price, service_name: a.service_name })));
        console.log('[RESERVAS] Estado de pago por cita:', list.map(a => ({ id: a.id, payment_status: (a as any).payment_status, status: a.status })));
        console.log('[RESERVAS][TRACE] raw statuses:', list.map(a => ({
          id: a.id,
          status: a.status,
          service_state: (a as any).service_completion_state,
          payment_status: (a as any).payment_status,
          date: a.date,
          start: a.start_time
        })));
        this.appointmentIndex = new Map();
        list.forEach(entry => this.appointmentIndex.set(Number(entry.id), entry as any));
        const pendingReschedules = list.filter(a => a.status === 'pending_reschedule');
        this.rescheduleRequestsForRespond = pendingReschedules.filter(a => String(a.reschedule_requested_by) === 'provider') as any;
        this.rescheduleRequestsOutgoing = pendingReschedules.filter(a => String(a.reschedule_requested_by) === 'client') as any;
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
        console.log('[RESERVAS][TRACE] buckets', {
          upcoming: upcoming.length,
          past: past.length,
          completed: realizadasCompletadas.length,
          cancelled: cancelled.length
        });

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
            const rawPayment = String((a as any).payment_status || '').toLowerCase();
            const isPaid = ['paid', 'succeeded', 'completed'].includes(rawPayment) || !!(a as any).verification_code;
            console.log(`[RESERVAS] Mapping confirmed appt #${a.id}: payment_status="${rawPayment}", isPaid=${isPaid}, date="${a.date}", price=${a.price}, rawPrice=${JSON.stringify(a.price)}`);
            const paymentPreference = ((a as any).payment_method || null) as 'card'|'cash'|null;
            const serviceCompletionState = String((a as any).service_completion_state || 'none') as ProximaCitaData['serviceCompletionState'];
            const disputePending = String(a.status) === 'dispute_pending' || serviceCompletionState === 'dispute_pending';
            const clientConfirmedLocal = this.clientConfirmedSet.has(a.id);
            const clientConfirmed = clientConfirmedLocal || serviceCompletionState === 'client_confirmed' || serviceCompletionState === 'auto_completed';
            const limitReached = Number(a.client_reschedule_count || 0) >= 1;
            const allowReprogram = !limitReached && !isPaid; // permitir reprogramar/cancelar mientras no esté pagada
            const reprogramDisabledReason = !allowReprogram
              ? (limitReached
                ? 'Ya utilizaste la reprogramación disponible para esta cita.'
                : 'No puedes reprogramar una cita pagada.')
              : undefined;
            if (isPaid) {
              this.clearClientConfirmed(a.id);
            }
            const readyToPay = !isPaid; // mostrar selector de pago siempre que no esté pagado
            const canConfirmService = !isPaid && !clientConfirmed && !disputePending;
            const canFinalize = false;
            const canReport = paymentPreference === 'card' && (clientConfirmed || isPaid) && !disputePending;
            const subtitle = disputePending
              ? 'En revisión'
              : (isPaid
                ? 'Cita pagada'
                : (clientConfirmed ? 'Servicio confirmado (pago pendiente)' : 'Confirmada (falta tu confirmación)'));
            const paymentStatusLabel = isPaid
              ? 'Pago confirmado por el cliente (liberado)'
              : (disputePending
                ? 'Pago en revisión por reclamo del cliente'
                : (clientConfirmed ? 'Pago pendiente de procesar (cliente confirmó)' : 'Pago pendiente de confirmación del cliente'));

            const card: ProximaCitaData & { verification_code?: string } = {
              titulo: `${a.service_name || 'Servicio'} con ${a.provider_name || 'Profesional'}`,
              subtitulo: subtitle,
              fecha: this.formatDate(a.date),
              hora: this.formatTime(a.start_time),
              appointmentDate: String(a.date || '').slice(0, 10),
              appointmentTime: String(a.start_time || '').trim(),
              diasRestantes: this.daysFromToday(a.date, a.start_time),
              mostrarPagar: readyToPay,
              clientConfirmed,
              appointmentId: a.id,
              successHighlight: isPaid,
              precio: Number(a.price || 30000), // Valor por defecto para testing
              paymentPreference,
              verification_code: (a as any).verification_code || undefined,
              cashCap: this.cashCap,
              cashCapLabel: this.cashCapCurrency,
              allowReprogram,
              reprogramDisabledReason,
              serviceCompletionState,
              disputePending,
              canFinalize,
              canReport,
              canConfirmService,
              paymentStatus: rawPayment as any,
              paymentStatusLabel
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
          });

        // Todas las próximas pendientes
        this.pendientesList = upcoming
          .filter(a => a.status === 'scheduled')
          .map(a => ({
            titulo: `${a.service_name || 'Servicio'} con ${a.provider_name || 'Profesional'}`,
            fecha: this.formatDate(a.date),
            hora: this.formatTime(a.start_time),
            appointmentId: Number((a as any).id || a.id || 0) || null
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
            providerId: Number((c as any).provider_id || 0) || null,
            serviceId: Number((c as any).service_id || 0) || null,
            appointmentId: Number((c as any).id || 0) || null,
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
              pillText,
              appointmentId: Number((c as any).id || c.id || 0) || null
            };
          });

        // Pagadas/Realizadas: incluir completadas o pagadas
        const isPaidStatus = (s: any) => ['paid','succeeded','completed'].includes(String(s || '').toLowerCase());
        const realizadasAll = list
          .filter(r => {
            if (r.status === 'completed') return true;
            const completionState = String((r as any).service_completion_state || 'none');
            return ['client_confirmed','auto_completed','completed_refunded'].includes(completionState);
          })
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
        this.tabBadges = [upcomingCount || null, pastCount || null, cancelledCount || null, realizadasCount || null, this.quotesCount || null];

        // Si venimos desde una notificación, intentar enfocar la cita ahora que ya está todo mapeado
        this.tryFocusAppointment();
      },
      error: (err) => {
        console.error('Error cargando citas del cliente', err);
      }
    });
  }

  private findTabForAppointment(appointmentId: number): number | null {
    if (!Number.isFinite(appointmentId) || appointmentId <= 0) return null;
    if ((this.proximasConfirmadas || []).some(x => x.appointmentId === appointmentId)) return 0;
    if ((this.pendientesList || []).some(x => Number((x as any).appointmentId) === appointmentId)) return 0;
    if ((this.canceladasClienteList || []).some(x => Number((x as any).appointmentId) === appointmentId)) return 2;
    if ((this.canceladasProfesionalList || []).some(x => Number((x as any).appointmentId) === appointmentId)) return 2;
    if ((this.realizadasList || []).some(x => Number((x as any).appointmentId) === appointmentId)) return 3;
    return null;
  }

  private tryFocusAppointment(): void {
    const id = this.focusAppointmentId;
    if (!id) return;

    const targetTab = this.findTabForAppointment(id);
    if (typeof targetTab === 'number') {
      this.activeTab = targetTab;
    }

    // Esperar render del DOM del tab, y luego scrollear por anchor id
    this.scrollToAppointment(id, 0);
  }

  private scrollToAppointment(appointmentId: number, attempt: number): void {
    if (!appointmentId) return;
    if (attempt > 12) return;
    try {
      const el = typeof document !== 'undefined' ? document.getElementById(`appt-${appointmentId}`) : null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.highlightAppointmentId = appointmentId;
        setTimeout(() => {
          if (this.highlightAppointmentId === appointmentId) this.highlightAppointmentId = null;
        }, 3500);
        // limpiar param para que no vuelva a “re-enfocar” en cada refresh
        this.router.navigate([], {
          queryParams: { focusAppointmentId: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        }).catch(() => {});
        this.focusAppointmentId = null;
        return;
      }
    } catch {}

    setTimeout(() => this.scrollToAppointment(appointmentId, attempt + 1), 150);
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
  private normalizeDateValue(value: any): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    const raw = String(value).trim();
    if (!raw) return null;
    if (raw.includes('T')) {
      return raw.split('T')[0];
    }
    return raw.slice(0, 10);
  }
  private normalizeTimeValue(value: any): string | null {
    if (!value && value !== 0) return null;
    if (value instanceof Date) {
      return value.toISOString().slice(11, 16);
    }
    const raw = String(value).trim();
    if (!raw) return null;
    return raw.slice(0, 5);
  }
  private daysFromToday(dateIso: string, startTime?: string | null): number {
    if (!dateIso || typeof dateIso !== 'string') return 0;

    // Normalizar fecha (ignorando timezone de cadenas ISO)
    const baseDate = (dateIso.includes('T') ? dateIso.split('T')[0] : dateIso).slice(0, 10);
    const [y, m, d] = baseDate.split('-').map(Number);
    if (!y || !m || !d) return 0;

    const { hour, minute } = this.parseTimeParts(startTime);
    const target = new Date(y, m - 1, d, hour, minute, 0, 0);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private parseTimeParts(timeStr?: string | null): { hour: number; minute: number } {
    if (!timeStr) return { hour: 0, minute: 0 };
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    const hour = Number.isFinite(parts[0]) ? parts[0] : 0;
    const minute = Number.isFinite(parts[1]) ? parts[1] : 0;
    return { hour, minute };
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

  private parseEvidenceInput(value: string): string[] {
    if (!value) return [];
    return value
      .split(/[\n,]/g)
      .map(v => v.trim())
      .filter(Boolean);
  }

  onPagar(appointmentId: number) {
    const card = (this.proximasConfirmadas || []).find(c => c.appointmentId === appointmentId);
    if (card && !card.clientConfirmed && !card.successHighlight && !card.verification_code) {
      this.notifications.createNotification({
        type: 'system',
        profile: 'client',
        title: 'Confirma el servicio',
        message: 'Primero confirma que el servicio se realizó para habilitar el pago.',
        priority: 'medium',
        actions: []
      });
      return;
    }
    this.payModalApptId = appointmentId || null;
    this.showPayMethodModal = true;
    // Traer info TBK hijo para habilitar pago con tarjeta (Oneclick Mall)
    if (appointmentId) {
      const providerId = this._providerByApptId[appointmentId];
      if (providerId) {
        this.payments.getTbkSecondaryInfo(providerId, appointmentId).subscribe({
          next: (resp) => {
            if (resp?.success) {
              this.tbkInfoByProvider[providerId] = resp.tbk;
              console.log('[TBK][PAY_MODAL] secondary info', { providerId, appointmentId, tbk: resp.tbk });
            }
          },
          error: (err) => {
            console.warn('[TBK][PAY_MODAL] secondary info error', { providerId, appointmentId, err });
          }
        });
      }
      // Perfil Oneclick del cliente
      this.payments.ocProfile().subscribe({
        next: (resp) => {
          this.tbkClientProfile = resp || null;
          this.tbkNeedsInscription = !resp?.tbk_user;
          console.log('[TBK][PAY_MODAL] client oc profile', resp);
        },
        error: (err) => {
          console.warn('[TBK][PAY_MODAL] oc profile error', err);
          this.tbkNeedsInscription = true;
        }
      });
    }
    // Evitar redirección automática a Stripe en reintentos: no llames createCheckoutSession aquí
  }

  onPagarEfectivo(appointmentId: number) {
    if (!appointmentId || this.payModalLoading) return;
    const apptId = appointmentId;
    const card = (this.proximasConfirmadas || []).find(c => c.appointmentId === apptId);
    if (card && !card.clientConfirmed && !card.successHighlight && !card.verification_code) {
      this.notifications.createNotification({
        type: 'system',
        profile: 'client',
        title: 'Confirma el servicio',
        message: 'Primero confirma que el servicio se realizó para habilitar el pago.',
        priority: 'medium',
        actions: []
      });
      return;
    }
    this.payModalLoading = true;
    // Marcar la cita como pago en efectivo y obtener código
    this.payments.selectCash(apptId).subscribe({
      next: (res) => {
        this.setCashCapFromResponse((res as any)?.cashCap);
        const code = String((res as any)?.code || '').trim();
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
        this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => (
          card.appointmentId === apptId
            ? { ...card, paymentPreference: 'cash', mostrarPagar: false, verification_code: code || (card as any).verification_code, cashCap: this.cashCap, cashCapLabel: this.cashCapCurrency }
            : card
        ));
        this.appointments.getVerificationCode(apptId).subscribe({
          next: (vc) => {
            if (vc?.success && vc?.code) {
              this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => (
                card.appointmentId === apptId ? { ...card, verification_code: vc.code } : card
              ));
            }
          },
          error: () => {}
        });
        this.clientPaymentPref = 'cash';
        this.payModalLoading = false;
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

  openFinalizeModal(appointmentId?: number | null) {
    if (!appointmentId) return;
    this.finalizeModal = {
      open: true,
      appointmentId: Number(appointmentId),
      submitting: false,
      error: ''
    };
  }

  closeFinalizeModal() {
    this.finalizeModal = {
      open: false,
      appointmentId: null,
      submitting: false,
      error: ''
    };
  }

  confirmFinalizeService(): void {
    if (!this.finalizeModal.appointmentId || this.finalizeModal.submitting) return;
    this.finalizeModal.submitting = true;
    this.finalizeModal.error = '';
    this.appointments.completeService(this.finalizeModal.appointmentId).subscribe({
      next: () => {
        const apptId = this.finalizeModal.appointmentId!;
        this.markClientConfirmed(apptId);
        console.log('[RESERVAS][FINALIZE] confirmed service', { apptId });
        this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => (
          card.appointmentId === apptId
            ? {
                ...card,
                clientConfirmed: true,
                canConfirmService: false,
                mostrarPagar: !card.successHighlight && !card.verification_code,
                subtitulo: 'Servicio confirmado (pago pendiente)',
                paymentStatusLabel: 'Pago pendiente de confirmación del cliente'
              }
            : card
        ));
        this.notifications.createNotification({
          type: 'appointment',
          profile: 'client',
          title: 'Servicio confirmado',
          message: 'Gracias por confirmar. Ahora puedes completar el pago al profesional.',
          priority: 'low',
          actions: []
        });
        this.closeFinalizeModal();
        this.loadAppointments();
      },
      error: (err) => {
        this.finalizeModal.submitting = false;
        const code = err?.error?.error;
        if (err?.status === 409 && code === 'TOO_EARLY') {
          this.finalizeModal.error = 'Aún no puedes confirmar el servicio hasta que llegue la fecha y la hora agendada.';
        } else {
          this.finalizeModal.error = err?.error?.message || code || 'No pudimos confirmar el servicio. Intenta nuevamente.';
        }
      }
    });
  }

  openReportModal(appointmentId?: number | null): void {
    if (!appointmentId) return;
    this.reportModal = {
      open: true,
      appointmentId: Number(appointmentId),
      reason: '',
      evidenceText: '',
      submitting: false,
      error: ''
    };
  }

  getClaimState(appointmentId: number | null | undefined): 'details' | 'claim' | 'success' {
    if (!appointmentId) return 'details';
    return this.claimViewState[appointmentId] || 'details';
  }

  getClaimData(appointmentId: number | null | undefined) {
    if (!appointmentId) return { reason: '', description: '' };
    this.ensureClaimData(appointmentId);
    return this.claimData[appointmentId];
  }

  canPayWithCard(appointmentId: number | null): boolean {
    if (!appointmentId) return false;
    const providerId = this._providerByApptId[appointmentId];
    if (!providerId) return false;
    const info = this.tbkInfoByProvider[providerId];
    if (!info?.code) return false;
    if (this.tbkNeedsInscription) return false;
    return true;
  }

  startOcInscription() {
    if (!this.payModalApptId || this.payModalInscribing) return;
    this.payModalInscribing = true;
    const apptId = this.payModalApptId;
    try { sessionStorage.setItem(this.ocPendingKey, String(apptId)); } catch {}
    // Usa la URL de retorno configurada en backend (TBK_ONECLICK_RETURN_URL); si quieres override, pásala aquí.
    this.payments.ocStartInscription(apptId, undefined, undefined).subscribe({
      next: (resp) => {
        this.payModalInscribing = false;
        if (resp?.success && resp?.url_webpay && resp?.token) {
          const pendingUsername = (resp as any)?.username || (resp as any)?.userName || '';
          try { sessionStorage.setItem(this.ocPendingUsernameKey, pendingUsername); } catch {}
          try {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = String(resp.url_webpay);
            form.style.display = 'none';
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'TBK_TOKEN';
            input.value = String(resp.token);
            form.appendChild(input);
            console.log('[RESERVAS] Enviando TBK_TOKEN a Webpay Oneclick', resp.token);
            document.body.appendChild(form);
            form.submit();
          } catch (e) {
            console.error('[RESERVAS] Error redirigiendo a Webpay Oneclick', e);
            window.location.href = String(resp.url_webpay);
          }
        } else {
          console.error('[RESERVAS] ocStartInscription sin url_webpay/token', resp);
        }
      },
      error: (err) => {
        this.payModalInscribing = false;
        console.error('[RESERVAS] Error iniciando inscripción Oneclick', err);
      }
    });
  }

  private ensureClaimData(appointmentId: number) {
    if (!this.claimData[appointmentId]) {
      this.claimData[appointmentId] = {
        reason: '',
        description: '',
        evidenceText: '',
        confirmTruth: false,
        confirmChargebackInfo: false
      };
    }
  }

  openClaimFlow(appointmentId?: number | null): void {
    if (!appointmentId) return;
    this.ensureClaimData(appointmentId);
    this.claimData[appointmentId].error = '';
    this.claimData[appointmentId].loading = false;
    this.claimViewState[appointmentId] = 'claim';
  }

  closeClaim(appointmentId?: number | null): void {
    if (!appointmentId) return;
    this.claimData[appointmentId] = {
      reason: '',
      description: '',
      evidenceText: '',
      confirmTruth: false,
      confirmChargebackInfo: false
    };
    this.claimViewState[appointmentId] = 'details';
  }

  resetClaim(appointmentId?: number | null): void {
    this.closeClaim(appointmentId);
  }

  submitClaim(appointmentId?: number | null): void {
    if (!appointmentId) return;
    this.ensureClaimData(appointmentId);
    const claim = this.claimData[appointmentId];
    if (!claim.reason || claim.reason.trim().length < 3) {
      this.claimData[appointmentId].error = 'Selecciona un motivo válido.';
      return;
    }
    const descLen = (claim.description || '').trim().length;
    const needsDesc = new Set([
      'fraude_no_reconozco',
      'proveedor_no_show',
      'servicio_no_prestado',
      'servicio_incompleto',
      'cancelacion_proveedor',
      'cancelacion_fallida',
      'otro'
    ]);
    if (needsDesc.has(claim.reason) && descLen < 10) {
      this.claimData[appointmentId].error = 'Cuéntanos el detalle (mínimo 10 caracteres).';
      return;
    }
    if (!claim.confirmTruth || !claim.confirmChargebackInfo) {
      this.claimData[appointmentId].error = 'Debes confirmar las casillas antes de enviar.';
      return;
    }
    claim.loading = true;
    claim.error = '';
    const evidenceUrls = this.parseEvidenceInput(claim.evidenceText || '');
    this.appointments.reportPaymentClaim(appointmentId, {
      reason: claim.reason,
      description: claim.description || '',
      evidenceUrls
    }).subscribe({
      next: (resp) => {
        this.claimData[appointmentId].ticketId = resp?.ticketId || undefined;
        this.claimViewState[appointmentId] = 'success';
      },
      error: (err) => {
        this.claimData[appointmentId].loading = false;
        this.claimData[appointmentId].error = err?.error?.error || 'No pudimos registrar el reclamo. Intenta nuevamente.';
      },
      complete: () => {
        this.claimData[appointmentId].loading = false;
      }
    });
  }

  closeReportModal(): void {
    this.reportModal = {
      open: false,
      appointmentId: null,
      reason: '',
      evidenceText: '',
      submitting: false,
      error: ''
    };
  }

  submitReport(): void {
    if (!this.reportModal.appointmentId || this.reportModal.submitting) return;
    const reason = (this.reportModal.reason || '').trim();
    if (reason.length < 10) {
      this.reportModal.error = 'Describe el problema con al menos 10 caracteres.';
      return;
    }
    const evidenceUrls = this.parseEvidenceInput(this.reportModal.evidenceText);
    this.reportModal.submitting = true;
    this.reportModal.error = '';
    this.appointments.reportNoShow(this.reportModal.appointmentId, { reason, evidenceUrls }).subscribe({
      next: () => {
        this.notifications.createNotification({
          type: 'system',
          profile: 'client',
          title: 'Reporte recibido',
          message: 'Gracias por informarnos. Revisaremos el caso y te avisaremos.',
          priority: 'medium',
          actions: []
        });
        this.closeReportModal();
        this.loadAppointments();
      },
      error: (err) => {
        this.reportModal.submitting = false;
        this.reportModal.error = err?.error?.error || 'No pudimos registrar el reporte. Intenta nuevamente.';
      }
    });
  }

  onRequestReschedule(appointmentId?: number | null): void {
    if (!appointmentId) {
      return;
    }
    this.openRescheduleModal(Number(appointmentId));
  }

  respondReschedule(appointmentId: number, decision: 'accept'|'reject'): void {
    if (!appointmentId) return;
    const appt = this.appointmentIndex.get(Number(appointmentId));
    if (!appt) return;
    if (this.rescheduleActionLoadingId === appointmentId) return;
    if (decision === 'reject') {
      const confirmReject = window.confirm('¿Seguro que deseas rechazar la reprogramación propuesta?');
      if (!confirmReject) {
        return;
      }
    }
    let reason: string | null = null;
    if (decision === 'reject') {
      const input = window.prompt('Motivo (opcional)');
      reason = input && input.trim().length ? input.trim() : null;
    }
    this.rescheduleActionLoadingId = appointmentId;
    this.appointments.respondReschedule(appointmentId, decision, { reason }).subscribe({
      next: (resp: any) => {
        this.rescheduleActionLoadingId = null;
        if (!resp?.success) {
          const msg = resp?.error || 'No se pudo procesar tu respuesta.';
          console.warn('[RESERVAS] respondReschedule sin success', resp);
          this.notifications.createNotification({
            type: 'appointment',
            title: 'No pudimos procesar tu respuesta',
            message: msg,
            priority: 'high',
            profile: 'client',
            actions: ['view'],
            metadata: { appointmentId: String(appointmentId) }
          });
          return;
        }
        this.loadAppointments();
        const requestedBy = String(appt.reschedule_requested_by || '');
        const acceptance = decision === 'accept';
        const title = acceptance ? 'Reprogramación confirmada' : 'Solicitud rechazada';
        const message = acceptance
          ? 'La reprogramación quedó confirmada.'
          : requestedBy === 'provider'
            ? 'Rechazaste la reprogramación propuesta. Se aplicarán las políticas de cancelación correspondientes.'
            : 'Se canceló la solicitud de reprogramación.';
        this.notifications.createNotification({
          type: 'appointment',
          title,
          message,
          priority: 'medium',
          profile: 'client',
          actions: ['view'],
          metadata: { appointmentId: String(appointmentId) }
        });
      },
      error: (err) => {
        this.rescheduleActionLoadingId = null;
        console.error('[RESERVAS] Error al responder reprogramación', err);
        this.notifications.createNotification({
          type: 'appointment',
          title: 'No pudimos procesar tu respuesta',
          message: err?.error?.error || 'Intenta nuevamente en unos minutos.',
          priority: 'high',
          profile: 'client',
          actions: ['view'],
          metadata: { appointmentId: String(appointmentId) }
        });
      }
    });
  }

  openRescheduleModal(appointmentId: number): void {
    const appt = this.appointmentIndex.get(Number(appointmentId));
    if (!appt) {
      this.notifications.createNotification({
        type: 'appointment',
        title: 'No encontramos la cita',
        message: 'Actualiza la página e inténtalo nuevamente.',
        priority: 'high',
        profile: 'client',
        actions: ['view']
      });
      return;
    }
    if (String(appt.status) === 'pending_reschedule') {
      this.notifications.createNotification({
        type: 'appointment',
        title: 'Solicitud en curso',
        message: 'Ya existe una solicitud de reprogramación esperando respuesta.',
        priority: 'medium',
        profile: 'client',
        actions: ['view'],
        metadata: { appointmentId: String(appointmentId) }
      });
      return;
    }
    if (Number(appt.client_reschedule_count || 0) >= 1) {
      this.notifications.createNotification({
        type: 'appointment',
        title: 'Límite alcanzado',
        message: 'Solo puedes reprogramar una vez por cita. Cancela si necesitas cambiar nuevamente.',
        priority: 'medium',
        profile: 'client',
        actions: ['view'],
        metadata: { appointmentId: String(appointmentId) }
      });
      return;
    }
    // Permitir reprogramar aunque el pago esté pendiente
    const defaultDate = this.normalizeDateValue(appt.reschedule_target_date || appt.date);
    const defaultTime = this.normalizeTimeValue(appt.reschedule_target_start_time || appt.start_time);

    this.rescheduleForm.appointmentId = Number(appointmentId);
    this.rescheduleForm.date = defaultDate || '';
    this.rescheduleForm.time = defaultTime || '';
    this.rescheduleForm.reason = '';
    this.rescheduleForm.loading = false;
    this.rescheduleForm.error = '';
    this.rescheduleForm.originalDate = this.formatDate(appt.date || '');
    this.rescheduleForm.originalTime = this.formatTime(appt.start_time || '');
    this.rescheduleForm.isLate = false;
    this.showRescheduleModal = true;
    this.updateRescheduleLateFlag();
  }

  closeRescheduleModal(): void {
    // Permitir cerrar aunque esté en loading para evitar bloqueo en fallas
    this.rescheduleForm.loading = false;
    this.showRescheduleModal = false;
    this.rescheduleActionLoadingId = null;
    this.rescheduleForm = {
      appointmentId: null,
      date: '',
      time: '',
      reason: '',
      loading: false,
      error: '',
      isLate: false,
      originalDate: '',
      originalTime: ''
    };
  }

  updateRescheduleLateFlag(): void {
    if (!this.rescheduleForm.date || !this.rescheduleForm.time) {
      this.rescheduleForm.isLate = false;
      return;
    }
    const candidate = new Date(`${this.rescheduleForm.date}T${this.rescheduleForm.time}:00`);
    if (Number.isNaN(candidate.getTime())) {
      this.rescheduleForm.isLate = false;
      return;
    }
    this.rescheduleForm.isLate = (candidate.getTime() - Date.now()) < (24 * 60 * 60 * 1000);
  }

  submitReschedule(): void {
    if (!this.rescheduleForm.appointmentId || this.rescheduleForm.loading) {
      return;
    }
    if (!this.rescheduleForm.date || !this.rescheduleForm.time) {
      this.rescheduleForm.error = 'Selecciona una fecha y hora válidas.';
      return;
    }
    const payload = {
      date: this.rescheduleForm.date,
      start_time: this.rescheduleForm.time,
      reason: this.rescheduleForm.reason && this.rescheduleForm.reason.trim().length
        ? this.rescheduleForm.reason.trim()
        : null
    };

    this.rescheduleForm.loading = true;
    this.rescheduleForm.error = '';
    this.rescheduleActionLoadingId = this.rescheduleForm.appointmentId;

    this.appointments.requestReschedule(this.rescheduleForm.appointmentId, payload).subscribe({
      next: (resp: any) => {
        this.rescheduleForm.loading = false;
        if (!resp?.success) {
          console.warn('[RESERVAS] requestReschedule sin success', resp);
          const errCode = resp?.error;
          this.rescheduleForm.error = errCode === 'SLOT_TAKEN'
            ? 'Ese horario ya no está disponible (alguien ya lo tomó). Elige otro horario y vuelve a intentar.'
            : (errCode || 'No se pudo procesar la reprogramación.');
          this.rescheduleActionLoadingId = null;
          return;
        }
        const appointmentId = this.rescheduleForm.appointmentId!;
        const isLate = this.rescheduleForm.isLate;
        const message = isLate
          ? 'Enviamos tu solicitud al profesional. Te avisaremos cuando responda.'
          : 'Reprogramamos la cita al nuevo horario.';

        this.notifications.createNotification({
          type: 'appointment',
          title: isLate ? 'Solicitud enviada' : 'Cita reprogramada',
          message,
          priority: 'medium',
          profile: 'client',
          actions: ['view'],
          metadata: { appointmentId: String(appointmentId) }
        });

        this.closeRescheduleModal();
        this.rescheduleActionLoadingId = null;
        this.loadAppointments();
      },
      error: (err) => {
        this.rescheduleForm.loading = false;
        this.rescheduleActionLoadingId = null;
        console.error('[RESERVAS] Error al solicitar reprogramación', err);
        const errCode = err?.error?.error;
        this.rescheduleForm.error = err?.status === 409 && errCode === 'SLOT_TAKEN'
          ? 'Ese horario ya no está disponible (alguien ya lo tomó). Elige otro horario y vuelve a intentar.'
          : (errCode || 'No se pudo procesar la reprogramación.');
      }
    });
  }

  formatRescheduleLabel(appt: AppointmentDto & any): string {
    if (!appt) return '';
    const date = appt.reschedule_target_date || appt.date;
    const time = (appt.reschedule_target_start_time || appt.start_time || '').toString();
    const formattedDate = this.formatDate(date || '');
    const formattedTime = this.formatTime(time);
    return `${formattedDate} a las ${formattedTime}`;
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
    // Oneclick authorize (cliente)
    this.payments.ocAuthorize(apptId).subscribe({
      next: (resp) => {
        this.payModalLoading = false;
        this.closePayModal();
        console.log('[RESERVAS] ocAuthorize resp:', resp);
        if (resp?.success) {
          this.clearClientConfirmed(apptId);
          // Marcar la cita como pagada en UI
          this.proximasConfirmadas = (this.proximasConfirmadas || []).map(card => (
            card.appointmentId === apptId ? { ...card, successHighlight: true, mostrarPagar: false, clientConfirmed: true, paymentStatusLabel: 'Pago confirmado por el cliente (liberado)', subtitulo: 'Cita pagada' } : card
          ));
        } else {
          console.error('[RESERVAS] ocAuthorize sin success', resp);
        }
      },
      error: (err) => {
        this.payModalLoading = false;
        console.error('[RESERVAS] Error autorizando Oneclick', err);
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
        this.clearClientConfirmed(apptId);
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

  onRebookCancelled(card: CanceladaClienteData): void {
    if (!card) return;
    const providerId = card.providerId || null;
    const serviceId = card.serviceId || null;
    const extras = serviceId ? { queryParams: { serviceId } } : undefined;
    if (providerId) {
      this.router.navigate(['/client/explorar', providerId], extras);
      return;
    }
    this.router.navigate(['/client/explorar'], extras);
  }

  onFindSimilar(card: CanceladaProfesionalData): void {
    if (!card) {
      this.router.navigate(['/client/explorar']);
      return;
    }
    const serviceName = card.titulo ? String(card.titulo).split(' con ')[0] : '';
    const extras = serviceName ? { queryParams: { q: serviceName } } : undefined;
    this.router.navigate(['/client/explorar'], extras);
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
