import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../auth/services/session.service';
import { AdminPaymentsService } from '../admin-pagos/admin-payments.service';
import {
  SeguimientoAppointment,
  SeguimientoReminderRequest,
  SeguimientoCitasAppointmentCardComponent
} from './components/seguimiento-citas-appointment-card.component';
import { SeguimientoCitasReminderModalComponent } from './components/seguimiento-citas-reminder-modal.component';
import { SeguimientoCitasNoShowModalComponent } from './components/seguimiento-citas-no-show-modal.component';
import { SeguimientoCitasHistoryModalComponent } from './components/seguimiento-citas-history-modal.component';
import {
  SeguimientoCitasHistoryBoardComponent,
  SeguimientoHistoryEntry
} from './components/seguimiento-citas-history-board.component';

@Component({
  selector: 'app-seguimiento-citas',
  standalone: true,
  imports: [
    CommonModule,
    SeguimientoCitasAppointmentCardComponent,
    SeguimientoCitasReminderModalComponent,
    SeguimientoCitasNoShowModalComponent,
    SeguimientoCitasHistoryModalComponent,
    SeguimientoCitasHistoryBoardComponent
  ],
  templateUrl: './seguimiento-citas.component.html',
  styleUrls: ['./seguimiento-citas.component.scss']
})
export class SeguimientoCitasComponent implements OnInit {
  private session = inject(SessionService);
  private adminApi = inject(AdminPaymentsService);

  restricted = false;
  readonly adminEmail = 'juanpablojpw@gmail.com';
  readonly currentDateLabel = 'Marzo 01, 2026';
  activeTab: 'activas' | 'historial' = 'activas';
  loading = false;
  apiError: string | null = null;
  activeAppointmentsCount = 0;
  adminSecretInput = '';
  activePeopleTodayCount: number | null = null;
  activeAppointments: SeguimientoAppointment[] = [];
  private responseByAppointment: Record<number, boolean> = {};

  appointment: SeguimientoAppointment = this.emptyAppointment();

  reminderModal = {
    open: false,
    appointmentId: 0,
    target: '',
    channel: 'WhatsApp' as 'WhatsApp' | 'Correo',
    recipientType: 'client' as 'client' | 'provider',
    recipientEmail: '' as string | null,
    defaultSubject: '',
    defaultMessage: ''
  };
  reminderSending = false;
  reminderSendError: string | null = null;
  noShowModal = {
    open: false,
    providerName: ''
  };
  historyModalOpen = false;
  pendingCloseHistory: SeguimientoHistoryEntry[] = [];
  disputedHistory: SeguimientoHistoryEntry[] = [];
  closedHistory: SeguimientoHistoryEntry[] = [];

  ngOnInit(): void {
    const email = String(this.session.getUser()?.email || '').trim().toLowerCase();
    this.restricted = email !== this.adminEmail;
    const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin:secret') : '';
    const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('admin:secret') : '';
    this.adminSecretInput = String(fromSession || fromLocal || '').trim();
    this.responseByAppointment = this.loadResponseState();
    if (!this.restricted) {
      this.loadTrackingData();
    }
  }

  openReminder(payload: SeguimientoReminderRequest): void {
    const template = this.buildReminderTemplate(payload);
    this.reminderModal = {
      open: true,
      appointmentId: payload.appointmentId,
      target: payload.target,
      channel: payload.channel,
      recipientType: payload.recipientType,
      recipientEmail: payload.recipientEmail || null,
      defaultSubject: template.subject,
      defaultMessage: template.message
    };
    this.reminderSendError = null;
  }

  closeReminder(): void {
    this.reminderModal.open = false;
    this.reminderSending = false;
    this.reminderSendError = null;
  }

  confirmReminderSend(payload?: { subject?: string; message?: string }): void {
    if (this.reminderModal.channel !== 'Correo') {
      alert(`Exito: Recordatorio via ${this.reminderModal.channel} enviado a ${this.reminderModal.target}.`);
      this.closeReminder();
      return;
    }

    const adminSecret = this.resolveAdminSecret();
    const token = this.session.getAccessToken?.() || null;
    const appointmentId = Number(this.reminderModal.appointmentId || 0);
    if (!adminSecret) {
      this.reminderSendError = 'Falta admin secret para enviar correo.';
      return;
    }
    if (!appointmentId) {
      this.reminderSendError = 'No se pudo resolver la cita para enviar correo.';
      return;
    }

    this.reminderSending = true;
    this.reminderSendError = null;
    this.adminApi.sendAppointmentReminderEmail(adminSecret, token, appointmentId, {
      recipient: this.reminderModal.recipientType,
      subject: payload?.subject || this.reminderModal.defaultSubject,
      message: payload?.message || this.reminderModal.defaultMessage
    }).subscribe({
      next: () => {
        this.reminderSending = false;
        alert(`Correo enviado a ${this.reminderModal.target}.`);
        this.closeReminder();
      },
      error: (err: any) => {
        this.reminderSending = false;
        this.reminderSendError = err?.error?.error || 'No pudimos enviar el correo.';
      }
    });
  }

