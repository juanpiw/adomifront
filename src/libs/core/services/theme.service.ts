import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const THEME_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private currentTheme = signal<'light' | 'dark'>(this.getInitialTheme());

  readonly theme = this.currentTheme.asReadonly();

  constructor() {
    if (this.isBrowser) {
      this.applyTheme(this.currentTheme());
    }
  }

  toggle() {
    const next = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme);
    if (this.isBrowser) {
      try { localStorage.setItem(THEME_KEY, theme); } catch {}
      this.applyTheme(theme);
    }
  }

  private getInitialTheme(): 'light' | 'dark' {
    if (!this.isBrowser) return 'light';
    try {
      const saved = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark') {
    if (!this.isBrowser) return;
    const root = document.documentElement;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('dark-theme', isDark);
  }
}
