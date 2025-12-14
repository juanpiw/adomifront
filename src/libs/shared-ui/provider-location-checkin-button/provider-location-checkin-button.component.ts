import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentsService } from '../../../app/services/appointments.service';

type GeoEventType = 'arrive' | 'finish';

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

  loading = false;
  lastResult: { is_match?: boolean; distance_m?: number; radius_m?: number } | null = null;
  error: string | null = null;

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

    this.loading = true;
    this.error = null;
    this.lastResult = null;

    const startedAt = Date.now();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = pos.coords;
        const lat = coords?.latitude;
        const lng = coords?.longitude;
        const accuracy_m = coords?.accuracy;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          this.loading = false;
          this.error = 'No pudimos obtener coordenadas válidas.';
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
              return;
            }
            this.lastResult = {
              is_match: resp?.is_match,
              distance_m: resp?.distance_m,
              radius_m: resp?.radius_m
            };
          },
          error: (err: any) => {
            this.loading = false;
            this.error = err?.error?.message || err?.error?.error || 'No se pudo registrar la ubicación.';
          }
        });
      },
      (geoErr) => {
        this.loading = false;
        // https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError/code
        const code = (geoErr as any)?.code;
        if (code === 1) this.error = 'Permiso de ubicación denegado.';
        else if (code === 2) this.error = 'No se pudo determinar tu ubicación.';
        else if (code === 3) this.error = 'Tiempo de espera agotado al obtener ubicación.';
        else this.error = 'No se pudo obtener la ubicación.';
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }

  get badgeText(): string | null {
    if (!this.lastResult) return null;
    if (this.lastResult.is_match === true) return 'Match';
    if (this.lastResult.is_match === false) return 'No match';
    return 'Registrado';
  }
}


