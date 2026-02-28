import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MisDatoPublicado } from '../models';
import { MisDatosDatoCardComponent } from '../mis-datos-dato-card/mis-datos-dato-card.component';

@Component({
  selector: 'ui-mis-datos-panel',
  standalone: true,
  imports: [CommonModule, MisDatosDatoCardComponent],
  templateUrl: './mis-datos-panel.component.html',
  styleUrls: ['./mis-datos-panel.component.scss']
})
export class MisDatosPanelComponent {
  @Input() datos: MisDatoPublicado[] = [];
}

