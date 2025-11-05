import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface PortfolioImage {
  id: string;
  url: string;
  alt: string;
  type: 'image' | 'video';
  thumbnailUrl?: string | null;
  order?: number;
}

@Component({
  selector: 'app-portafolio',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './portafolio.component.html',
  styleUrls: ['./portafolio.component.scss']
})
export class PortafolioComponent {
  @Input() images: PortfolioImage[] = [
    { id: '1', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Corte+1', alt: 'Corte de pelo', type: 'image' },
    { id: '2', url: 'https://placehold.co/400x300/ddd6fe/4338ca?text=Coloraci%C3%B3n', alt: 'Coloración', type: 'image' }
  ];
  @Input() maxImages: number = 10;

  @Output() addImage = new EventEmitter<void>();
  @Output() addVideo = new EventEmitter<void>();
  @Output() deleteImage = new EventEmitter<string>();

  get canAddMore(): boolean {
    return this.images.length < this.maxImages;
  }

  onAddImage() {
    this.addImage.emit();
  }

  onAddVideo() {
    this.addVideo.emit();
  }

  onDeleteImage(imageId: string) {
    this.deleteImage.emit(imageId);
  }
}
