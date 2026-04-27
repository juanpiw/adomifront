import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-provider-health-step',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-health-step.component.html',
  styleUrls: ['./provider-health-step.component.scss']
})
export class ProviderHealthStepComponent {
  @Input() certificateName = '';
  @Input() certificateSize: number | null = null;
  @Input() certificateMimeType = '';
  @Input() selectedCertificateFile: File | null = null;
  @Input() certificateUploading = false;
  @Input() certificateFolio = '';
  @Input() acceptsFonasa = true;
  @Input() guideUrl = 'https://rnpi.supersalud.gob.cl/';
  @Input() saving = false;

  @Output() certificateSelected = new EventEmitter<File | null>();
  @Output() certificateRemoved = new EventEmitter<void>();
  @Output() folioChange = new EventEmitter<string>();
  @Output() acceptsFonasaChange = new EventEmitter<boolean>();

  get hasCertificateFile(): boolean {
    return !!this.selectedCertificateFile || this.certificateName.trim().length > 0;
  }

  get displayFileName(): string {
    return this.selectedCertificateFile?.name || this.certificateName || 'Certificado SIS';
  }

  get displayFileExtension(): string {
    const name = this.displayFileName;
    const ext = name.includes('.') ? name.split('.').pop() || '' : '';
    if (ext) return ext.toUpperCase();
    if (this.certificateMimeType.includes('pdf')) return 'PDF';
    if (this.certificateMimeType.includes('png')) return 'PNG';
    if (this.certificateMimeType.includes('jpeg') || this.certificateMimeType.includes('jpg')) return 'JPG';
    if (this.certificateMimeType.includes('webp')) return 'WEBP';
    return 'ARCHIVO';
  }

  get displayFileSize(): string {
    const size = Number(this.selectedCertificateFile?.size || this.certificateSize || 0);
    if (!Number.isFinite(size) || size <= 0) return 'Peso por confirmar';
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  get fileStatusLabel(): string {
    if (this.certificateUploading) return 'Cargando certificado...';
    if (this.selectedCertificateFile) return 'Listo para guardar';
    return 'Certificado cargado';
  }

  onFileChange(evt: Event): void {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.certificateSelected.emit(file);
    if (input) input.value = '';
  }

  onRemoveCertificate(): void {
    if (this.saving) return;
    this.certificateRemoved.emit();
  }

  onFolioInput(evt: Event): void {
    const input = evt.target as HTMLInputElement | null;
    this.folioChange.emit(String(input?.value || ''));
  }

  onFonasaToggle(evt: Event): void {
    const input = evt.target as HTMLInputElement | null;
    this.acceptsFonasaChange.emit(!!input?.checked);
  }
}
