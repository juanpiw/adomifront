import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { ReservaData, RejectReservaResult, REJECTION_REASONS } from './interfaces';

@Component({
  selector: 'app-reject-reserva-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './reject-reserva-modal.component.html',
  styleUrls: ['./reject-reserva-modal.component.scss']
})
export class RejectReservaModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() reservaData: ReservaData | null = null;
  @Input() loading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<RejectReservaResult>();

  selectedReason = '';
  customReason = '';
  rejectionReasons = REJECTION_REASONS;

  ngOnInit() {
    // Agregar listener para cerrar con ESC
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isOpen) {
      this.onClose();
    }
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onConfirm() {
    if (!this.reservaData || !this.selectedReason) return;

    const result: RejectReservaResult = {
      success: true,
      data: {
        reservaId: this.reservaData.id,
        rejectedAt: new Date(),
        reason: this.selectedReason,
        customReason: this.selectedReason === 'other' ? this.customReason : undefined
      }
    };

    this.confirm.emit(result);
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onReasonChange() {
    // Reset custom reason when changing from 'other'
    if (this.selectedReason !== 'other') {
      this.customReason = '';
    }
  }

  get canConfirm(): boolean {
    if (!this.selectedReason) return false;
    if (this.selectedReason === 'other' && !this.customReason.trim()) return false;
    return true;
  }

  get selectedReasonLabel(): string {
    const reason = this.rejectionReasons.find(r => r.value === this.selectedReason);
    return reason ? reason.label : '';
  }

  private resetForm() {
    this.selectedReason = '';
    this.customReason = '';
  }
}
