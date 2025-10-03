import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div *ngIf="loading" class="space-y-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 class="text-xl font-semibold text-gray-800">Procesando autenticación...</h2>
          <p class="text-gray-600">Por favor espera mientras completamos tu login con Google.</p>
        </div>
        
        <div *ngIf="error" class="space-y-4">
          <div class="text-red-500 text-6xl">⚠️</div>
          <h2 class="text-xl font-semibold text-gray-800">Error de autenticación</h2>
          <p class="text-gray-600">{{ error }}</p>
          <button 
            (click)="goToLogin()"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Volver al Login
          </button>
        </div>

        <div *ngIf="success" class="space-y-4">
          <div class="text-green-500 text-6xl">✅</div>
          <h2 class="text-xl font-semibold text-gray-800">¡Autenticación exitosa!</h2>
          <p class="text-gray-600">Te estamos redirigiendo a tu dashboard...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class GoogleCallbackComponent implements OnInit {
  loading = true;
  error: string | null = null;
  success = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private googleAuth = inject(GoogleAuthService);

  ngOnInit() {
    // Solo ejecutar en el navegador
    if (typeof window !== 'undefined') {
      console.log('[GOOGLE_CALLBACK] Iniciando procesamiento de callback');
      
      // Obtener la URL completa
      const currentUrl = window.location.href;
      console.log('[GOOGLE_CALLBACK] URL actual:', currentUrl);

      // Procesar el callback
      this.processCallback(currentUrl);
    }
  }

  private processCallback(url: string) {
    try {
      this.googleAuth.handleGoogleCallback(url);
      this.success = true;
      this.loading = false;
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        this.redirectToDashboard();
      }, 2000);
      
    } catch (error) {
      console.error('[GOOGLE_CALLBACK] Error al procesar callback:', error);
      this.error = 'Error al procesar la autenticación con Google.';
      this.loading = false;
    }
  }

  private redirectToDashboard() {
    // Solo ejecutar en el navegador
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Obtener el rol del usuario desde la sesión
      const user = JSON.parse(localStorage.getItem('adomi_user') || '{}');
      
      if (user.role === 'provider') {
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
