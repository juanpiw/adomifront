import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentsService } from '../../../app/services/appointments.service';

type GeoEventType = 'arrive' | 'finish';
type GeoModalState =
  | 'checking'
  | 'match'
  | 'no_match'
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'no_dest_coords'
  | 'server_error'
  | 'too_early';

@Component({
  selector: 'app-provider-location-checkin-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-location-checkin-button.component.html',
  styleUrls: ['./provider-location-checkin-button.component.scss']
})
export class ProviderLocationCheckinButtonComponent {
  private appointments = inject(AppointmentsService);

  @Input({ required: true }) appointmentId!: number;
  @Input({ required: true }) eventType!: GeoEventType;
  @Input() label = 'Registrar';
  @Input() destinationLabel: string | null | undefined = null;
  @Input() appointmentDate?: string | null;
  @Input() appointmentTime?: string | null;

  loading = false;
  lastResult: { is_match?: boolean; distance_m?: number; radius_m?: number } | null = null;
  error: string | null = null;

  modalOpen = false;
  modalState: GeoModalState | null = null;
  modalMessage: string | null = null;

  onClick(evt: MouseEvent): void {
    evt.stopPropagation();
    if (this.loading) return;
    if (!this.appointmentId || !Number.isFinite(this.appointmentId)) {
      this.error = 'Cita inválida';
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.error = 'Tu navegador no soporta geolocalización.';
      return;
    }

    // Bloqueo por horario: no permitir antes de la hora de la cita
    if (this.isBeforeAppointmentTime()) {
      this.modalOpen = true;
      this.modalState = 'too_early';
      const startLabel = this.formatAppointmentDateTime();
      const nowLabel = this.formatNow();
      this.modalMessage = `Aún no es el horario de la cita. Cita: ${startLabel}. Hora actual: ${nowLabel}.`;
      return;
    }

    this.openModalAndAttempt();
  }

  closeModal(evt?: Event): void {
    try { evt?.stopPropagation(); } catch {}
    this.modalOpen = false;
    this.modalState = null;
    this.modalMessage = null;
  }

  retry(evt?: Event): void {
    try { evt?.stopPropagation(); } catch {}
    if (this.loading) return;
    this.openModalAndAttempt(true);
  }

  private openModalAndAttempt(forceFresh = false): void {
    this.modalOpen = true;
    this.modalState = 'checking';
    this.modalMessage = 'Verificando tu ubicación…';

    this.loading = true;
    this.error = null;
    this.lastResult = null;

    const startedAt = Date.now();
    const enableHighAccuracy = this.eventType === 'arrive' ? true : false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = pos.coords;
        const lat = coords?.latitude;
        const lng = coords?.longitude;
        const accuracy_m = coords?.accuracy;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          this.loading = false;
          this.error = 'No pudimos obtener coordenadas válidas.';
          this.modalState = 'position_unavailable';
          this.modalMessage = 'No pudimos obtener una ubicación válida. Activa tu GPS e inténtalo otra vez.';
          return;
        }

        const captured_at = new Date(startedAt).toISOString();
        this.appointments.providerLocationEvent(this.appointmentId, {
          event_type: this.eventType,
          lat: lat as number,
          lng: lng as number,
          accuracy_m: Number.isFinite(accuracy_m) ? (accuracy_m as number) : undefined,
          captured_at
        }).subscribe({
          next: (resp) => {
            this.loading = false;
            if (!resp?.success) {
              this.error = resp?.message || resp?.error || 'No se pudo registrar.';
              this.modalState = 'server_error';
              this.modalMessage = this.error;
              return;
            }
            this.lastResult = {
              is_match: resp?.is_match,
              distance_m: resp?.distance_m,
              radius_m: resp?.radius_m
            };

            if (resp?.is_match === true) {
              this.modalState = 'match';
              this.modalMessage = 'Listo: detectamos que estás en la ubicación del servicio.';
              // Cierre suave para no molestar
              setTimeout(() => {
                if (this.modalOpen && this.modalState === 'match') this.closeModal();
              }, 1200);
              return;
            }

            if (resp?.is_match === false) {
              this.modalState = 'no_match';
              this.modalMessage = 'No detectamos que estés en la ubicación del servicio. Activa tu GPS (alta precisión) y reintenta.';
              return;
            }

            // registrado pero sin match (backend no calculó match)
            this.modalState = 'server_error';
            this.modalMessage = 'Registramos tu ubicación, pero no pudimos validar el match. Reintenta en unos segundos.';
          },
          error: (err: any) => {
            this.loading = false;
            const backendErr = err?.error?.message || err?.error?.error || 'No se pudo registrar la ubicación.';
            this.error = backendErr;

            if (String(err?.error?.error || '').includes('DESTINATION_COORDS_MISSING')) {
              this.modalState = 'no_dest_coords';
              this.modalMessage = 'Esta cita no tiene coordenadas de destino. Solicita al cliente actualizar la ubicación/dirección y reintenta.';
              return;
            }

            this.modalState = 'server_error';
            this.modalMessage = backendErr;
          }
        });
      },
      (geoErr) => {
        this.loading = false;
        // https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError/code
        const code = (geoErr as any)?.code;
        if (code === 1) {
          this.error = 'Permiso de ubicación denegado.';
          this.modalState = 'permission_denied';
          this.modalMessage = 'No tenemos permiso para usar tu ubicación. Activa la ubicación en tu navegador y reintenta.';
        } else if (code === 2) {
          this.error = 'No se pudo determinar tu ubicación.';
          this.modalState = 'position_unavailable';
          this.modalMessage = 'No pudimos determinar tu ubicación. Activa tu GPS y reintenta.';
        } else if (code === 3) {
          this.error = 'Tiempo de espera agotado al obtener ubicación.';
          this.modalState = 'timeout';
          this.modalMessage = 'Se agotó el tiempo de espera. Activa alta precisión y reintenta.';
        } else {
          this.error = 'No se pudo obtener la ubicación.';
          this.modalState = 'position_unavailable';
          this.modalMessage = 'No se pudo obtener la ubicación. Reintenta.';
        }
      },
      { enableHighAccuracy, timeout: 12000, maximumAge: forceFresh ? 0 : 10_000 }
    );
  }

  get badgeText(): string | null {
    if (!this.lastResult) return null;
    if (this.lastResult.is_match === true) return 'Match';
    if (this.lastResult.is_match === false) return 'No match';
    return 'Registrado';
  }

  private isBeforeAppointmentTime(): boolean {
    const dt = this.buildAppointmentDate();
    if (!dt) return false;
    return Date.now() < dt.getTime();
  }

  private buildAppointmentDate(): Date | null {
    const datePart = (this.appointmentDate || '').trim();
    const timePart = (this.appointmentTime || '').trim();
    if (!datePart || !timePart) return null;
    const combined = `${datePart}T${timePart}`;
    const dt = new Date(combined);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  private formatAppointmentDateTime(): string {
    const dt = this.buildAppointmentDate();
    if (!dt) return 'fecha no disponible';
    return `${dt.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })} ${dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private formatNow(): string {
    const now = new Date();
    return now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }
}


