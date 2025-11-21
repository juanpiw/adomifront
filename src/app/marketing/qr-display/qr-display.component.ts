import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';
import { environment } from '../../../environments/environment';

interface QrMetaResponse {
  success: boolean;
  defaults: {
    url: string;
    size: number;
    margin: number;
    ecc: string;
  };
  ranges: {
    size: { min: number; max: number };
    margin: { min: number; max: number };
  };
  eccValues: string[];
}

type ElementType = 'svg' | 'canvas' | 'img';
type DownloadFormat = 'svg' | 'png';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, QRCodeComponent],
  templateUrl: './qr-display.component.html',
  styleUrls: ['./qr-display.component.scss']
})
export class QrDisplayComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  protected readonly eccLevels = signal<Array<'L' | 'M' | 'Q' | 'H'>>(['L', 'M', 'Q', 'H']);
  protected readonly elementTypes = [
    { label: 'SVG', value: 'svg' },
    { label: 'Canvas', value: 'canvas' },
    { label: 'Imagen (Base64)', value: 'img' }
  ];

  protected readonly meta = signal<QrMetaResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    url: ['https://www.adomiapp.com', [Validators.required]],
    size: [512, [Validators.min(128), Validators.max(4096)]],
    margin: [2, [Validators.min(0), Validators.max(16)]],
    ecc: ['H' as 'L' | 'M' | 'Q' | 'H'],
    elementType: ['svg' as ElementType]
  });

  protected readonly previewData = computed(() => {
    const value = (this.form.controls.url.value || '').trim();
    if (value) {
      return value;
    }
    return this.meta()?.defaults?.url || 'https://www.adomiapp.com';
  });

  protected readonly previewSize = computed(() => this.form.controls.size.value || 256);
  protected readonly previewEcc = computed(() => this.form.controls.ecc.value || 'H');
  protected readonly previewMargin = computed(() => this.form.controls.margin.value ?? 2);

  protected readonly backendBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor() {
    this.loadMeta();
    effect(() => {
      const meta = this.meta();
      if (meta?.eccValues?.length) {
        this.eccLevels.set(meta.eccValues as Array<'L' | 'M' | 'Q' | 'H'>);
      }
    });
  }

  private loadMeta(): void {
    this.loading.set(true);
    this.http.get<QrMetaResponse>(`${this.backendBaseUrl}/qr/meta`).subscribe({
      next: (response) => {
        this.meta.set(response);
        this.form.patchValue({
          url: response.defaults?.url || '',
          size: response.defaults?.size || 1024,
          margin: response.defaults?.margin ?? 2,
          ecc: (response.defaults?.ecc as any) || 'H'
        });
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('[QR] Meta request failed', err);
        this.error.set('No pudimos cargar la configuración base del QR. Usa los valores por defecto.');
        this.loading.set(false);
      }
    });
  }

  protected buildDownloadUrl(format: DownloadFormat, attachment = false): string {
    const search = new URLSearchParams();
    search.set('url', this.previewData());
    search.set('size', String(this.previewSize()));
    search.set('margin', String(this.previewMargin()));
    search.set('ecc', this.previewEcc());
    if (attachment) {
      search.set('download', '1');
    }
    return `${this.backendBaseUrl}/qr/${format}?${search.toString()}`;
  }

  protected async copy(value: string, label: string): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.error.set('El navegador no permite copiar automáticamente. Hazlo manualmente.');
      setTimeout(() => this.error.set(null), 2500);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.infoMessage.set(`${label} copiado al portapapeles`);
      setTimeout(() => this.infoMessage.set(null), 2500);
    } catch (err) {
      console.error('[QR] clipboard error', err);
      this.error.set('No pudimos copiar al portapapeles.');
      setTimeout(() => this.error.set(null), 2500);
    }
  }

  protected openDownload(format: DownloadFormat) {
    const url = this.buildDownloadUrl(format, true);
    if (typeof window === 'undefined') {
      this.error.set('Descarga disponible solo en navegador.');
      setTimeout(() => this.error.set(null), 2500);
      return;
    }
    window.open(url, '_blank', 'noopener');
  }
}


