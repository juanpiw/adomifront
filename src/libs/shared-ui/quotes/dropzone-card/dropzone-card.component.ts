import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared-ui/icon/icon.component';

export interface DropzoneFile {
  file: File;
  previewUrl?: string;
}

@Component({
  selector: 'ui-dropzone-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './dropzone-card.component.html',
  styleUrls: ['./dropzone-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropzoneCardComponent {
  @Input() label = 'Adjuntar archivos';
  @Input() description = 'Arrastra y suelta archivos o haz clic para seleccionarlos.';
  @Input() accept = '.pdf,.png,.jpg,.jpeg';
  @Input() maxSizeMb = 5;
  @Output() filesDropped = new EventEmitter<File[]>();

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input?.files?.length) return;
    const files = Array.from(input.files);
    this.filesDropped.emit(this.filterValidFiles(files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer?.files?.length) return;
    const files = Array.from(event.dataTransfer.files);
    this.filesDropped.emit(this.filterValidFiles(files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private filterValidFiles(files: File[]): File[] {
    const acceptList = (this.accept || '').split(',').map((type) => type.trim().toLowerCase()).filter(Boolean);
    const maxSizeBytes = this.maxSizeMb * 1024 * 1024;

    return files.filter((file) => {
      const matchesType = acceptList.length === 0 || acceptList.some((type) => file.name.toLowerCase().endsWith(type.replace('.', '')));
      const withinSize = file.size <= maxSizeBytes;
      return matchesType && withinSize;
    });
  }
}

