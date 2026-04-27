import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import {
  ProviderHealthDocument,
  ProviderHealthProfile,
  ProviderProfile,
  ProviderProfileService
} from '../../../services/provider-profile.service';

type HealthSpecialistsView = 'registro-sis' | 'guia-fonasa';

@Component({
  selector: 'app-especialistas-salud',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './especialistas-salud.component.html',
  styleUrls: ['./especialistas-salud.component.scss']
})
export class EspecialistasSaludComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly providerProfile = inject(ProviderProfileService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly subscription = new Subscription();

  activeView: HealthSpecialistsView = 'registro-sis';
  profile: ProviderHealthProfile | null = null;
  documents: ProviderHealthDocument[] = [];
  provider: ProviderProfile | null = null;
  selectedSisFile: File | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  ngOnInit(): void {
    this.subscription.add(
      this.route.data.subscribe((data) => {
        const view = data['view'];
        this.activeView = view === 'guia-fonasa' ? 'guia-fonasa' : 'registro-sis';
      })
    );
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get pageTitle(): string {
    return this.activeView === 'guia-fonasa' ? 'Gestión Fonasa' : 'Registro de Salud';
  }

  get pageSubtitle(): string {
    return this.activeView === 'guia-fonasa' ? 'Habilitación comercial' : 'Configuración segura';
  }

  get sisDocument(): ProviderHealthDocument | null {
    return this.documents.find((document) => document.document_type === 'rnpi_certificate') || null;
  }

  get sisCertificateUploaded(): boolean {
    return !!this.profile?.sis_certificate_uploaded || !!this.sisDocument;
  }

  get acceptsFonasa(): boolean {
    return this.profile?.accepts_fonasa !== false;
  }

  get providerName(): string {
    return this.provider?.full_name?.trim() || 'Profesional Adomi';
  }

  get providerRole(): string {
    return this.provider?.professional_title?.trim() || 'Especialista de salud';
  }

  get providerAvatarUrl(): string {
    return this.provider?.profile_photo_url || '/assets/default-avatar.png';
  }

  loadData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.providerProfile.getHealthSetup()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (setup) => {
          this.profile = setup.profile;
          this.documents = setup.documents || [];
        },
        error: (err) => {
          this.error = err?.error?.error || 'No pudimos cargar tu centro de especialistas.';
        }
      });

    this.providerProfile.getProfile().subscribe({
      next: (profile) => (this.provider = profile),
      error: () => {}
    });
  }

  onSisFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.selectedSisFile = input?.files?.[0] || null;
    this.success = null;
    this.error = null;
  }

  uploadSisCertificate(): void {
    if (!this.selectedSisFile || this.saving) return;

    this.saving = true;
    this.error = null;
    this.success = null;

    this.providerProfile.uploadHealthDocument(this.selectedSisFile, 'rnpi_certificate')
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (document) => {
          this.selectedSisFile = null;
          this.documents = [
            document,
            ...this.documents.filter((item) => item.document_type !== 'rnpi_certificate')
          ];
          this.profile = {
            ...(this.profile || { provider_id: 0, accepts_fonasa: false }),
            sis_certificate_uploaded: true,
            sis_certificate_uploaded_at: document.uploaded_at || new Date().toISOString()
          };
          this.success = 'Certificado SIS guardado correctamente.';
        },
        error: (err) => {
          this.error = err?.error?.error || err?.message || 'No pudimos subir el certificado SIS.';
        }
      });
  }

  toggleFonasa(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const acceptsFonasa = !!input?.checked;
    this.saving = true;
    this.error = null;
    this.success = null;

    this.providerProfile.saveHealthSetup({ accepts_fonasa: acceptsFonasa })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.success = acceptsFonasa
            ? 'Fonasa quedó marcado como disponible en tus métodos de pago.'
            : 'Fonasa quedó desactivado para tus métodos de pago.';
        },
        error: (err) => {
          if (input) input.checked = !acceptsFonasa;
          this.error = err?.error?.error || 'No pudimos guardar la configuración Fonasa.';
        }
      });
  }

  formatDate(value?: string | null): string {
    if (!value) return 'Por confirmar';
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return 'Por confirmar';
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(parsed);
  }

  formatFileSize(value?: number | null): string {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Archivo guardado';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
