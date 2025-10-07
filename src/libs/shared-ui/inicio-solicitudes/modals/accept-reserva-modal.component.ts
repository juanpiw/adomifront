import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { ReservaData, AcceptReservaResult } from './interfaces';

@Component({
  selector: 'app-accept-reserva-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './accept-reserva-modal.component.html',
  styleUrls: ['./accept-reserva-modal.component.scss']
})
export class AcceptReservaModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() reservaData: ReservaData | null = null;
  @Input() loading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<AcceptReservaResult>();

  // Estados del modal
  modalState: 'confirm' | 'loading' | 'success' = 'confirm';

  ngOnInit() {
    // Agregar listener para cerrar con ESC
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isOpen) {
      this.onClose();
    }
  }

  onClose() {
    this.resetModal();
    this.close.emit();
  }

  onConfirm() {
    if (!this.reservaData) return;

    // Cambiar a estado de loading
    this.modalState = 'loading';

    // Simular proceso de agendamiento
    setTimeout(() => {
      // Cambiar a estado de éxito
      this.modalState = 'success';
    }, 2000);
  }

  onSuccessOk() {
    if (!this.reservaData) return;

    const result: AcceptReservaResult = {
      success: true,
      data: {
        reservaId: this.reservaData.id,
        confirmedAt: new Date()
      }
    };

    this.confirm.emit(result);
    this.resetModal();
  }

  private resetModal() {
    this.modalState = 'confirm';
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
