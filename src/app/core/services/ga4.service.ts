import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
    __ADOMI_GA4_INIT__?: boolean;
  }
}

type Ga4Params = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class Ga4Service {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private measurementId = String((environment as any)?.gaMeasurementId || '').trim();

  constructor() {
    // Solo browser + solo si hay ID
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.measurementId) return;

    // Evitar doble init (hot reload / doble bootstrap / hydration)
    if (window.__ADOMI_GA4_INIT__) return;
    window.__ADOMI_GA4_INIT__ = true;

    this.init();
  }

  private init(): void {
    this.ensureGtagLoaded();

    // SPA page views (evita duplicados con send_page_view:false)
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.pageView(e.urlAfterRedirects || e.url || '/');
      });

    // Primer page view (por si no hay NavigationEnd inmediato)
    try {
      this.pageView(location.pathname + location.search + location.hash);
    } catch {}
  }

  private ensureGtagLoaded(): void {
    // dataLayer + gtag shim
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtagShim() {
        // Importante: gtag.js espera que se encole `arguments` (como el snippet oficial),
        // no un array de args. Si se encola mal, no se envían hits a GA4.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments as any);
      };

    // Insertar script solo una vez
    const scriptId = `ga4-gtag-${this.measurementId}`;
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
      document.head.appendChild(s);
    }

    // Config base
    window.gtag('js', new Date());
    const debugMode = (() => {
      try {
        return localStorage.getItem('ga_debug') === '1';
      } catch {
        return false;
      }
    })();
    window.gtag('config', this.measurementId, { send_page_view: false, debug_mode: debugMode });
  }

  pageView(path: string): void {
    if (!this.measurementId || !window.gtag) return;
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: (() => {
        try {
          return location.href;
        } catch {
          return undefined;
        }
      })(),
      page_title: (() => {
        try {
          return document.title;
        } catch {
          return undefined;
        }
      })()
    });
  }

  event(name: string, params?: Ga4Params): void {
    if (!this.measurementId || !window.gtag) return;
    const clean = String(name || '').trim();
    if (!clean) return;
    window.gtag('event', clean, params || {});
  }
}

