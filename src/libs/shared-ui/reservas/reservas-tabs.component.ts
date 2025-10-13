import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-reservas-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas-tabs.component.html',
  styleUrls: ['./reservas-tabs.component.scss']
})
export class ReservasTabsComponent {
  @Input() tabs: string[] = ['Próximas', 'Pasadas', 'Canceladas'];
  @Input() activeIndex: number = 0;
  @Output() tabChange = new EventEmitter<number>();

  setActive(index: number) {
    if (index !== this.activeIndex) {
      this.activeIndex = index;
      this.tabChange.emit(index);
    }
  }
}





