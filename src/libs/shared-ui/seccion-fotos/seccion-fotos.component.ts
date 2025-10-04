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

  @Output() changeProfilePhoto = new EventEmitter<void>();
  @Output() changeCoverPhoto = new EventEmitter<void>();

  onProfilePhotoChange() {
    this.changeProfilePhoto.emit();
  }

  onCoverPhotoChange() {
    this.changeCoverPhoto.emit();
  }
}
