import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CanceladaClienteData {
  avatarUrl: string;
  titulo: string;
  fecha: string;
  estadoPill?: string; // Gestionando Reembolso
}

@Component({
  selector: 'ui-cancelada-cliente-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancelada-cliente-card.component.html',
  styleUrls: ['./cancelada-cliente-card.component.scss']
})
export class CanceladaClienteCardComponent {
  @Input() data!: CanceladaClienteData;
  @Output() rebook = new EventEmitter<void>();
}








