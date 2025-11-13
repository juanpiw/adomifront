import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared-ui/icon/icon.component';

@Component({
  selector: 'ui-quotes-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './quotes-empty-state.component.html',
  styleUrls: ['./quotes-empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotesEmptyStateComponent {
  @Input() title = 'Aún no tienes cotizaciones';
  @Input() description = 'Cuando un cliente solicite una cotización, aparecerá aquí para que puedas responder y convertirla en venta.';
  @Input() icon = 'sparkles';
}

