import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-payment-methods-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-methods-header.component.html',
  styleUrls: ['./payment-methods-header.component.scss']
})
export class PaymentMethodsHeaderComponent {
  title = 'Métodos de Pago';
  subtitle = 'Administra tus tarjetas y monederos digitales para agendar más rápido.';
}







