import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GoogleAuthService } from '../services/google-auth.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-google-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-container">
      <div class="success-card">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <div class="spinner-container">
            <div class="spinner"></div>
            <div class="spinner-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <div class="content-section">
            <h2 class="loading-text">Procesando tu cuenta...</h2>
            <p class="subtitle">Estamos configurando todo para ti</p>
          </div>
        </div>
        
        <!-- Success State -->
        <div *ngIf="success" class="success-state">
          <div class="success-icon-container">
            <div class="success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="star-badge">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
          
          <div class="content-section">
            <h2>¡Bienvenido a Adomi!</h2>
            <p class="subtitle">Tu cuenta ha sido creada exitosamente</p>
            <div class="info-box">
              <p class="info-text">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                Autenticación con Google completada
              </p>
            </div>
          </div>
          
          <div class="button-section">
            <button (click)="goToDashboard()" class="btn btn-primary">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
              </svg>
              Ir a Mi Dashboard
            </button>
            
            <p class="countdown-text">
              Te redirigiremos automáticamente en {{ countdown }} segundos
            </p>
          </div>
        </div>
        
        <!-- Error State -->
        <div *ngIf="error" class="error-state">
          <div class="error-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <div class="content-section">
            <h2 class="error-title">Error de Autenticación</h2>
            <p class="error-message">{{ error }}</p>
          </div>
          
          <button (click)="goToLogin()" class="btn btn-secondary">
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
  private auth = inject(AuthService);

  ngOnInit() {
    console.log('🟢 [GOOGLE_SUCCESS] ==================== COMPONENTE INICIALIZADO ====================');
    console.log('🟢 [GOOGLE_SUCCESS] Timestamp:', new Date().toISOString());
    
    // Solo ejecutar en el navegador
    if (isPlatformBrowser(this.platformId)) {
      console.log('🟢 [GOOGLE_SUCCESS] Platform es navegador, procesando callback');
      console.log('🟢 [GOOGLE_SUCCESS] URL completa:', typeof window !== 'undefined' ? window.location.href : 'N/A');
      this.processSuccessCallback();
    } else {
      console.error('🔴 [GOOGLE_SUCCESS] Platform NO es navegador (SSR)');
    }
  }

  private processSuccessCallback() {
    console.log('🟢 [GOOGLE_SUCCESS] ==================== PROCESANDO SUCCESS CALLBACK ====================');
    console.log('🟢 [GOOGLE_SUCCESS] Timestamp:', new Date().toISOString());
    
    try {
      // Obtener parámetros de la URL
      console.log('🟢 [GOOGLE_SUCCESS] Extrayendo parámetros de query string...');
      const tokenParam = this.route.snapshot.queryParams['token'];
      const refreshParam = this.route.snapshot.queryParams['refresh'];
      const userParam = this.route.snapshot.queryParams['user'];

      console.log('🟢 [GOOGLE_SUCCESS] Query params extraídos:', {
        token: tokenParam ? `${tokenParam.substring(0, 20)}...` : 'NULL',
        refresh: refreshParam ? `${refreshParam.substring(0, 20)}...` : 'NULL',
        user: userParam ? `${userParam.substring(0, 50)}...` : 'NULL'
      });

      if (tokenParam && refreshParam && userParam) {
        console.log('🟢 [GOOGLE_SUCCESS] ✅ Todos los parámetros presentes');
        console.log('🟢 [GOOGLE_SUCCESS] Decodificando tokens...');
        
        const accessToken = decodeURIComponent(tokenParam);
        const refreshToken = decodeURIComponent(refreshParam);
        
        console.log('🟢 [GOOGLE_SUCCESS] ✅ Tokens decodificados');
        console.log('🟢 [GOOGLE_SUCCESS] Parseando userParam...');
        
        let user: any = {};
        try {
          user = JSON.parse(decodeURIComponent(userParam));
          console.log('🟢 [GOOGLE_SUCCESS] ✅ User parseado exitosamente:', user);
          // Sembrar googleAuthMode si viene en user.mode
          try {
            if (user && user.mode && typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('googleAuthMode', user.mode);
            }
          } catch {}
        } catch (e) {
          console.error('🔴 [GOOGLE_SUCCESS] ❌ Error parseando userParam:', e);
          user = {};
        }

        // Guardar tokens y usuario
        if (typeof localStorage !== 'undefined') {
          console.log('🟢 [GOOGLE_SUCCESS] localStorage disponible, guardando datos...');
          console.log('🟢 [GOOGLE_SUCCESS] User object a guardar:', JSON.stringify(user));
          
          localStorage.setItem('adomi_access_token', accessToken);
          console.log('🟢 [GOOGLE_SUCCESS] ✅ Access token guardado');
          
          localStorage.setItem('adomi_refresh_token', refreshToken);
          console.log('🟢 [GOOGLE_SUCCESS] ✅ Refresh token guardado');
          
          localStorage.setItem('adomi_user', JSON.stringify(user));
          console.log('🟢 [GOOGLE_SUCCESS] ✅ User guardado');
          
          // Verificar que se guardó correctamente
          console.log('🟢 [GOOGLE_SUCCESS] Verificando guardado en localStorage...');
          const savedToken = localStorage.getItem('adomi_access_token');
          const savedUser = localStorage.getItem('adomi_user');
          
          console.log('🟢 [GOOGLE_SUCCESS] Access token verificado:', savedToken ? `${savedToken.substring(0, 20)}...` : 'NULL');
          console.log('🟢 [GOOGLE_SUCCESS] User JSON verificado:', savedUser);
          
          try {
            const parsedSavedUser = JSON.parse(savedUser || '{}');
            console.log('🟢 [GOOGLE_SUCCESS] User parseado desde localStorage:', parsedSavedUser);
          } catch (e) {
            console.error('🔴 [GOOGLE_SUCCESS] ❌ Error parseando user guardado:', e);
          }
        } else {
          console.error('🔴 [GOOGLE_SUCCESS] localStorage NO disponible');
        }

        this.success = true;
        this.loading = false;

        // Hidratar usuario desde backend para confirmar sesión válida
        this.auth.getCurrentUserInfo().subscribe({
          next: (userInfo) => {
            console.log('[GOOGLE_SUCCESS] Usuario hidratado desde backend:', userInfo);
            // Verificar que el usuario del backend coincida con el de la URL
            console.log('[GOOGLE_SUCCESS] Respuesta completa de getCurrentUserInfo:', userInfo);
            
            // Extraer usuario de la respuesta (puede venir como data.user o user)
            const backendUser = (userInfo as any).data?.user || (userInfo as any).user || userInfo.user;
            console.log('[GOOGLE_SUCCESS] Usuario extraído del backend:', backendUser);
            
            if (backendUser) {
              console.log('[GOOGLE_SUCCESS] Verificando consistencia de usuario...');
              console.log('[GOOGLE_SUCCESS] Usuario URL:', user);
              console.log('[GOOGLE_SUCCESS] Usuario Backend:', backendUser);
              
              // Verificar si tenemos un usuario válido de la URL
              if (user && user.id) {
                // Si los roles no coinciden, usar el de la URL (más confiable para registro)
                if (user.role && user.role !== backendUser.role) {
                  console.log('[GOOGLE_SUCCESS] ⚠️ Conflicto de roles detectado!');
                  console.log('[GOOGLE_SUCCESS] URL role:', user.role, 'Backend role:', backendUser.role);
                  console.log('[GOOGLE_SUCCESS] Usando rol de URL para registro:', user.role);
                  
                  // Crear usuario híbrido con rol de URL pero datos frescos del backend
                  const hybridUser = { ...backendUser, role: user.role };
                  localStorage.setItem('adomi_user', JSON.stringify(hybridUser));
                  console.log('[GOOGLE_SUCCESS] Usuario híbrido guardado:', hybridUser);
                } else {
                  // Los roles coinciden, actualizar localStorage con datos frescos del backend
                  localStorage.setItem('adomi_user', JSON.stringify(backendUser));
                  console.log('[GOOGLE_SUCCESS] Usuario actualizado desde backend:', backendUser);
                }
              } else {
                // No tenemos usuario de URL, usar el del backend
                localStorage.setItem('adomi_user', JSON.stringify(backendUser));
                console.log('[GOOGLE_SUCCESS] Usuario guardado desde backend (sin URL):', backendUser);
              }
            } else {
              console.warn('[GOOGLE_SUCCESS] No se pudo extraer usuario del backend, manteniendo usuario de URL');
            }
            this.startCountdown();
          },
          error: (error) => {
            console.warn('[GOOGLE_SUCCESS] Error hidratando usuario, continuando con datos locales:', error);
            this.startCountdown();
          }
        });

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
        // Obtener el rol del usuario desde localStorage (parseo seguro)
        try {
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
          console.log('[GOOGLE_SUCCESS] Raw localStorage value:', raw);
          console.log('[GOOGLE_SUCCESS] Raw type:', typeof raw, 'is undefined string?', raw === 'undefined');
          const user = raw && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : {};
          console.log('[GOOGLE_SUCCESS] Countdown redirect con user:', user);
          console.log('[GOOGLE_SUCCESS] User role:', user?.role);
          this.redirectAfterGoogle(user);
        } catch (e) {
          console.warn('[GOOGLE_SUCCESS] Error parseando adomi_user en countdown:', e);
          this.redirectAfterGoogle({});
        }
      }
    }, 1000);
  }

  goToDashboard() {
    clearInterval(this.countdownInterval);
    // Obtener el rol del usuario desde localStorage (parseo seguro)
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
      console.log('[GOOGLE_SUCCESS] goToDashboard - Raw localStorage value:', raw);
      const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {};
      console.log('[GOOGLE_SUCCESS] goToDashboard - User parsed:', user);
      this.redirectAfterGoogle(user);
    } catch (e) {
      console.error('[GOOGLE_SUCCESS] goToDashboard - Error parsing user:', e);
      this.redirectAfterGoogle({});
    }
  }

  private redirectAfterGoogle(user: any) {
    if (!isPlatformBrowser(this.platformId)) return;
    const role = user?.role;
    console.log('[GOOGLE_SUCCESS] redirectAfterGoogle - user:', user, 'role:', role);
    
    // Determinar si venimos de registro o login (opcional)
    const mode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('googleAuthMode') : null;
    console.log('[GOOGLE_SUCCESS] googleAuthMode from sessionStorage:', mode);
    
    // FIX TEMPORAL: Si el usuario está vacío pero tenemos datos en localStorage, usarlos
    if (!user || Object.keys(user).length === 0) {
      console.log('[GOOGLE_SUCCESS] Usuario vacío, intentando recuperar desde localStorage');
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_user') : null;
        if (raw && raw !== 'undefined' && raw !== 'null') {
          user = JSON.parse(raw);
          console.log('[GOOGLE_SUCCESS] Usuario recuperado desde localStorage:', user);
        }
      } catch (e) {
        console.error('[GOOGLE_SUCCESS] Error recuperando usuario desde localStorage:', e);
      }
    }
    
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('googleAuthMode');
    }

    const finalRole = user?.role;
    const pendingRole = user?.pending_role;
    const intendedRole = user?.intendedRole;
    console.log('[GOOGLE_SUCCESS] Rol final para redirección:', { finalRole, pendingRole, intendedRole, mode });

    // Nuevo: si el usuario fue creado como client pero viene con pending_role/intendedRole provider en registro → ir a select-plan
    if ((finalRole === 'provider') || (finalRole === 'client' && (pendingRole === 'provider' || intendedRole === 'provider'))) {
      console.log('[GOOGLE_SUCCESS] Redirigiendo provider, mode:', mode);
      if (mode === 'register') {
        // Sembrar datos mínimos para el flujo de plan/checkout
        try {
          const temp = { email: user?.email || '', name: user?.name || '', role: 'provider' };
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('tempUserData', JSON.stringify(temp));
            sessionStorage.setItem('googleAuthMode', 'register');
          }
          console.log('[GOOGLE_SUCCESS] Navegando a select-plan con temp data:', temp);
        } catch {}
        this.router.navigate(['/auth/select-plan']);
        return;
      }
      // Provider existente → ir al dashboard
      console.log('[GOOGLE_SUCCESS] Navegando a dash para provider existente');
      this.router.navigate(['/dash']);
      return;
    }

    // Clientes → a su área
    console.log('[GOOGLE_SUCCESS] Navegando a client/reservas para cliente');
    this.router.navigate(['/client/reservas']);
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
