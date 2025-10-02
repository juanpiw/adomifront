import { Component, EventEmitter, Input, Output, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'avatar-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-uploader.component.html',
  styleUrls: ['./avatar-uploader.component.scss']
})
export class AvatarUploaderComponent {
  @Input() src: string | null = null;
  @Input() label = 'Foto de perfil';
  @Output() srcChange = new EventEmitter<string | null>();

  private platformId = inject(PLATFORM_ID);

  onFileChange(ev: Event) {
    if (!isPlatformBrowser(this.platformId)) return;
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.srcChange.emit(reader.result as string);
    reader.readAsDataURL(file);
  }

  clear() { this.srcChange.emit(null); }
}
