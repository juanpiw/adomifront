import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { ProviderVerificationService, ProviderVerificationRecord, VerificationStatus, SubmitVerificationPayload } from '../../../app/services/provider-verification.service';

@Component({
  selector: 'app-verificacion-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent],
  templateUrl: './verificacion-perfil.component.html',
  styleUrls: ['./verificacion-perfil.component.scss']
})
export class VerificacionPerfilComponent implements OnInit {
  currentStep = 1;
  selectedFiles: { front: File | null; back: File | null; selfie: File | null } = { front: null, back: null, selfie: null };
  previews: { front: string | null; back: string | null; selfie: string | null } = { front: null, back: null, selfie: null };
  uploadStatus: { front: boolean; back: boolean; selfie: boolean } = { front: false, back: false, selfie: false };
  isUploading = false;
  statusLoading = false;
  uploadError = '';
  statusError: string | null = null;
  verificationStatus: VerificationStatus = 'none';
  verificationRecord: ProviderVerificationRecord | null = null;
  rejectionReason: string | null = null;
  documentNumber: string = '';

  private verificationService = inject(ProviderVerificationService);

  ngOnInit() {
    this.loadVerificationStatus();
  }

  loadVerificationStatus() {
    this.statusLoading = true;
    this.statusError = null;

    this.verificationService.getStatus()
      .pipe(finalize(() => { this.statusLoading = false; }))
      .subscribe({
        next: (response) => {
          this.verificationRecord = response?.verification || null;
          const profileStatus = response?.profile?.verification_status as VerificationStatus | undefined;
          const recordStatus = (this.verificationRecord?.status as VerificationStatus) || 'none';
          this.verificationStatus = profileStatus || recordStatus || 'none';
          this.documentNumber = this.verificationRecord?.document_number || '';
          this.rejectionReason = this.verificationRecord?.rejection_reason || null;

          if (this.verificationStatus === 'pending') {
            this.currentStep = 3;
          } else if (this.verificationStatus === 'approved') {
            this.currentStep = 3;
          } else if (this.verificationStatus === 'rejected') {
            this.currentStep = 2;
          } else {
            this.currentStep = 1;
          }

          // Reset local selections when status comes from backend
          this.resetSelections(false);
        },
        error: (error) => {
          console.error('[VERIFICACION] Error cargando estado', error);
          this.statusError = 'No se pudo obtener el estado de verificación. Intenta nuevamente más tarde.';
          this.verificationStatus = 'none';
          this.verificationRecord = null;
        }
      });
  }

  onFileSelected(event: Event, side: 'front' | 'back') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validaciones
      if (!file.type.startsWith('image/')) {
        this.uploadError = 'Por favor selecciona un archivo de imagen válido.';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'La imagen debe ser menor a 5MB.';
        return;
      }

      this.selectedFiles[side] = file;
      this.uploadStatus[side] = true;
      this.uploadError = '';
      this.showFilePreview(file, side);
    }
  }

  onSelfieSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.uploadError = 'La selfie debe ser una imagen válida.';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'La selfie debe ser menor a 5MB.';
        return;
      }
      this.selectedFiles.selfie = file;
      this.uploadStatus.selfie = true;
      this.uploadError = '';
      this.showFilePreview(file, 'selfie');
    }
  }

  showFilePreview(file: File, side: 'front' | 'back' | 'selfie') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.previews[side] = result;
    };
    reader.readAsDataURL(file);
  }

  async uploadDocuments() {
    if (!this.documentNumber || !this.documentNumber.trim()) {
      this.uploadError = 'Ingresa el número de tu documento.';
      return;
    }
    if (!this.selectedFiles.front || !this.selectedFiles.back) {
      this.uploadError = 'Por favor selecciona ambas imágenes';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';

    try {
      const payload: SubmitVerificationPayload = {
        documentNumber: this.documentNumber.trim(),
        frontFile: this.selectedFiles.front as File,
        backFile: this.selectedFiles.back as File,
        selfieFile: this.selectedFiles.selfie
      };

      await firstValueFrom(this.verificationService.submit(payload));

      this.verificationStatus = 'pending';
      this.goToStep(3);
      this.resetSelections();
      this.loadVerificationStatus();
    } catch (error: any) {
      console.error('Error al subir documentos:', error);
      this.uploadError = error?.error?.error || error.message || 'Error al subir documentos';
    } finally {
      this.isUploading = false;
    }
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  onGoBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFinishProcess() {
    this.currentStep = 3;
  }

  startVerification() {
    this.resetSelections();
    this.goToStep(2);
  }

  get canUpload(): boolean {
    return !!this.documentNumber && this.uploadStatus.front && this.uploadStatus.back && !this.isUploading;
  }

  get hasVerification(): boolean {
    return this.verificationStatus !== 'none';
  }

  get isApproved(): boolean {
    return this.verificationStatus === 'approved';
  }

  get isPending(): boolean {
    return this.verificationStatus === 'pending';
  }

  get isRejected(): boolean {
    return this.verificationStatus === 'rejected';
  }

  private resetSelections(clearDocumentNumber: boolean = true) {
    this.selectedFiles = { front: null, back: null, selfie: null };
    this.uploadStatus = { front: false, back: false, selfie: false };
    this.previews = { front: null, back: null, selfie: null };
    if (clearDocumentNumber && !this.verificationRecord?.document_number) {
      this.documentNumber = '';
    }
    this.uploadError = '';
  }
}











