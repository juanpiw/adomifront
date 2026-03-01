import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../auth/services/session.service';
import { AdminPaymentsService } from '../admin-pagos/admin-payments.service';
import {
  SeguimientoAppointment,
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

  appointment: SeguimientoAppointment = {
    client: {
      name: 'Impact Render',
      roleLabel: 'Cliente',
      avatarEmoji: '👤',
      whatsappCount: 2,
      emailCount: 1
    },
    provider: {
      name: 'Alejandra Gajardo',
      roleLabel: 'Proveedor Pro',
      photoUrl: 'https://adomi.impactrenderstudio.com/uploads/providers/326/photo-1772222799691-271385952.jpeg',
      whatsappCount: 3,
      emailCount: 1
    },
    service: 'Reparacion Lavadora',
    schedule: 'Hoy - 16:30 hrs',
    closureMessage: 'Esperando confirmacion de termino de servicio'
  };

  reminderModal = {
    open: false,
    target: '',
    channel: 'WhatsApp' as 'WhatsApp' | 'Correo'
  };
  noShowModal = {
    open: false,
    providerName: ''
  };
  historyModalOpen = false;
  pendingCloseHistory: SeguimientoHistoryEntry[] = [
    {
      initials: 'JS',
      title: 'Juan Soto - Gasfiteria',
      subtitle: 'Servicio realizado hace 2h - Pendiente de pago'
    }
  ];
  disputedHistory: SeguimientoHistoryEntry[] = [
    {
      initials: 'RC',
      title: 'Roberto Carlos - Electricidad',
      subtitle: 'Cliente marco "No asistio" - Proveedor indica que si asistio'
    }
  ];
  closedHistory: SeguimientoHistoryEntry[] = [
    {
      imageUrl:
        'https://adomi.impactrenderstudio.com/uploads/profiles/providers/compressed-7a29e239-ad92-4110-b745-64d9293a3ee9.webp',
      title: 'Macarena Diaz - LED',
      subtitle: 'Cerrada el 24 Feb - $45.000 OK',
      statusLabel: 'Pagado'
    }
  ];

  ngOnInit(): void {
    const email = String(this.session.getUser()?.email || '').trim().toLowerCase();
    this.restricted = email !== this.adminEmail;
    if (!this.restricted) {
      this.loadTrackingData();
    }
  }

  openReminder(payload: { target: string; channel: 'WhatsApp' | 'Correo' }): void {
    this.reminderModal = {
      open: true,
      target: payload.target,
      channel: payload.channel
    };
  }

  closeReminder(): void {
    this.reminderModal.open = false;
  }

  confirmReminderSend(): void {
    alert(`Exito: Recordatorio via ${this.reminderModal.channel} enviado a ${this.reminderModal.target}.`);
    this.closeReminder();
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

  private loadTrackingData(): void {
    const adminSecret = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('admin:secret') || ''
      : '';
    const token = this.session.getAccessToken?.() || null;

    if (!adminSecret) {
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
      },
      error: (err: any) => {
        this.loading = false;
        this.apiError = err?.error?.error || 'No se pudieron cargar los datos de seguimiento.';
      }
    });
  }

  private mapRowsToBoard(rows: any[]): void {
    const activeStatuses = new Set(['scheduled', 'confirmed', 'in_progress']);
    const activeRows = rows.filter((r) => activeStatuses.has(String(r?.appointment_status || '').toLowerCase()));
    this.activeAppointmentsCount = activeRows.length;

    const main = activeRows[0];
    if (main) {
      this.appointment = {
        client: {
          name: main.client_name || 'Cliente',
          roleLabel: 'Cliente',
          avatarEmoji: '👤',
          whatsappCount: 0,
          emailCount: 0
        },
        provider: {
          name: main.provider_name || 'Proveedor',
          roleLabel: 'Proveedor Pro',
          avatarEmoji: '👷',
          whatsappCount: 0,
          emailCount: 0
        },
        service: main.service_name || 'Servicio',
        schedule: this.formatSchedule(main.appointment_date, main.start_time),
        closureMessage: 'Esperando confirmacion de termino de servicio'
      };
    }

    const pending = rows.filter((r) => {
      const release = String(r?.release_status || '').toLowerCase();
      const apptStatus = String(r?.appointment_status || '').toLowerCase();
      return (release === 'pending' || release === 'eligible') && apptStatus === 'completed';
    });
    const disputed = rows.filter((r) => !!r?.has_in_app_dispute || !!r?.has_active_chargeback);
    const closed = rows.filter((r) => String(r?.release_status || '').toLowerCase() === 'completed');

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
}

