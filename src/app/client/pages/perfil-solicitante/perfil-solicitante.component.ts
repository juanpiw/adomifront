import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProviderClientService, ProviderClientProfile } from '../../../services/provider-client.service';

@Component({
  selector: 'app-perfil-solicitante',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-solicitante.component.html',
  styleUrls: ['../perfil/perfil.component.scss', './perfil-solicitante.component.scss']
})
export class PerfilSolicitanteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private providerClientService = inject(ProviderClientService);

  loading = true;
  error: string | null = null;
  profile: ProviderClientProfile | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('clientId');
      const clientId = idParam ? Number(idParam) : NaN;
      if (!Number.isFinite(clientId) || clientId <= 0) {
        this.loading = false;
        this.error = 'Identificador de cliente inválido.';
        return;
      }
      this.fetchProfile(clientId);
    });
  }

  get memberSinceLabel(): string {
    if (!this.profile) return '';
    const sourceDate = this.profile.profile_created_at || this.profile.user_created_at;
    if (!sourceDate) return 'Cliente Adomi';
    try {
      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) return 'Cliente Adomi';
      const month = date.toLocaleDateString('es-ES', { month: 'long' });
      const year = date.getFullYear();
      return `Cliente Adomi desde ${this.capitalize(month)} de ${year}`;
    } catch {
      return 'Cliente Adomi';
    }
  }

  get verificationStatusVariant(): 'approved' | 'pending' | 'rejected' | 'none' {
    const status = this.profile?.verification_status;
    if (status === 'approved') return 'approved';
    if (status === 'pending') return 'pending';
    if (status === 'rejected') return 'rejected';
    return 'none';
  }

  get verificationStatusLabel(): string {
    const variant = this.verificationStatusVariant;
    switch (variant) {
      case 'approved':
        return 'Identidad verificada';
      case 'pending':
        return 'Verificación en revisión';
      case 'rejected':
        return 'Verificación rechazada';
      default:
        return 'Identidad no verificada';
    }
  }

  get showNotes(): boolean {
    return !!(this.profile && this.profile.notes && this.profile.notes.trim().length > 0);
  }

  get profilePhotoUrl(): string | null {
    return this.profile?.profile_photo_url || null;
  }

  get clientName(): string {
    if (!this.profile) return '';
    return this.profile.full_name || this.profile.display_name || 'Cliente sin nombre';
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'C';
    if (parts.length === 1) return (parts[0][0] || 'C').toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    const result = `${first}${last}`.trim();
    return result ? result.toUpperCase() : 'C';
  }

  private fetchProfile(clientId: number): void {
    this.loading = true;
    this.error = null;

    this.providerClientService.getClientProfile(clientId).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response?.success || !response.client) {
          this.error = response?.error || 'No se encontró información del cliente.';
          return;
        }
        this.profile = response.client;
      },
      error: (err) => {
        console.error('[PERFIL SOLICITANTE] Error cargando perfil', err);
        this.loading = false;
        this.error = err?.error?.error || 'No se pudo cargar la información del cliente.';
      }
    });
  }

  private capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

