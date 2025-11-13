import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared-ui/icon/icon.component';

@Component({
  selector: 'ui-quotes-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './quotes-header.component.html',
  styleUrls: ['./quotes-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotesHeaderComponent {
  @Input() title = 'Gestión de Cotizaciones';
  @Input() subtitle: string | null = 'Administra tus cotizaciones y responde a los clientes premium.';
  @Input() showPremiumBadge = true;
  @Input() badgeLabel = 'Plan Premium';
  @Input() icon: string | null = 'file-text';
  @Output() premiumInfo = new EventEmitter<void>();

  onInfoClick(): void {
    this.premiumInfo.emit();
  }
}

