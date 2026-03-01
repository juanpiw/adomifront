import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../auth/services/session.service';
import {
  SeguimientoAppointment,
  SeguimientoCitasAppointmentCardComponent
} from './components/seguimiento-citas-appointment-card.component';
import { SeguimientoCitasTopbarComponent } from './components/seguimiento-citas-topbar.component';
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
    SeguimientoCitasTopbarComponent,
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

  restricted = false;
  readonly adminEmail = 'juanpablojpw@gmail.com';
  readonly currentDateLabel = 'Marzo 01, 2026';
  activeTab: 'activas' | 'historial' = 'activas';

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
  readonly pendingCloseHistory: SeguimientoHistoryEntry[] = [
    {
      initials: 'JS',
      title: 'Juan Soto - Gasfiteria',
      subtitle: 'Servicio realizado hace 2h - Pendiente de pago'
    }
  ];
  readonly disputedHistory: SeguimientoHistoryEntry[] = [
    {
      initials: 'RC',
      title: 'Roberto Carlos - Electricidad',
      subtitle: 'Cliente marco "No asistio" - Proveedor indica que si asistio'
    }
  ];
  readonly closedHistory: SeguimientoHistoryEntry[] = [
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
}

