import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSwitchComponent } from '../../../libs/shared-ui/theme-switch/theme-switch.component';
import { IconComponent } from '../../../libs/shared-ui/icon/icon.component';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ThemeSwitchComponent, IconComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent implements OnInit {
  isCollapsed = false;
  
  private auth = inject(AuthService);
  private router = inject(Router);

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
  }

  onNav() {
    if (window && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      this.isCollapsed = true;
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
}
