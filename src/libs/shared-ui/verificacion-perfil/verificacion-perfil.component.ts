import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';

@Component({
  selector: 'app-verificacion-perfil',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './verificacion-perfil.component.html',
  styleUrls: ['./verificacion-perfil.component.scss']
})
export class VerificacionPerfilComponent implements OnInit {
  currentStep = 1;
  selectedFiles: { front: File | null; back: File | null } = { front: null, back: null };
  uploadStatus: { front: boolean; back: boolean } = { front: false, back: false };
  isUploading = false;
  uploadError = '';
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';

  ngOnInit() {
    // TODO: Cargar estado de verificación existente
    this.loadVerificationStatus();
  }

  loadVerificationStatus() {
    // TODO: Implementar carga de estado desde backend
    // Por ahora simulamos que no hay verificación
    this.verificationStatus = 'none';
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

  showFilePreview(file: File, side: 'front' | 'back') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const iconElement = document.getElementById(`icon-${side}`);
      const textElement = document.getElementById(`text-${side}`);
      
      if (iconElement && textElement) {
        iconElement.innerHTML = `
          <img src="${result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">
        `;
        textElement.textContent = 'Imagen seleccionada';
      }
    };
    reader.readAsDataURL(file);
  }

  async uploadDocuments() {
    if (!this.selectedFiles.front || !this.selectedFiles.back) {
      this.uploadError = 'Por favor selecciona ambas imágenes';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';

    try {
      // TODO: Implementar upload real con VerificationService
      // Simulamos el upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.verificationStatus = 'pending';
      this.goToStep(3);
    } catch (error: any) {
      console.error('Error al subir documentos:', error);
      this.uploadError = error.message || 'Error al subir documentos';
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
    // TODO: Implementar lógica de finalización
    console.log('Proceso de verificación completado');
  }

  startVerification() {
    this.goToStep(2);
  }

  get canUpload(): boolean {
    return this.uploadStatus.front && this.uploadStatus.back && !this.isUploading;
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
}



