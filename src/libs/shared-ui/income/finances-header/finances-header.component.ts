import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'ui-finances-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './finances-header.component.html',
  styleUrls: ['./finances-header.component.scss']
})
export class FinancesHeaderComponent {
  // Componente simple de presentación
}



