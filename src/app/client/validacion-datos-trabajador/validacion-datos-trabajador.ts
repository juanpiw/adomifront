import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VerificationService, UploadResponse } from './services/verification.service';

@Component({
  selector: 'app-validacion-datos-trabajador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validacion-datos-trabajador.html',
  styleUrls: ['./validacion-datos-trabajador.scss']
})
export class ValidacionDatosTrabajadorComponent implements OnInit {
  currentStep = 1;
  totalSteps = 3;
  uploadStatus = { front: false, back: false };
  selectedFiles = { front: null as File | null, back: null as File | null };
  isUploading = false;
  uploadError = '';
  
  // Referencias a elementos del DOM
  stepElements: { [key: string]: HTMLElement | null } = {};
  backButton: HTMLElement | null = null;
  progressBar: HTMLElement | null = null;
  progressIndicator: HTMLElement | null = null;
  stepTexts: { [key: string]: HTMLElement | null } = {};

  constructor(
    private router: Router,
    private verificationService: VerificationService
  ) {}

  ngOnInit() {
    // Verificar que estamos en el navegador antes de acceder a document
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Inicializar referencias después de que la vista se renderice
      setTimeout(() => {
        this.initializeElements();
        this.updateUI();
      }, 0);
    }
  }

  initializeElements() {
    if (typeof document === 'undefined') return;
    
    this.stepElements = {
      1: document.getElementById('step-1'),
      2: document.getElementById('step-2'),
      3: document.getElementById('step-3'),
      'success': document.getElementById('step-final-success')
    };
    this.backButton = document.getElementById('backButton');
    this.progressBar = document.getElementById('progressBar');
    this.progressIndicator = document.getElementById('progressIndicator');
    this.stepTexts = {
      1: document.getElementById('step-text-1'),
      2: document.getElementById('step-text-2'),
      3: document.getElementById('step-text-3'),
    };
  }

  updateUI() {
    // Esconder todos los pasos
    Object.values(this.stepElements).forEach(step => {
      if (step) {
        step.classList.add('hidden');
      }
    });
   
    // Mostrar el paso actual
    const currentStepElement = this.stepElements[this.currentStep];
    if (currentStepElement) {
      currentStepElement.classList.remove('hidden');
      currentStepElement.classList.remove('fade-out');
      currentStepElement.classList.add('fade-in');
    }

    // Actualizar botón de retroceso y barra de progreso
    if (this.backButton) {
      this.backButton.style.visibility = (this.currentStep > 1 && this.currentStep <= this.totalSteps) ? 'visible' : 'hidden';
    }
    
    if (this.progressIndicator) {
      this.progressIndicator.style.display = (this.currentStep <= this.totalSteps) ? 'block' : 'none';
    }

    if (this.currentStep <= this.totalSteps) {
      const progress = (this.currentStep - 1) * 37.5 + 25;
      if (this.progressBar) {
        this.progressBar.style.width = `${progress}%`;
      }

      Object.values(this.stepTexts).forEach(text => {
        if (text) {
          text.classList.remove('active');
        }
      });
     
      for (let i = 1; i <= this.currentStep; i++) {
        const stepText = this.stepTexts[i];
        if (stepText) {
          stepText.classList.add('active');
        }
      }
    }
  }
 
  goToStep(step: number | string) {
    const currentStepElement = this.stepElements[this.currentStep];
    if (currentStepElement) {
      currentStepElement.classList.add('fade-out');
      setTimeout(() => {
        this.currentStep = step as number;
        this.updateUI();
      }, 300);
    }
  }

  goBack() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  onFileSelected(event: Event, side: 'front' | 'back') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.uploadError = 'Solo se permiten archivos de imagen';
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'El archivo es demasiado grande (máximo 5MB)';
        return;
      }
      
      this.selectedFiles[side] = file;
      this.uploadError = '';
      this.showFilePreview(file, side);
    }
  }

  showFilePreview(file: File, side: 'front' | 'back') {
    if (typeof document === 'undefined') return;

    const uploadBox = document.getElementById(`upload-${side}`);
    const icon = document.getElementById(`icon-${side}`);
    const text = document.getElementById(`text-${side}`);
   
    if (!uploadBox || !icon || !text) return;

    // Mostrar preview del archivo
    const reader = new FileReader();
    reader.onload = (e) => {
      icon.innerHTML = `
        <img src="${e.target?.result}" style="width: 2rem; height: 2rem; object-fit: cover; border-radius: 0.25rem;" alt="Preview">
      `;
      text.textContent = file.name;
      text.style.color = '#16a34a';
      text.style.fontWeight = '600';
      this.uploadStatus[side] = true;

      // Habilitar botón de envío si ambos están listos
      if (this.uploadStatus.front && this.uploadStatus.back) {
        const submitButton = document.getElementById('submitDocsButton') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async uploadDocuments() {
    if (!this.selectedFiles.front || !this.selectedFiles.back) {
      this.uploadError = 'Por favor selecciona ambas imágenes';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';

    try {
      const response = await this.verificationService.uploadDocuments(
        this.selectedFiles.front,
        this.selectedFiles.back,
        'id_card'
      ).toPromise();

      if (response?.success) {
        console.log('Documentos subidos correctamente:', response);
        this.goToStep(3);
      } else {
        this.uploadError = response?.error || 'Error al subir documentos';
      }
    } catch (error: any) {
      console.error('Error al subir documentos:', error);
      this.uploadError = error.message || 'Error al subir documentos';
    } finally {
      this.isUploading = false;
    }
  }

  finishProcess() {
    // En una app real, esto te llevaría a otra pantalla.
    // Aquí, simplemente mostraremos el estado aprobado como demostración.
    this.goToStep('success');
    if (this.backButton) {
      this.backButton.style.visibility = 'hidden';
    }
  }

  // Métodos para el template
  onGoToStep(step: number) {
    this.goToStep(step);
  }

  onGoBack() {
    this.goBack();
  }

  onFinishProcess() {
    this.finishProcess();
  }
}