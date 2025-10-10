import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';
import { PlanUpgradeAlertComponent, PlanInfo } from '../../../libs/shared-ui/plan-upgrade-alert/plan-upgrade-alert.component';
import { TopbarComponent, TopbarConfig } from '../../../libs/shared-ui/topbar/topbar.component';
import { PlanService } from '../../services/plan.service';
import { SessionService } from '../../auth/services/session.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dash-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent, PlanUpgradeAlertComponent, TopbarComponent],
  templateUrl: './dash-layout.component.html',
  styleUrls: ['./dash-layout.component.scss']
})
export class DashLayoutComponent implements OnInit {
  isCollapsed = false;
  planInfo: PlanInfo | null = null;
  showPlanAlert = false;
  providerName: string | null = null;
  providerAvatarUrl: string | null = null;

  // Configuración del topbar
  topbarConfig: TopbarConfig = {
    showSearch: true,
    showHamburger: true,
    showNotifications: true,
    showSettings: true,
    searchPlaceholder: '¿Necesitas ayuda con el dashboard?',
    helpContext: 'dashboard',
    userProfile: 'provider'
  };

  private planService = inject(PlanService);
  private sessionService = inject(SessionService);
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.loadPlanInfo();
    // Cargar nombre básico desde sesión/localStorage
    const u = this.sessionService.getUser();
    this.providerName = u?.name || null;
    // Refrescar datos desde backend si hay sesión
    this.auth.getCurrentUserInfo().subscribe({
      next: (res) => { this.providerName = res?.user?.name || this.providerName; },
      error: () => {}
    });
  }

  onNav() {
    if (window && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
    }
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src.indexOf('/assets/default-avatar.png') === -1) {
      img.src = '/assets/default-avatar.png';
    }
  }

  private loadPlanInfo() {
    const user = this.sessionService.getUser();
    if (user && user.role === 'provider') {
      this.planService.getCurrentPlan(user.id).subscribe({
        next: (response) => {
          if (response.ok && response.currentPlan) {
            this.planInfo = response.currentPlan;
            this.showPlanAlert = this.planService.shouldShowUpgradeAlert();
          }
        },
        error: (error) => {
          console.error('Error loading plan info:', error);
        }
      });
    }
  }

  onPlanUpgrade() {
    // El componente ya redirige a /auth/select-plan
    console.log('Upgrading plan...');
  }

  onPlanAlertDismiss() {
    this.showPlanAlert = false;
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
    console.log('Help clicked for context:', helpContext);
    // TODO: Implementar modal de ayuda contextual
    this.showHelpModal(helpContext);
  }

  private showHelpModal(context: string): void {
    // TODO: Implementar modal de ayuda
    // Por ahora solo un console.log
    const helpContent = this.getHelpContent(context);
    console.log('Mostrando ayuda para:', context, helpContent);
  }

  private getHelpContent(context: string): string {
    const helpContent = {
      'dashboard': 'Aquí puedes gestionar tu perfil, ver estadísticas, configurar servicios y más.',
      'perfil': 'Configura tu información personal, servicios, horarios y disponibilidad.',
      'agenda': 'Gestiona tus citas, horarios disponibles y configuración del calendario.',
      'general': 'Centro de ayuda general de Adomi.'
    };
    return helpContent[context as keyof typeof helpContent] || helpContent.general;
  }

  onNotificationClick(): void {
    console.log('Notifications clicked');
    // TODO: Implementar lógica de notificaciones
  }

  onSettingsClick(): void {
    console.log('Settings clicked');
    
    // Si estamos en la página de perfil, navegar al tab de configuración
    if (this.router.url.includes('/dash/perfil')) {
      this.router.navigate(['/dash/perfil'], {
        queryParams: { tab: 'configuracion' }
      });
    } else {
      // Para otras páginas, navegar al perfil con el tab de configuración
      this.router.navigate(['/dash/perfil'], {
        queryParams: { tab: 'configuracion' }
      });
    }
  }
}
