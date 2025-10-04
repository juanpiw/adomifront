import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiInputComponent } from '../ui-input/ui-input.component';

export interface BasicInfo {
  fullName: string;
  professionalTitle: string;
  mainCommune: string;
  yearsExperience: number;
}

@Component({
  selector: 'app-info-basica',
  standalone: true,
  imports: [CommonModule, UiInputComponent],
  templateUrl: './info-basica.component.html',
  styleUrls: ['./info-basica.component.scss']
})
export class InfoBasicaComponent {
  @Input() info: BasicInfo = {
    fullName: '',
    professionalTitle: '',
    mainCommune: '',
    yearsExperience: 0
  };

  @Output() infoChange = new EventEmitter<BasicInfo>();

  onFieldChange(field: keyof BasicInfo, value: string | number | File | null) {
    const stringValue = typeof value === 'string' ? value : value?.toString() || '';
    this.info = { ...this.info, [field]: stringValue };
    this.infoChange.emit(this.info);
  }
}
