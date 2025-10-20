import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface NuevaCitaData {
  title: string;
  client?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  color: string;
}

export interface BloqueoData {
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  blockWholeDay: boolean;
}

@Component({
  selector: 'app-modal-agendar-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-agendar-cita.component.html',
  styleUrls: ['./modal-agendar-cita.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('in => out', animate('300ms ease-in')),
      transition('out => in', animate('300ms ease-out'))
    ]),
    trigger('scaleInOut', [
      state('in', style({ transform: 'scale(1)' })),
      state('out', style({ transform: 'scale(0.95)' })),
      transition('in => out', animate('300ms ease-in')),
      transition('out => in', animate('300ms ease-out'))
    ])
  ]
})
export class ModalAgendarCitaComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() selectedDate?: Date;
  @Input() mode: 'cita' | 'bloqueo' = 'bloqueo'; // Modo por defecto: bloqueo
  @Output() close = new EventEmitter<void>();
  @Output() citaCreated = new EventEmitter<NuevaCitaData>();
  @Output() espacioBloqueado = new EventEmitter<BloqueoData>();

  appointmentForm: FormGroup;
  selectedColor: string = '#dc2626'; // Rojo para bloqueos
  blockWholeDay: boolean = false;

  availableColors = [
    { color: '#4338ca', name: 'indigo', label: 'Cita' },
    { color: '#16a34a', name: 'green', label: 'Confirmada' },
    { color: '#f59e0b', name: 'amber', label: 'Pendiente' },
    { color: '#dc2626', name: 'red', label: 'Bloqueado' },
    { color: '#4b5563', name: 'gray', label: 'Personal' }
  ];

  constructor(private fb: FormBuilder) {
    this.appointmentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      client: [''],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.resetForm();
      // Si hay una fecha seleccionada, establecerla en el formulario
      if (this.selectedDate) {
        const dateStr = this.formatDateForInput(this.selectedDate);
        this.appointmentForm.patchValue({ date: dateStr });
      } else {
        // Si no, usar la fecha de hoy
        const today = this.formatDateForInput(new Date());
        this.appointmentForm.patchValue({ date: today });
      }
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  isColorSelected(color: string): boolean {
    return this.selectedColor === color;
  }

  getColorClass(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'indigo': 'ring-indigo-700',
      'green': 'ring-green-600',
      'amber': 'ring-amber-500',
      'red': 'ring-red-600',
      'gray': 'ring-gray-600'
    };
    return colorMap[colorName] || 'ring-transparent';
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  resetForm(): void {
    this.appointmentForm.reset();
    this.selectedColor = '#4338ca';
  }

  onSubmit(): void {
    if (this.mode === 'bloqueo') {
      // Modo bloqueo de espacio
      const date = this.appointmentForm.get('date')?.value;
      const startTime = this.appointmentForm.get('startTime')?.value;
      const endTime = this.appointmentForm.get('endTime')?.value;
      const reason = this.appointmentForm.get('title')?.value || 'Bloqueado';
      
      if (!date) {
        this.appointmentForm.get('date')?.markAsTouched();
        return;
      }
      
      if (!this.blockWholeDay && (!startTime || !endTime)) {
        this.appointmentForm.get('startTime')?.markAsTouched();
        this.appointmentForm.get('endTime')?.markAsTouched();
        return;
      }
      
      const bloqueoData: BloqueoData = {
        date,
        startTime: this.blockWholeDay ? undefined : startTime,
        endTime: this.blockWholeDay ? undefined : endTime,
        reason,
        blockWholeDay: this.blockWholeDay
      };
      
      console.log('🔒 [MODAL] Emitiendo bloqueo:', bloqueoData);
      this.espacioBloqueado.emit(bloqueoData);
      this.closeModal();
      
    } else {
      // Modo cita normal
      if (this.appointmentForm.valid) {
        const formData: NuevaCitaData = {
          ...this.appointmentForm.value,
          color: this.selectedColor
        };

        this.citaCreated.emit(formData);
        this.closeModal();
      } else {
        // Marcar todos los campos como touched para mostrar errores
        Object.keys(this.appointmentForm.controls).forEach(key => {
          this.appointmentForm.get(key)?.markAsTouched();
        });
      }
    }
  }
  
  toggleBlockWholeDay(): void {
    this.blockWholeDay = !this.blockWholeDay;
    console.log('🔒 [MODAL] Bloquear todo el día:', this.blockWholeDay);
    
    if (this.blockWholeDay) {
      // Si bloquea todo el día, limpiar y deshabilitar horas
      this.appointmentForm.get('startTime')?.clearValidators();
      this.appointmentForm.get('endTime')?.clearValidators();
      this.appointmentForm.patchValue({ startTime: '', endTime: '' });
    } else {
      // Si no, requerir horas
      this.appointmentForm.get('startTime')?.setValidators([Validators.required]);
      this.appointmentForm.get('endTime')?.setValidators([Validators.required]);
    }
    
    this.appointmentForm.get('startTime')?.updateValueAndValidity();
    this.appointmentForm.get('endTime')?.updateValueAndValidity();
  }

  // Getters para acceso fácil a los controles del formulario
  get title() { return this.appointmentForm.get('title'); }
  get client() { return this.appointmentForm.get('client'); }
  get date() { return this.appointmentForm.get('date'); }
  get startTime() { return this.appointmentForm.get('startTime'); }
  get endTime() { return this.appointmentForm.get('endTime'); }
  get notes() { return this.appointmentForm.get('notes'); }
}








