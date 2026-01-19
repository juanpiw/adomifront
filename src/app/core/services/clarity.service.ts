import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
    __ADOMI_CLARITY_INIT__?: boolean;
  }
}

@Injectable({ providedIn: 'root' })
export class ClarityService {
  private platformId = inject(PLATFORM_ID);
  private projectId = String((environment as any)?.clarityProjectId || '').trim();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.projectId) return;
    if (window.__ADOMI_CLARITY_INIT__) return;
    window.__ADOMI_CLARITY_INIT__ = true;

    this.init(this.projectId);
  }

  init(projectId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = String(projectId || '').trim();
    if (!id) return;

    // Evitar duplicados
    const scriptId = `clarity-${id}`;
    if (document.getElementById(scriptId)) return;

    // Snippet oficial (load async)
    (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      t.id = scriptId;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window as any, document, 'clarity', 'script', id);
  }
}

