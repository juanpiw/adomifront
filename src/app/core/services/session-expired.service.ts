import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../auth/services/session.service';

@Injectable({ providedIn: 'root' })
export class SessionExpiredService {
  private router = inject(Router);
  private session = inject(SessionService);

  private openSig = signal(false);
  private messageSig = signal<string>('Tu sesión expiró. Por favor, vuelve a iniciar sesión.');
  private isShowing = false;

  isOpen() {
    return this.openSig();
  }

  message() {
    return this.messageSig();
  }

  open(message?: string) {
    if (this.isShowing) return; // evita múltiples modales simultáneos
    if (message) this.messageSig.set(message);
    this.isShowing = true;
    this.openSig.set(true);
    // Auto-cierre y redirección en 8s para evitar bloqueo
    setTimeout(() => {
      if (this.isShowing) {
        this.forceRedirect();
      }
    }, 8000);
  }

  close() {
    this.openSig.set(false);
    this.isShowing = false;
  }

  confirmReLogin() {
    // Limpiar sesión y enviar al login con flag de expiración
    this.session.clearSession();
    this.close();
    this.router.navigate(['/auth/login'], { queryParams: { expired: '1' } });
  }

  forceRedirect(message?: string) {
    if (message) this.messageSig.set(message);
    try { this.session.clearSession(); } catch {}
    this.close();
    this.router.navigate(['/auth/login'], { queryParams: { expired: '1' } });
  }
}




