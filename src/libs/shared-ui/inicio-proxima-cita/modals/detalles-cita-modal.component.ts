import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { CitaDetalleData, CitaDetalleResult, CancelCitaResult } from './interfaces';

@Component({
  selector: 'app-detalles-cita-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './detalles-cita-modal.component.html',
  styleUrls: ['./detalles-cita-modal.component.scss']
})
export class DetallesCitaModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() citaData: CitaDetalleData | null = null;
  @Input() loading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<CitaDetalleResult>();
  @Output() cancel = new EventEmitter<CancelCitaResult>();

  // Estados del modal
  showCancelConfirmation = false;
  cancelConfirmText = '';

  ngOnInit() {
    if (this.isOpen && typeof document !== 'undefined') {
      document.body.classList.add('overflow-hidden');
    }
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('overflow-hidden');
    }
  }

  onClose() {
    this.resetModal();
    this.close.emit();
    if (typeof document !== 'undefined') {
      document.body.classList.remove('overflow-hidden');
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onContactClient() {
    if (this.citaData && !this.loading) {
      this.action.emit({
        action: 'contact',
        citaId: this.citaData.id,
        data: { client: this.citaData.client }
      });
    }
  }

  onReschedule() {
    if (this.citaData && !this.loading) {
      this.action.emit({
        action: 'reschedule',
        citaId: this.citaData.id,
        data: { cita: this.citaData }
      });
    }
  }

  onShowCancelConfirmation() {
    this.showCancelConfirmation = true;
  }

  onCancelConfirmTextChange() {
    // Validación en tiempo real
  }

  onFinalCancel() {
    if (this.cancelConfirmText === 'CANCELAR' && this.citaData && !this.loading) {
      this.cancel.emit({
        citaId: this.citaData.id,
        confirmed: true
      });
      this.resetModal();
    }
  }

  onViewMap() {
    if (this.citaData?.location.mapUrl) {
      window.open(this.citaData.location.mapUrl, '_blank');
    }
  }

  private resetModal() {
    this.showCancelConfirmation = false;
    this.cancelConfirmText = '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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

  get isCancelButtonEnabled(): boolean {
    return this.cancelConfirmText === 'CANCELAR' && !this.loading;
  }
}
















