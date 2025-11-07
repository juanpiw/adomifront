import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SettingLink } from '../interfaces';

@Component({
  selector: 'ui-payments-billing-section',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './payments-billing-section.component.html',
  styleUrls: ['./payments-billing-section.component.scss']
})
export class PaymentsBillingSectionComponent {
  @Input() paymentLinks: SettingLink[] = [
    {
      id: 'payment-methods',
      label: 'Métodos de Pago',
      description: 'Administra tus tarjetas guardadas',
      action: 'navigate',
      route: '/client/pagos'
    },
    {
      id: 'payment-history',
      label: 'Historial de Pagos',
      description: 'Ver recibos y transacciones pasadas',
      action: 'navigate',
      route: '/client/historial-pagos'
    }
  ];
  
  @Output() linkClicked = new EventEmitter<SettingLink>();

  onLinkClick(link: SettingLink) {
    this.linkClicked.emit(link);
  }
}












