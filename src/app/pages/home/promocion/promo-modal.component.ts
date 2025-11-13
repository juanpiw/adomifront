import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromoService } from '../../../services/promo.service';

export interface PromoFormData {
  nombre: string;
  correo: string;
  profesion: string;
  notas: string;
}

@Component({
  selector: 'app-promo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promo-modal.component.html',
  styleUrls: ['./promo-modal.component.scss']
})
export class PromoModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<PromoFormData>();

  private promoService = inject(PromoService);

  // Form data
  formData: PromoFormData = {
    nombre: '',
    correo: '',
    profesion: '',
    notas: ''
  };

  // Form validation
  errors: Partial<PromoFormData> = {};
  loading = false;
  success = false;
  errorMessage = '';

  // Profesiones disponibles
  get profesionOptions() {
    return this.promoService.getProfesionOptions();
  }

  // Check if "Otro" is selected
  get showOtroMessage() {
    return this.formData.profesion === 'otro';
  }

  // Dynamic placeholder for notes
  get notesPlaceholder() {
    if (this.formData.profesion === 'otro') {
      return 'Cuéntanos qué servicio o profesión específica deseas impartir...';
    }
    return 'Cuéntanos más sobre tu negocio, experiencia, o cualquier cosa que quieras que sepamos...';
  }

  // Close modal
  onClose() {
    this.resetModal();
    this.close.emit();
  }

  // Handle overlay click
  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // Validate form
  private validateForm(): boolean {
    this.errors = {};

    if (!this.formData.nombre.trim()) {
      this.errors.nombre = 'El nombre es requerido';
    }

    if (!this.formData.correo.trim()) {
      this.errors.correo = 'El correo es requerido';
    } else if (!this.isValidEmail(this.formData.correo)) {
      this.errors.correo = 'El correo no es válido';
    }

    if (!this.formData.profesion.trim()) {
      this.errors.profesion = 'La profesión es requerida';
    }

    return Object.keys(this.errors).length === 0;
  }

  // Email validation
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Submit form
  onSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.success = false;
    
    // Enviar datos al backend
    this.promoService.signupForFreeTrial(this.formData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.success = true;
          this.submit.emit({ ...this.formData });
          // Cerrar modal después de 3 segundos
          setTimeout(() => {
            this.onClose();
          }, 3000);
        } else {
          this.errorMessage = response.error || 'No se pudo procesar tu registro';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Network error:', error);
        const serverMessage = error?.error?.error || error?.error?.message || error?.message;
        this.errorMessage = serverMessage || 'Error de conexión. Por favor, intenta de nuevo más tarde.';
      }
    });
  }

  // Clear errors when user starts typing
  onInputChange(field: keyof PromoFormData) {
    if (this.errors[field]) {
      delete this.errors[field];
    }
  }

  // Reset modal state
  resetModal() {
    this.formData = {
      nombre: '',
      correo: '',
      profesion: '',
      notas: ''
    };
    this.errors = {};
    this.loading = false;
    this.success = false;
    this.errorMessage = '';
  }
}
