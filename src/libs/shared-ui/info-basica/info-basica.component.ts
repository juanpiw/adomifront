import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiInputComponent } from '../ui-input/ui-input.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
  @Output() saveInfo = new EventEmitter<BasicInfo>();

  private saveSubject = new Subject<BasicInfo>();
  saving = false;

  constructor() {
    // Configurar guardado automático con debounce
    this.saveSubject.pipe(
      debounceTime(1000), // Esperar 1 segundo después del último cambio
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(info => {
      this.saveInfo.emit(info);
    });
  }

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
    
    // Programar guardado automático
    this.saveSubject.next(this.info);
  }

  onSaveStart() {
    this.saving = true;
  }

  onSaveComplete() {
    this.saving = false;
  }
}
