import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-provider-cv-step',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-cv-step.component.html',
  styleUrls: ['./provider-cv-step.component.scss']
})
export class ProviderCvStepComponent {
  @Input() fileName = '';
  @Input() bio = '';
  @Input() saving = false;

  @Output() fileSelected = new EventEmitter<File | null>();
  @Output() bioChange = new EventEmitter<string>();

  onFileChange(evt: Event): void {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.fileSelected.emit(file);
  }

  onBioInput(evt: Event): void {
    const input = evt.target as HTMLTextAreaElement | null;
    this.bioChange.emit(String(input?.value || ''));
  }
}
