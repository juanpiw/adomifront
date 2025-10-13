import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';

@Component({
  selector: 'app-seccion-fotos',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './seccion-fotos.component.html',
  styleUrls: ['./seccion-fotos.component.scss']
})
export class SeccionFotosComponent {
  @Input() profilePhoto: string | null = 'https://placehold.co/96x96/C7D2FE/4338CA?text=ET';
  @Input() coverPhoto: string | null = 'https://placehold.co/256x96/C7D2FE/4338CA?text=Portada';
  @Input() saving = false;
  @Input() hasChanges = false;

  @Output() changeProfilePhoto = new EventEmitter<string>();
  @Output() changeCoverPhoto = new EventEmitter<string>();
  @Output() savePhotos = new EventEmitter<{profilePhoto?: File, coverPhoto?: File}>();

  // Archivos seleccionados para subir
  selectedProfileFile: File | null = null;
  selectedCoverFile: File | null = null;

  onProfilePhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.handleImageUpload(file, 'profile');
    }
  }

  onCoverPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.handleImageUpload(file, 'cover');
    }
  }

  private handleImageUpload(file: File, type: 'profile' | 'cover') {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB.');
      return;
    }

    // Guardar el archivo seleccionado
    if (type === 'profile') {
      this.selectedProfileFile = file;
    } else {
      this.selectedCoverFile = file;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'profile') {
        this.profilePhoto = result;
        this.changeProfilePhoto.emit(result);
      } else {
        this.coverPhoto = result;
        this.changeCoverPhoto.emit(result);
      }
    };
    reader.readAsDataURL(file);
  }

  onSave() {
    console.log('[SECCION_FOTOS] Guardando fotos...');
    console.log('[SECCION_FOTOS] Profile file:', this.selectedProfileFile);
    console.log('[SECCION_FOTOS] Cover file:', this.selectedCoverFile);
    
    const filesToSave: {profilePhoto?: File, coverPhoto?: File} = {};
    
    if (this.selectedProfileFile) {
      filesToSave.profilePhoto = this.selectedProfileFile;
    }
    
    if (this.selectedCoverFile) {
      filesToSave.coverPhoto = this.selectedCoverFile;
    }
    
    this.savePhotos.emit(filesToSave);
  }

  triggerProfilePhotoUpload() {
    const input = document.getElementById('profile-photo-input') as HTMLInputElement;
    input.click();
  }

  triggerCoverPhotoUpload() {
    const input = document.getElementById('cover-photo-input') as HTMLInputElement;
    input.click();
  }
}
