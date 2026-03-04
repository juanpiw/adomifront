import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

type SeoRouteData = {
  title?: string;
  description?: string;
  keywords?: string;
  noindex?: boolean;
  type?: string;
  canonicalPath?: string;
};

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly siteUrl = 'https://www.adomiapp.com';
  private readonly defaultTitle = 'AdomiApp | Servicios a domicilio confiables en Chile';
  private readonly defaultDescription =
    'Encuentra expertos a domicilio en minutos: limpieza, gasfiter, electricidad, manicure, peluqueria y mas. Reserva seguro con AdomiApp.';
  private readonly defaultKeywords =
    'servicios a domicilio, expertos a domicilio, profesionales a domicilio, adomiapp, chile';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateRouteSeo());

    this.updateRouteSeo();
  }

  private updateRouteSeo(): void {
    const seo = this.resolveSeoData();
    const currentPath = seo.canonicalPath ?? this.router.url.split('#')[0].split('?')[0];
    const canonicalUrl = this.buildCanonicalUrl(currentPath);
    const title = seo.title || this.defaultTitle;
    const description = seo.description || this.defaultDescription;
    const keywords = seo.keywords || this.defaultKeywords;
    const robots = seo.noindex ? 'noindex, nofollow' : 'index, follow';
    const ogType = seo.type || 'website';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: robots });

    this.meta.updateTag({ property: 'og:locale', content: 'es_CL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'AdomiApp' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:url', content: canonicalUrl });

    this.setCanonical(canonicalUrl);
    this.upsertHomeJsonLd();
  }

  private resolveSeoData(): SeoRouteData {
    const dataChain: SeoRouteData[] = [];
    let route: ActivatedRoute | null = this.activatedRoute.root;

    while (route) {
      const seo = route.snapshot.data['seo'] as SeoRouteData | undefined;
      if (seo) {
        dataChain.push(seo);
      }
      route = route.firstChild;
    }

    return Object.assign({}, ...dataChain);
  }

  private buildCanonicalUrl(path: string): string {
    if (!path || path === '/') {
      return this.siteUrl;
    }

    if (isPlatformBrowser(this.platformId) && this.document.location?.origin) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${this.document.location.origin}${cleanPath}`;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.siteUrl}${cleanPath}`;
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private upsertHomeJsonLd(): void {
    const scriptId = 'adomiapp-jsonld';
    const existing = this.document.getElementById(scriptId);
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AdomiApp',
      url: this.siteUrl,
      logo: `${this.siteUrl}/favicon.svg`,
      sameAs: ['https://www.instagram.com/adomiapp', 'https://www.facebook.com/adomiapp']
    };

    const script = existing ?? this.document.createElement('script');
    script.id = scriptId;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(jsonLd);

    if (!existing) {
      this.document.head.appendChild(script);
    }
  }
}
