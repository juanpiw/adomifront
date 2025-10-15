import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabConfig } from '../interfaces';

@Component({
  selector: 'ui-tab-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-navigation.component.html',
  styleUrls: ['./tab-navigation.component.scss']
})
export class TabNavigationComponent {
  @Input() tabs: TabConfig[] = [
    { id: 'resumen', label: 'Resumen de Ingresos', isActive: true },
    { id: 'pagos', label: 'Configuración de Pagos', isActive: false },
    { id: 'metas', label: 'Metas de Ingreso', isActive: false }
  ];
  
  @Output() tabChanged = new EventEmitter<string>();

  onTabClick(tabId: string) {
    // Actualizar estado de pestañas
    this.tabs = this.tabs.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    }));
    
    // Emitir evento
    this.tabChanged.emit(tabId);
  }
}






