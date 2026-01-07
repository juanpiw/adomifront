import { Injectable, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Logger liviano para depurar rutas y flujo de navegación.
 * Se activa al inyectarse (p. ej. en App) y escribe en consola cada cambio.
 */
@Injectable({ providedIn: 'root' })
export class RouterLoggerService {
  private router = inject(Router);
  private lastUrl = '(init)';

  constructor() {
    // Evitar ruido en SSR
    if (typeof window === 'undefined') {
      return;
    }

    this.router.events
      .pipe(
        filter((event: Event) =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
      )
      .subscribe((event: Event) => {
        if (event instanceof NavigationStart) {
          console.log('[ROUTER] 🚦 start', {
            from: this.lastUrl,
            to: event.url,
            navId: event.id
          });
        } else if (event instanceof NavigationEnd) {
          this.lastUrl = event.urlAfterRedirects || event.url;
          console.log('[ROUTER] ✅ end', {
            url: event.url,
            urlAfterRedirects: event.urlAfterRedirects,
            navId: event.id
          });
        } else if (event instanceof NavigationCancel) {
          console.warn('[ROUTER] ⛔ cancel', {
            url: event.url,
            navId: event.id
          });
        } else if (event instanceof NavigationError) {
          console.error('[ROUTER] 💥 error', {
            url: event.url,
            navId: event.id,
            error: event.error
          });
        }
      });
  }
}



