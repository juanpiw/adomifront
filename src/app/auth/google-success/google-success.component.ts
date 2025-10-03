import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GoogleAuthService } from '../services/google-auth.service';

@Component({
  selector: 'app-google-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div class="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
        <div *ngIf="loading" class="flex flex-col items-center">
          <svg class="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Procesando autenticación...</h2>
          <p class="text-gray-600 dark:text-gray-400 mt-2">Por favor, espera un momento.</p>
        </div>
        
        <div *ngIf="success" class="flex flex-col items-center">
          <svg class="h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">¡Bienvenido a Adomi!</h2>
          <p class="text-gray-600 dark:text-gray-400 mt-2">Tu cuenta ha sido creada exitosamente.</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Redirigiendo a tu dashboard...</p>
        </div>
        
        <div *ngIf="error" class="flex flex-col items-center">
          <svg class="h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">Error de Autenticación</h2>
          <p class="text-gray-600 dark:text-gray-400 mt-2">{{ error }}</p>
          <button (click)="goToLogin()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./google-success.component.scss']
})
export class GoogleSuccessComponent implements OnInit {
  loading = true;
  success = false;
  error: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private googleAuth = inject(GoogleAuthService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    // Solo ejecutar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      console.log('[GOOGLE_SUCCESS] Procesando callback exitoso');
      this.processSuccessCallback();
    }
  }

  private processSuccessCallback() {
    try {
      // Obtener parámetros de la URL
      const token = this.route.snapshot.queryParams['token'];
      const refresh = this.route.snapshot.queryParams['refresh'];
      const userParam = this.route.snapshot.queryParams['user'];

      if (token && refresh && userParam) {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('[GOOGLE_SUCCESS] Usuario autenticado:', user);

        // Guardar tokens y usuario
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('adomi_access_token', token);
          localStorage.setItem('adomi_refresh_token', refresh);
          localStorage.setItem('adomi_user', JSON.stringify(user));
        }

        this.success = true;
        this.loading = false;

        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.redirectToDashboard(user.role);
        }, 2000);

      } else {
        throw new Error('Parámetros de autenticación incompletos');
      }

    } catch (error: any) {
      console.error('[GOOGLE_SUCCESS] Error:', error);
      this.error = error.message || 'Error al procesar la autenticación';
      this.loading = false;
    }
  }

  private redirectToDashboard(role: string) {
    if (isPlatformBrowser(this.platformId)) {
      if (role === 'provider') {
        this.router.navigate(['/dash/home']);
      } else {
        this.router.navigate(['/client/reservas']);
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
