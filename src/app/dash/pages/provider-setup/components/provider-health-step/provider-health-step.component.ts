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
  @Input() certificateFolio = '';
  @Input() acceptsFonasa = true;
  @Input() guideUrl = 'https://rnpi.supersalud.gob.cl/';
  @Input() saving = false;

  @Output() certificateSelected = new EventEmitter<File | null>();
  @Output() folioChange = new EventEmitter<string>();
  @Output() acceptsFonasaChange = new EventEmitter<boolean>();

  onFileChange(evt: Event): void {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.certificateSelected.emit(file);
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