  openNoShow(providerName: string): void {
    this.noShowModal = { open: true, providerName };
  }

  closeNoShow(): void {
    this.noShowModal.open = false;
  }

  confirmNoShow(): void {
    alert('Incidencia reportada con exito.');
    this.closeNoShow();
  }

  resendAlerts(): void {
    alert('Accion Admin: Re-enviando lote de recordatorios automaticos.');
  }

  openPaymentValidation(): void {
    alert('Accediendo al modulo de validacion de pagos...');
  }

  openHistory(): void {
    this.historyModalOpen = true;
  }

  closeHistory(): void {
    this.historyModalOpen = false;
  }

  setTab(tab: 'activas' | 'historial'): void {
    this.activeTab = tab;
  }

  openValidateClose(item: SeguimientoHistoryEntry): void {
    alert(`Validando cierre para: ${item.title}`);
  }

  openReviewCase(item: SeguimientoHistoryEntry): void {
    alert(`Abriendo revision de caso: ${item.title}`);
  }

  onResponseChanged(payload: { appointmentId: number; responded: boolean }): void {
    if (!payload?.appointmentId) return;
    this.responseByAppointment[payload.appointmentId] = !!payload.responded;
    this.persistResponseState();
    this.activeAppointments = this.activeAppointments.map((item) =>
      item.appointmentId === payload.appointmentId ? { ...item, responded: !!payload.responded } : item
    );
  }

  isMissingSecretError(): boolean {
    return String(this.apiError || '').toLowerCase().includes('admin secret');
  }

  saveSecretAndRefresh(): void {
    const secret = String(this.adminSecretInput || '').trim();
    if (!secret) {
      this.apiError = 'Debes ingresar la clave secreta de admin.';
      return;
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('admin:secret', secret);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('admin:secret', secret);
    }
    this.adminSecretInput = secret;
    this.loadTrackingData();
  }

  private loadTrackingData(): void {
    const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin:secret') : '';
    const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('admin:secret') : '';
    const adminSecret = String(fromSession || fromLocal || '').trim();
    const token = this.session.getAccessToken?.() || null;

    if (!adminSecret) {
      this.activePeopleTodayCount = null;
      this.apiError = 'Falta admin secret. Abre Admin Pagos y configura la clave para cargar datos reales.';
      return;
    }

    this.loading = true;
    this.apiError = null;

    this.adminApi.list(adminSecret, token).subscribe({
      next: (res: any) => {
        this.loading = false;
        const rows = res?.success && Array.isArray(res?.data) ? res.data : [];
        this.mapRowsToBoard(rows);
        this.loadActivePeopleMetric(adminSecret, token);
      },
      error: (err: any) => {
        this.loading = false;
        this.activeAppointmentsCount = 0;
        this.activeAppointments = [];
        this.appointment = this.emptyAppointment();
        this.pendingCloseHistory = [];
        this.disputedHistory = [];
        this.closedHistory = [];
        this.activePeopleTodayCount = null;
        this.apiError = err?.error?.error || 'No se pudieron cargar los datos de seguimiento.';
      }
    });
  }

  private mapRowsToBoard(rows: any[]): void {
    const activeStatuses = new Set(['scheduled', 'confirmed', 'in_progress']);
    const activeRows = rows
      .filter((r) => activeStatuses.has(String(r?.appointment_status || '').toLowerCase()))
      .sort((a, b) => this.dateTimeToMillis(a?.appointment_date, a?.start_time) - this.dateTimeToMillis(b?.appointment_date, b?.start_time));
    this.activeAppointmentsCount = activeRows.length;
    this.activeAppointments = activeRows.map((main) => this.toAppointmentCard(main));
    this.appointment = this.activeAppointments[0] || this.emptyAppointment();

    const completedRows = rows.filter((r) => String(r?.appointment_status || '').toLowerCase() === 'completed');
    const pending = completedRows.filter((r) => {
      const release = String(r?.release_status || '').toLowerCase();
      return release === 'pending' || release === 'eligible';
    });
    const disputed = completedRows.filter((r) => !!r?.has_in_app_dispute || !!r?.has_active_chargeback);
    const closed = completedRows.filter((r) => {
      const release = String(r?.release_status || '').toLowerCase();
      const inDispute = !!r?.has_in_app_dispute || !!r?.has_active_chargeback;
      const pendingRelease = release === 'pending' || release === 'eligible';
      return !inDispute && !pendingRelease;
    });

    this.pendingCloseHistory = pending.slice(0, 20).map((r) => ({
      initials: this.initialsFromName(r?.provider_name),
      title: `${r?.provider_name || 'Proveedor'} - ${r?.service_name || 'Servicio'}`,
      subtitle: `Servicio finalizado - pendiente validacion (${this.formatAmount(r?.provider_amount || r?.amount)})`
    }));

    this.disputedHistory = disputed.slice(0, 20).map((r) => ({
      initials: this.initialsFromName(r?.provider_name),
      title: `${r?.provider_name || 'Proveedor'} - ${r?.service_name || 'Servicio'}`,
      subtitle: 'Caso en disputa de pago/servicio. Requiere revision administrativa.'
    }));

    this.closedHistory = closed.slice(0, 20).map((r) => ({
      initials: this.initialsFromName(r?.provider_name),
      title: `${r?.provider_name || 'Proveedor'} - ${r?.service_name || 'Servicio'}`,
      subtitle: `Cerrada ${this.formatDate(r?.appointment_date)} - ${this.formatAmount(r?.provider_amount || r?.amount)}`,
      statusLabel: 'Pagado'
    }));
  }

