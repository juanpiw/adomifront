import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { MisDatoPublicado } from '../models';
import { MisDatosPostulacionesListComponent } from '../mis-datos-postulaciones-list/mis-datos-postulaciones-list.component';
import { MisDatosMatchesListComponent } from '../mis-datos-matches-list/mis-datos-matches-list.component';
import { ClientTengoDatosService } from '../../../../app/services/client-tengo-datos.service';

@Component({
  selector: 'ui-mis-datos-dato-card',
  standalone: true,
  imports: [CommonModule, IconComponent, MisDatosPostulacionesListComponent, MisDatosMatchesListComponent],
  templateUrl: './mis-datos-dato-card.component.html',
  styleUrls: ['./mis-datos-dato-card.component.scss']
})
export class MisDatosDatoCardComponent {
  @Input({ required: true }) dato!: MisDatoPublicado;

  applying = false;
  applicationFeedback = '';
  closing = false;
  closeFeedback = '';

  constructor(private clientTengoDatosService: ClientTengoDatosService) {}

  get canApplyAsProvider(): boolean {
    if (this.dato?.canViewPostulaciones) return false;
    if (this.dato?.status === 'cerrado') return false;
    try {
      const raw = localStorage.getItem('adomi_user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = String(user?.role || '').toLowerCase();
      const pendingRole = String(user?.pending_role || user?.pendingRole || '').toLowerCase();
      return role === 'provider' || pendingRole === 'provider';
    } catch {
      return false;
    }
  }

  applyToDato(): void {
    if (this.applying || !this.canApplyAsProvider) return;
    const eventId = Number(this.dato?.id || 0);
    if (!eventId) return;

    this.applying = true;
    this.applicationFeedback = '';
    const defaultMessage = `Hola, me interesa ayudar con "${this.dato?.title || 'este pedido'}".`;

    try {
      this.clientTengoDatosService.applyToFeedEvent(eventId, defaultMessage).subscribe({
        next: () => {
          this.applying = false;
          this.applicationFeedback = 'Te has postulado con exito';
        },
        error: () => {
          this.applying = false;
          this.applicationFeedback = this.dato?.status === 'cerrado'
            ? 'Este pedido ya fue cerrado'
            : 'No se pudo postular ahora';
        }
      });
    } catch {
      this.applying = false;
      this.applicationFeedback = 'Debes iniciar sesion como proveedor para postular';
    }
  }

  closeDato(): void {
    if (!this.dato?.canViewPostulaciones || this.closing || this.dato?.status === 'cerrado') return;

    const eventId = Number(this.dato?.id || 0);
    if (!eventId) return;

    this.closing = true;
    this.closeFeedback = '';

    try {
      this.clientTengoDatosService.closePublishedFeedEvent(eventId).subscribe({
        next: () => {
          this.closing = false;
          this.dato.status = 'cerrado';
          this.closeFeedback = 'Pedido cerrado correctamente';
        },
        error: () => {
          this.closing = false;
          this.closeFeedback = 'No se pudo cerrar el pedido';
        }
      });
    } catch {
      this.closing = false;
      this.closeFeedback = 'No se pudo cerrar el pedido';
    }
  }
}

