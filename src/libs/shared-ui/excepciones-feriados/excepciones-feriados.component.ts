import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ExceptionDate {
  id: string;
  date: string;
  reason?: string;
}

@Component({
  selector: 'app-excepciones-feriados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excepciones-feriados.component.html',
  styleUrls: ['./excepciones-feriados.component.scss']
})
export class ExcepcionesFeriadosComponent {
  @Input() exceptions: ExceptionDate[] = [];
  @Input() loading = false;

  @Output() exceptionsChange = new EventEmitter<ExceptionDate[]>();
  @Output() addException = new EventEmitter<{ date: string; reason?: string }>();
  @Output() removeException = new EventEmitter<string>();

  newDate = '';
  newReason = '';

  onAddException() {
    if (this.loading) {
      return;
    }
    if (this.newDate.trim()) {
      this.addException.emit({ 
        date: this.newDate.trim(), 
        reason: this.newReason.trim() || undefined 
      });

      // Reset form
      this.newDate = '';
      this.newReason = '';
    }
  }

  onRemoveException(exceptionId: string) {
    if (this.loading) {
      return;
    }
    this.removeException.emit(exceptionId);
  }

  formatDate(dateString: string): string {
    // Convert date string to readable format
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}
