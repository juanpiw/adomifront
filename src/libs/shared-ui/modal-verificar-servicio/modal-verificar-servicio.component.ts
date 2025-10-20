import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ui-modal-verificar-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-verificar-servicio.component.html',
  styleUrls: ['./modal-verificar-servicio.component.scss']
})
export class ModalVerificarServicioComponent implements AfterViewInit {
  @Input() isOpen = false;
  @Input() appointment: any = null;
  @Input() verifying = false;
  @Input() errorMessage = '';
  @Input() remainingAttempts = 3;
  
  @Output() verified = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  
  @ViewChildren('codeInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;
  
  codeDigits: string[] = ['', '', '', ''];
  
  ngAfterViewInit(): void {
    // Auto-focus en el primer input cuando se abre el modal
    if (this.isOpen) {
      setTimeout(() => {
        const firstInput = this.inputs.first;
        if (firstInput) {
          firstInput.nativeElement.focus();
        }
      }, 100);
    }
  }
  
  ngOnChanges(): void {
    // Auto-focus cuando se abre el modal
    if (this.isOpen && this.inputs && this.inputs.first) {
      setTimeout(() => {
        this.inputs.first.nativeElement.focus();
      }, 100);
    }
    
    // Limpiar inputs cuando hay un error
    if (this.errorMessage && !this.verifying) {
      this.clearCode();
    }
  }
  
  onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Solo permitir dígitos
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }
    
    if (value && /^\d$/.test(value)) {
      this.codeDigits[index] = value;
      
      // Auto-advance al siguiente input
      if (index < 3) {
        const inputsArray = this.inputs.toArray();
        const nextInput = inputsArray[index + 1];
        if (nextInput) {
          nextInput.nativeElement.focus();
        }
      }
      
      // Si se completaron los 4 dígitos, auto-verificar
      if (index === 3 && this.isCodeComplete()) {
        setTimeout(() => {
          this.onVerify();
        }, 200);
      }
    }
  }
  
  onKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    
    // Backspace: borrar y volver al input anterior
    if (event.key === 'Backspace') {
      if (!this.codeDigits[index] || this.codeDigits[index] === '') {
        // Si el input actual está vacío, ir al anterior
        if (index > 0) {
          event.preventDefault();
          const inputsArray = this.inputs.toArray();
          const prevInput = inputsArray[index - 1];
          if (prevInput) {
            this.codeDigits[index - 1] = '';
            prevInput.nativeElement.value = '';
            prevInput.nativeElement.focus();
          }
        }
      } else {
        // Borrar el dígito actual
        this.codeDigits[index] = '';
        input.value = '';
      }
    }
    
    // Flecha izquierda: ir al input anterior
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      const inputsArray = this.inputs.toArray();
      const prevInput = inputsArray[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
      }
    }
    
    // Flecha derecha: ir al siguiente input
    if (event.key === 'ArrowRight' && index < 3) {
      event.preventDefault();
      const inputsArray = this.inputs.toArray();
      const nextInput = inputsArray[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }
    
    // Enter: verificar si el código está completo
    if (event.key === 'Enter' && this.isCodeComplete()) {
      event.preventDefault();
      this.onVerify();
    }
  }
  
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digits = pastedText.replace(/\D/g, '').slice(0, 4).split('');
    
    if (digits.length > 0) {
      const inputsArray = this.inputs.toArray();
      digits.forEach((digit, i) => {
        if (i < 4) {
          this.codeDigits[i] = digit;
          inputsArray[i].nativeElement.value = digit;
        }
      });
      
      // Focus en el siguiente input vacío o el último
      const nextEmptyIndex = digits.length < 4 ? digits.length : 3;
      inputsArray[nextEmptyIndex].nativeElement.focus();
      
      // Si se pegaron 4 dígitos, auto-verificar
      if (digits.length === 4) {
        setTimeout(() => {
          this.onVerify();
        }, 200);
      }
    }
  }
  
  isCodeComplete(): boolean {
    return this.codeDigits.every(d => d && d !== '');
  }
  
  getCode(): string {
    return this.codeDigits.join('');
  }
  
  onVerify(): void {
    if (!this.isCodeComplete() || this.verifying) return;
    
    const code = this.getCode();
    console.log('🔐 [MODAL] Verificando código:', code);
    this.verified.emit(code);
  }
  
  clearCode(): void {
    this.codeDigits = ['', '', '', ''];
    const inputsArray = this.inputs.toArray();
    inputsArray.forEach(input => {
      input.nativeElement.value = '';
    });
    
    // Focus en el primer input
    if (inputsArray[0]) {
      setTimeout(() => {
        inputsArray[0].nativeElement.focus();
      }, 100);
    }
  }
  
  onCancel(): void {
    this.clearCode();
    this.cancel.emit();
  }
  
  onBackdropClick(event: MouseEvent): void {
    // Solo cerrar si se hace clic en el backdrop, no en el contenido
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }
}

