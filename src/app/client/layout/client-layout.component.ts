import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';
import { TopbarComponent, TopbarConfig } from '../../../libs/shared-ui/topbar/topbar.component';
import { AuthService } from '../../auth/services/auth.service';
import { MenuService } from '../services/menu.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent, TopbarComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  private menuSubscription?: Subscription;

  // Configuración del topbar para cliente
  topbarConfig: TopbarConfig = {
    showSearch: true,
    showHamburger: true,
    showNotifications: true,
    showSettings: true,
    searchPlaceholder: '¿Necesitas ayuda?',
    helpContext: 'cliente'
  };
  
  private auth = inject(AuthService);
  private router = inject(Router);
  menuService = inject(MenuService);

  ngOnInit() {
    // Initialize collapsed state based on screen size
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
    }

    // Listen for window resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (window.matchMedia('(max-width: 900px)').matches) {
          this.isCollapsed = true;
        } else {
          this.isCollapsed = false;
        }
      });
    }

    // Suscribirse al servicio de menú para controlar el sidebar desde el chat
    this.menuSubscription = this.menuService.isMenuOpen$.subscribe(isOpen => {
      this.isCollapsed = !isOpen;
    });
  }

  ngOnDestroy() {
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }

  onNav() {
    if (window && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
      this.menuService.closeMenu();
    }
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        // Logout exitoso, redirigir al home
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Aunque falle el logout en el servidor, ya se limpiaron los datos localmente
        // Redirigir al home de todas formas
        this.router.navigateByUrl('/');
      }
    });
  }

  // Event handlers del topbar
  onHelpClick(helpContext: string): void {
    console.log('Client help clicked for context:', helpContext);
    // TODO: Implementar modal de ayuda contextual para cliente
    this.showHelpModal(helpContext);
  }

  private showHelpModal(context: string): void {
    // TODO: Implementar modal de ayuda
    // Por ahora solo un console.log
    const helpContent = this.getHelpContent(context);
    console.log('Mostrando ayuda para cliente:', context, helpContent);
  }

  private getHelpContent(context: string): string {
    const helpContent = {
      'cliente': 'Aquí puedes explorar servicios, gestionar reservas, ver favoritos y más.',
      'explorar': 'Busca y encuentra los mejores profesionales para tus necesidades.',
      'reservas': 'Gestiona tus citas, ve el historial y cancela si es necesario.',
      'favoritos': 'Guarda tus profesionales favoritos para acceso rápido.',
      'perfil': 'Configura tu información personal y preferencias.',
      'general': 'Centro de ayuda para clientes de Adomi.'
    };
    return helpContent[context as keyof typeof helpContent] || helpContent.general;
  }

  onNotificationClick(): void {
    console.log('Client notifications clicked');
    // TODO: Implementar lógica de notificaciones para cliente
  }

  onSettingsClick(): void {
    this.router.navigate(['/client/configuracion']);
    this.onNav();
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
  }
}
