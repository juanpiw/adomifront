import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GoogleAuthService } from '../services/google-auth.service';

@Component({
  selector: 'app-google-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div class="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl text-center max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-700">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex flex-col items-center space-y-6">
          <div class="relative">
            <div class="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Procesando tu cuenta...</h2>
            <p class="text-gray-600 dark:text-gray-400">Estamos configurando todo para ti</p>
          </div>
        </div>
        
        <!-- Success State -->
        <div *ngIf="success" class="flex flex-col items-center space-y-6">
          <div class="relative">
            <div class="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-bounce">
              <svg class="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
          
          <div class="space-y-3">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white">¡Bienvenido a Adomi!</h2>
            <p class="text-lg text-gray-600 dark:text-gray-400">Tu cuenta ha sido creada exitosamente</p>
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p class="text-sm text-green-800 dark:text-green-300">
                <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                Autenticación con Google completada
              </p>
            </div>
          </div>
          
          <div class="w-full space-y-3">
            <button 
              (click)="goToDashboard()" 
              class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
              </svg>
              Ir a Mi Dashboard
            </button>
            
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Te redirigiremos automáticamente en {{ countdown }} segundos
            </p>
          </div>
        </div>
        
        <!-- Error State -->
        <div *ngIf="error" class="flex flex-col items-center space-y-6">
          <div class="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <div class="space-y-3">
            <h2 class="text-2xl font-bold text-red-600 dark:text-red-400">Error de Autenticación</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
          </div>
          
          <button (click)="goToLogin()" class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200">
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./google-success.component.scss']
})
export class GoogleSuccessComponent implements OnInit, OnDestroy {
  loading = true;
  success = false;
  error: string | null = null;
  countdown = 5;
  private countdownInterval: any;

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

        // Iniciar countdown
        this.startCountdown();

      } else {
        throw new Error('Parámetros de autenticación incompletos');
      }

    } catch (error: any) {
      console.error('[GOOGLE_SUCCESS] Error:', error);
      this.error = error.message || 'Error al procesar la autenticación';
      this.loading = false;
    }
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        // Obtener el rol del usuario desde localStorage
        const user = JSON.parse(localStorage.getItem('adomi_user') || '{}');
        this.redirectToDashboard(user.role);
      }
    }, 1000);
  }

  goToDashboard() {
    clearInterval(this.countdownInterval);
    // Obtener el rol del usuario desde localStorage
    const user = JSON.parse(localStorage.getItem('adomi_user') || '{}');
    this.redirectToDashboard(user.role);
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
    clearInterval(this.countdownInterval);
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
