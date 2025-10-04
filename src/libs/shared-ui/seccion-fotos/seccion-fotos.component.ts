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
  @Input() profilePhoto: string = 'https://placehold.co/96x96/C7D2FE/4338CA?text=ET';
  @Input() coverPhoto: string = 'https://placehold.co/256x96/C7D2FE/4338CA?text=Portada';

  @Output() changeProfilePhoto = new EventEmitter<string>();
  @Output() changeCoverPhoto = new EventEmitter<string>();

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

  triggerProfilePhotoUpload() {
    const input = document.getElementById('profile-photo-input') as HTMLInputElement;
    input.click();
  }

  triggerCoverPhotoUpload() {
    const input = document.getElementById('cover-photo-input') as HTMLInputElement;
    input.click();
  }
}