  private toAppointmentCard(main: any): SeguimientoAppointment {
    return {
      appointmentId: Number(main?.appointment_id || 0),
      client: {
        name: main.client_name || 'Cliente',
        roleLabel: 'Cliente',
        photoUrl: this.resolveAvatarUrl(main.client_avatar_url),
        avatarEmoji: '👤',
        whatsappCount: 0,
        emailCount: 0
      },
      clientEmail: main.client_email || null,
      provider: {
        name: main.provider_name || 'Proveedor',
        roleLabel: 'Proveedor Pro',
        photoUrl: this.resolveAvatarUrl(main.provider_avatar_url),
        avatarEmoji: '👷',
        whatsappCount: 0,
        emailCount: 0
      },
      providerEmail: main.provider_email || null,
      service: main.service_name || 'Servicio',
      schedule: this.formatSchedule(main.appointment_date, main.start_time),
      closureMessage: 'Esperando confirmacion de termino de servicio',
      responded: !!this.responseByAppointment[Number(main?.appointment_id || 0)]
    };
  }

  private formatSchedule(date: any, startTime: any): string {
    const dateText = this.formatDate(date);
    const timeText = String(startTime || '').slice(0, 5) || '--:--';
    return `${dateText} - ${timeText} hrs`;
  }

  private formatDate(date: any): string {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Fecha';
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  }

  private formatAmount(amount: any): string {
    const value = Number(amount || 0);
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
      }).format(value);
    } catch {
      return `$${Math.round(value)}`;
    }
  }

  private initialsFromName(name: any): string {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'AD';
    return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
  }

  private dateTimeToMillis(date: any, time: any): number {
    const d = String(date || '').slice(0, 10);
    const t = String(time || '').slice(0, 5);
    const dt = new Date(`${d}T${t || '00:00'}:00`);
    return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
  }

  private emptyAppointment(): SeguimientoAppointment {
    return {
      appointmentId: 0,
      client: {
        name: '',
        roleLabel: 'Cliente',
        avatarEmoji: '👤',
        whatsappCount: 0,
        emailCount: 0
      },
      provider: {
        name: '',
        roleLabel: 'Proveedor Pro',
        photoUrl: '',
        whatsappCount: 0,
        emailCount: 0
      },
      service: '',
      schedule: '',
      closureMessage: 'Esperando confirmacion de termino de servicio',
      responded: false
    };
  }

  private buildReminderTemplate(payload: SeguimientoReminderRequest): { subject: string; message: string } {
    const role = payload.recipientType === 'client' ? 'cliente' : 'proveedor';
    const subject = `Recordatorio de cita - ${payload.service}`;
    const message = [
      `Hola,`,
      ``,
      `Te enviamos un recordatorio de tu cita como ${role}.`,
      `Servicio: ${payload.service}`,
      `Horario: ${payload.schedule}`,
      ``,
      `Si necesitas reagendar o reportar un problema, hazlo desde tu panel en AdomiApp.`,
      ``,
      `Equipo AdomiApp`
    ].join('\n');
    return { subject, message };
  }

  private resolveAdminSecret(): string {
    const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin:secret') : '';
    const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('admin:secret') : '';
    return String(fromSession || fromLocal || '').trim();
  }

  private loadActivePeopleMetric(adminSecret: string, token: string | null): void {
    const today = this.todayIso();
    this.adminApi.analyticsSearchTrends(adminSecret, token, { from: today, to: today, group: 'day' }).subscribe({
      next: (resp: any) => {
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        const first = rows[0];
        const uniqueClients = Number(first?.unique_clients ?? 0);
        this.activePeopleTodayCount = Number.isFinite(uniqueClients) ? uniqueClients : 0;
      },
      error: () => {
        this.activePeopleTodayCount = null;
      }
    });
  }

  private todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private resolveAvatarUrl(raw: any): string {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    if (value.startsWith('/')) {
      return value;
    }
    return `/${value}`;
  }

  private loadResponseState(): Record<number, boolean> {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('seguimiento:responses') : null;
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private persistResponseState(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('seguimiento:responses', JSON.stringify(this.responseByAppointment));
      }
    } catch {}
  }
}

