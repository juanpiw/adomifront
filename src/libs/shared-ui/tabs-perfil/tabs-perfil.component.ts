import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TabType = 'perfil-publico' | 'verificacion' | 'configuracion' | 'ver-perfil-publico';

@Component({
  selector: 'app-tabs-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs-perfil.component.html',
  styleUrls: ['./tabs-perfil.component.scss']
})
export class TabsPerfilComponent {
  @Input() activeTab: TabType = 'perfil-publico';
  @Output() tabChange = new EventEmitter<TabType>();

  tabs = [
    { id: 'perfil-publico', label: 'Perfil Público' },
    { id: 'verificacion', label: 'Verificación' },
    { id: 'configuracion', label: 'Configuración de Horarios' },
    { id: 'ver-perfil-publico', label: 'Ver Perfil Público' }
  ] as const;

  onTabClick(tabId: TabType) {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }

  isActive(tabId: TabType): boolean {
    return this.activeTab === tabId;
  }
}
