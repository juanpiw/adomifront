import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupportTicketCreateInput } from '../models/support-ticket.model';

@Component({
  selector: 'ui-support-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-ticket-form.component.html',
  styleUrls: ['./support-ticket-form.component.scss']
})
export class SupportTicketFormComponent {
  @Input() categories: string[] = ['Pagos', 'Servicio', 'App', 'Cuenta'];
  @Input() submitLabel = 'Enviar ticket';
  @Input() isSubmitting = false;

  @Output() submitTicket = new EventEmitter<SupportTicketCreateInput>();
  @Output() cancel = new EventEmitter<void>();

  model: SupportTicketCreateInput = {
    category: '',
    subject: '',
    description: ''
  };

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.model.category || !this.model.subject) return;
    this.submitTicket.emit({ ...this.model });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}




