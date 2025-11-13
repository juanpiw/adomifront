import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteStatus } from '../quotes.models';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  new: 'Nueva solicitud',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Vencida'
};

@Component({
  selector: 'ui-quote-status-pill',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="status-pill" [ngClass]="'status-' + status">{{ label }}</span>`,
  styleUrls: ['./quote-status-pill.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuoteStatusPillComponent {
  @Input() status: QuoteStatus = 'new';

  get label(): string {
    return STATUS_LABELS[this.status] ?? this.status;
  }
}


