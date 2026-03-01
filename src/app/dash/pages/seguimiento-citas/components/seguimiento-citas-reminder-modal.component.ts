import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seguimiento-citas-reminder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento-citas-reminder-modal.component.html',
  styleUrls: ['./seguimiento-citas-reminder-modal.component.scss']
})
export class SeguimientoCitasReminderModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() target = '';
  @Input() channel: 'WhatsApp' | 'Correo' = 'WhatsApp';
  @Input() sending = false;
  @Input() sendError: string | null = null;
  @Input() defaultSubject = '';
  @Input() defaultMessage = '';

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ subject?: string; message?: string }>();

  editorOpen = false;
  draftSubject = '';
  draftMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue) {
      this.editorOpen = false;
      this.draftSubject = this.defaultSubject;
      this.draftMessage = this.defaultMessage;
    }
    if (changes['defaultSubject'] && !this.editorOpen) {
      this.draftSubject = this.defaultSubject;
    }
    if (changes['defaultMessage'] && !this.editorOpen) {
      this.draftMessage = this.defaultMessage;
    }
  }

  onPrimaryClick(): void {
    if (this.channel !== 'Correo') {
      this.confirm.emit({});
      return;
    }
    if (!this.editorOpen) {
      this.editorOpen = true;
      return;
    }
    this.confirm.emit({
      subject: this.draftSubject.trim(),
      message: this.draftMessage.trim()
    });
  }

  primaryLabel(): string {
    if (this.sending) return 'Enviando...';
    if (this.channel !== 'Correo') return 'Enviar Ahora';
    return this.editorOpen ? 'Enviar Correo' : 'Ver Plantilla';
  }
}
