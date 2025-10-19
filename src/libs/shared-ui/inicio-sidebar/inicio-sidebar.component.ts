import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
}

export interface SidebarData {
  brandTitle: string;
  items: SidebarItem[];
  footerItem: SidebarItem;
}

@Component({
  selector: 'app-inicio-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-sidebar.component.html',
  styleUrls: ['./inicio-sidebar.component.scss']
})
export class InicioSidebarComponent {
  @Input() data: SidebarData = {
    brandTitle: 'Adomi',
    items: [
      { id: 'inicio', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a2 2 0 002 2h10a2 2 0 002-2V10M9 20v-6a2 2 0 012-2h2a2 2 0 012 2v6', route: '/dash/home', active: true },
      { id: 'agenda', label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', route: '/dash/agenda' },
      { id: 'ingresos', label: 'Ingresos', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', route: '/dash/ingresos' },
      { id: 'estadisticas', label: 'Estadísticas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z', route: '/dash/estadisticas' },
      { id: 'mensajes', label: 'Mensajes', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', route: '/dash/mensajes' },
      { id: 'servicios', label: 'Mis Servicios', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z', route: '/dash/servicios' },
      { id: 'promocion', label: 'Promoción', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', route: '/dash/promocion' }
    ],
    footerItem: { id: 'perfil', label: 'Mi Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', route: '/dash/perfil' }
  };

  @Output() itemClick = new EventEmitter<SidebarItem>();

  onItemClick(item: SidebarItem) {
    this.itemClick.emit(item);
  }
}







