import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiInputComponent } from '../ui-input/ui-input.component';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface BasicInfo {
  fullName: string;
  professionalTitle: string;
  mainCommune: string;
  mainRegion?: string;
  yearsExperience: number;
  phone?: string;
  preferred_language?: string;
}

@Component({
  selector: 'app-info-basica',
  standalone: true,
  imports: [CommonModule, UiInputComponent, UiButtonComponent],
  templateUrl: './info-basica.component.html',
  styleUrls: ['./info-basica.component.scss']
})
export class InfoBasicaComponent {
  @Input() info: BasicInfo = {
    fullName: '',
    professionalTitle: '',
    mainCommune: '',
    mainRegion: '',
    yearsExperience: 0,
    phone: '',
    preferred_language: ''
  };

  @Output() infoChange = new EventEmitter<BasicInfo>();
  @Output() saveInfo = new EventEmitter<BasicInfo>();
  @Input() saving = false;
  @Input() hasChanges = false;

  constructor() {}

  onFieldChange(field: keyof BasicInfo, value: string | number | File | null) {
    let processedValue: string | number;
    
    if (field === 'yearsExperience') {
      // Para años de experiencia, mantener como número
      processedValue = typeof value === 'number' ? value : parseInt(value?.toString() || '0') || 0;
    } else {
      // Para otros campos, convertir a string
      processedValue = typeof value === 'string' ? value : value?.toString() || '';
    }
    
    this.info = { ...this.info, [field]: processedValue };
    this.infoChange.emit(this.info);
  }

  onSave() {
    this.saveInfo.emit(this.info);
  }
}
