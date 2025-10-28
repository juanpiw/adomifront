import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces
export interface BasicInfo {
  fullName: string;
  professionalTitle: string;
  mainCommune: string;
  mainRegion?: string;
  yearsExperience: number;
}

export interface Service {
  id?: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  category_id?: number;
  custom_category?: string;
  service_image_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  order_index?: number;
  booking_count?: number;
  average_rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioItem {
  id?: number;
  file_url: string;
  file_type: 'image' | 'video';
  title?: string;
  description?: string;
  order_index?: number;
  thumbnail_url?: string;
}

export interface CoverageZone {
  id?: number;
  commune: string;
  region: string;
  is_primary?: boolean;
}

export interface Availability {
  is_online: boolean;
  share_real_time_location: boolean;
}

export interface CurrentLocationPayload {
  lat: number;
  lng: number;
}

export interface ProviderProfile {
  id: number;
  provider_id: number;
  full_name: string;
  professional_title?: string;
  main_commune?: string;
  main_region?: string;
  years_experience: number;
  bio?: string;
  profile_photo_url?: string;
  cover_photo_url?: string;
  profile_completion: number;
  is_online?: boolean;
  share_real_time_location?: boolean;
  is_verified: boolean;
  verification_status: string;
  rating_average: string;
  review_count: number;
  created_at: string;
  updated_at: string;
  bank_name?: string | null;
  bank_account?: string | null;
  account_holder?: string | null;
  account_rut?: string | null;
  account_type?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Subjects para estado reactivo
  private profileSubject = new BehaviorSubject<ProviderProfile | null>(null);
  private servicesSubject = new BehaviorSubject<Service[]>([]);
  private portfolioSubject = new BehaviorSubject<PortfolioItem[]>([]);
  private coverageZonesSubject = new BehaviorSubject<CoverageZone[]>([]);

  // Observables públicos
  public profile$ = this.profileSubject.asObservable();
  public services$ = this.servicesSubject.asObservable();
  public portfolio$ = this.portfolioSubject.asObservable();
  public coverageZones$ = this.coverageZonesSubject.asObservable();

  constructor() {}

  private getHeaders(): HttpHeaders {
    // Usar el token estándar de la app
    const token = localStorage.getItem('adomi_access_token') || localStorage.getItem('adomi_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ============================================
  // PERFIL BÁSICO
  // ============================================

  /**
   * Obtener perfil del profesional
   */
  getProfile(): Observable<ProviderProfile> {
    return this.http.get<{success: boolean, profile: ProviderProfile}>(
      `${this.apiUrl}/provider/profile`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.profile),
      tap(profile => this.profileSubject.next(profile))
    );
  }

  /**
   * Actualizar información básica del perfil
   */
  updateBasicInfo(info: Partial<BasicInfo>): Observable<any> {
    const payload = {
      full_name: info.fullName,
      professional_title: info.professionalTitle,
      main_commune: info.mainCommune,
      main_region: info.mainRegion || null, // Permitir null si no se proporciona
      years_experience: info.yearsExperience
    };

    console.log('[ProviderProfileService] Enviando datos básicos:', payload);

    return this.http.put(
      `${this.apiUrl}/provider/profile`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response) => {
        console.log('[ProviderProfileService] Respuesta del servidor:', response);
        this.getProfile().subscribe(); // Refrescar perfil
      })
    );
  }

  /**
   * Actualizar biografía
   */
  updateBio(bio: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/provider/profile`,
      { bio },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.getProfile().subscribe())
    );
  }

  /**
   * Subir foto de perfil o portada
   */
  uploadPhoto(file: File, type: 'profile' | 'cover'): Observable<any> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);

    const token = localStorage.getItem('adomi_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // NO incluir Content-Type para FormData
    });

    return this.http.post(
      `${this.apiUrl}/provider/upload/photo`,
      formData,
      { headers }
    ).pipe(
      tap(() => this.getProfile().subscribe())
    );
  }

  /**
   * Subir archivo al portafolio (imagen o video)
   */
  uploadPortfolioFile(file: File, title?: string, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const token = localStorage.getItem('adomi_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(
      `${this.apiUrl}/provider/upload/portfolio`,
      formData,
      { headers }
    ).pipe(
      tap(() => this.getPortfolio().subscribe())
    );
  }

  // ============================================
  // SERVICIOS
  // ============================================

  /**
   * Obtener servicios del profesional
   */
  getServices(): Observable<Service[]> {
    return this.http.get<{success: boolean, services: Service[]}>(
      `${this.apiUrl}/provider/services`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.services),
      tap(services => this.servicesSubject.next(services))
    );
  }

  /**
   * Crear nuevo servicio
   */
  createService(service: Service): Observable<Service> {
    return this.http.post<{success: boolean, service: Service}>(
      `${this.apiUrl}/provider/services`,
      service,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.service),
      tap(() => this.getServices().subscribe())
    );
  }

  /**
   * Crear nuevo servicio
   */
  addService(service: any): Observable<{success: boolean, service: Service}> {
    console.log('[ProviderProfileService] ===== INICIANDO addService =====');
    console.log('[ProviderProfileService] Datos del servicio:', service);
    console.log('[ProviderProfileService] URL:', `${this.apiUrl}/provider/services`);
    console.log('[ProviderProfileService] Headers:', this.getHeaders());
    
    const durationParsed = Number(
      service?.duration_minutes ?? service?.duration ?? 0
    );
    const payload: any = {
      name: service?.name,
      description: service?.description || null,
      price: Number(service?.price) || 0,
      duration_minutes: durationParsed > 0 ? durationParsed : 30,
    };

    // Pasar category_id si viene numérico válido
    if (Number.isFinite(Number(service?.category_id))) {
      payload.category_id = Number(service.category_id);
    }
    // Pasar custom_category si existe texto
    if (typeof service?.custom_category === 'string' && service.custom_category.trim().length > 0) {
      payload.custom_category = service.custom_category.trim();
    } else if (typeof service?.type === 'string' && service.type.trim().length > 0) {
      // Fallback: usar el nombre del tipo seleccionado si no hay custom_category
      payload.custom_category = service.type.trim();
    }

    return this.http.post<{success: boolean, service: Service}>(
      `${this.apiUrl}/provider/services`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response) => {
        console.log('[ProviderProfileService] ✅ Respuesta del POST /provider/services:', response);
        console.log('[ProviderProfileService] Tipo de respuesta:', typeof response);
        console.log('[ProviderProfileService] response.success:', response?.success);
        console.log('[ProviderProfileService] response.service:', response?.service);
        this.getServices().subscribe();
      }),
      catchError((error) => {
        console.error('[ProviderProfileService] ❌ ERROR en POST /provider/services:', error);
        console.error('[ProviderProfileService] Error status:', error.status);
        console.error('[ProviderProfileService] Error message:', error.message);
        try {
          console.error('[ProviderProfileService] Error body (raw):', (error as any)?.error);
          if (typeof (error as any)?.error === 'string') {
            console.error('[ProviderProfileService] Error body (parsed):', JSON.parse((error as any).error));
          }
        } catch (e) {
          console.warn('[ProviderProfileService] No se pudo parsear err.error como JSON');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar servicio
   */
  updateService(id: number, service: any): Observable<{success: boolean, service: Service}> {
    return this.http.put<{success: boolean, service: Service}>(
      `${this.apiUrl}/provider/services/${id}`,
      service,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.getServices().subscribe())
    );
  }

  /**
   * Eliminar servicio
   */
  deleteService(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/provider/services/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.getServices().subscribe())
    );
  }

  // ============================================
  // PORTAFOLIO
  // ============================================

  /**
   * Obtener items del portafolio
   */
  getPortfolio(): Observable<PortfolioItem[]> {
    return this.http.get<{success: boolean, portfolio: PortfolioItem[]}>(
      `${this.apiUrl}/provider/portfolio`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.portfolio),
      tap(portfolio => this.portfolioSubject.next(portfolio))
    );
  }

  /**
   * Agregar item al portafolio
   */
  addPortfolioItem(item: PortfolioItem): Observable<PortfolioItem> {
    return this.http.post<{success: boolean, item: PortfolioItem}>(
      `${this.apiUrl}/provider/portfolio`,
      item,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.item),
      tap(() => this.getPortfolio().subscribe())
    );
  }

  /**
   * Eliminar item del portafolio
   */
  deletePortfolioItem(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/provider/portfolio/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.getPortfolio().subscribe())
    );
  }

  /**
   * Reordenar items del portafolio
   */
  reorderPortfolio(items: {id: number, order_index: number}[]): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/provider/portfolio/reorder`,
      { items },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.getPortfolio().subscribe())
    );
  }

  // ============================================
  // UBICACIONES Y COBERTURA
  // ============================================

  /**
   * Obtener zonas de cobertura
   */
  getCoverageZones(): Observable<CoverageZone[]> {
    return this.http.get<{success: boolean, zones: CoverageZone[]}>(
      `${this.apiUrl}/provider/coverage-zones`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.zones),
      tap(zones => this.coverageZonesSubject.next(zones))
    );
  }

  /**
   * Agregar zona de cobertura
   */
  addCoverageZone(zone: CoverageZone): Observable<CoverageZone> {
    return this.http.post<{success: boolean, zone: CoverageZone}>(
      `${this.apiUrl}/provider/coverage-zones`,
      zone,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.zone),
      tap(() => this.getCoverageZones().subscribe())
    );
  }

  /**
   * Eliminar zona de cobertura
   */
  deleteCoverageZone(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/provider/coverage-zones/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.getCoverageZones().subscribe())
    );
  }

  /**
   * Actualizar disponibilidad
   */
  updateAvailability(availability: Partial<Availability>): Observable<Availability> {
    return this.http.put<{success: boolean, availability: Availability}>(
      `${this.apiUrl}/provider/availability`,
      availability,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.availability),
      tap(() => this.getProfile().subscribe())
    );
  }

  /**
   * Actualizar ubicación actual (lat/lng)
   */
  updateCurrentLocation(payload: CurrentLocationPayload): Observable<any> {
    return this.http.put<{success: boolean, location: any}>(
      `${this.apiUrl}/provider/current-location`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.getProfile().subscribe())
    );
  }

  /** Actualizar coordenadas de una zona de cobertura */
  updateCoverageZoneLocation(zoneId: number, payload: { lat: number; lng: number }): Observable<any> {
    return this.http.put<{ success: boolean; zone: any }>(
      `${this.apiUrl}/provider/coverage-zones/${zoneId}/location`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  /** Marcar zona de cobertura como principal */
  setCoverageZonePrimary(zoneId: number): Observable<any> {
    return this.http.put<{ success: boolean; zones: any[] }>(
      `${this.apiUrl}/provider/coverage-zones/${zoneId}/primary`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Calcular progreso del perfil
   */
  calculateProfileCompletion(profile: ProviderProfile, servicesCount: number, portfolioCount: number): number {
    let score = 0;

    if (profile.full_name) score += 10;
    if (profile.professional_title) score += 10;
    if (profile.main_commune) score += 10;
    if (profile.years_experience > 0) score += 5;
    if (profile.bio && profile.bio.length > 50) score += 15;
    if (profile.profile_photo_url) score += 15;
    if (profile.cover_photo_url) score += 10;
    if (servicesCount > 0) score += 15;
    if (portfolioCount >= 2) score += 10;

    return Math.min(100, score);
  }

  /**
   * Obtener sugerencia de completitud
   */
  getCompletionSuggestion(profile: ProviderProfile, servicesCount: number, portfolioCount: number): string {
    if (!profile.profile_photo_url) {
      return 'Sugerencia: Agrega una foto de perfil profesional.';
    }
    if (!profile.cover_photo_url) {
      return 'Sugerencia: Agrega una foto de portada que represente tu trabajo.';
    }
    if (!profile.bio || profile.bio.length < 50) {
      return 'Sugerencia: Escribe una biografía más detallada (al menos 50 caracteres).';
    }
    if (servicesCount === 0) {
      return 'Sugerencia: Agrega al menos un servicio que ofrezcas.';
    }
    if (portfolioCount < 2) {
      return 'Sugerencia: Añade fotos a tu portafolio para llegar al 100%.';
    }
    if (!profile.professional_title) {
      return 'Sugerencia: Agrega tu título profesional.';
    }
    if (!profile.main_commune) {
      return 'Sugerencia: Indica tu comuna principal de trabajo.';
    }

    return '¡Felicidades! Tu perfil está completo al 100%.';
  }

  /**
   * Limpiar estado del servicio
   */
  clearState() {
    this.profileSubject.next(null);
    this.servicesSubject.next([]);
    this.portfolioSubject.next([]);
    this.coverageZonesSubject.next([]);
  }

  // ============================================
  // STRIPE CONNECT / BILLING (Proveedor)
  // ============================================

  createConnectAccount(providerId: number): Observable<{ success: boolean; account_id: string; onboarding_url: string; expires_at?: number }>{
    return this.http.post<{ success: boolean; account_id: string; onboarding_url: string; expires_at?: number }>(
      `${this.apiUrl}/providers/${providerId}/stripe/connect/create`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getOnboardingLink(providerId: number): Observable<{ success: boolean; onboarding_url: string; expires_at?: number }>{
    return this.http.post<{ success: boolean; onboarding_url: string; expires_at?: number }>(
      `${this.apiUrl}/providers/${providerId}/stripe/connect/onboarding-link`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getStripeDashboardLink(providerId: number): Observable<{ success: boolean; url: string }>{
    return this.http.get<{ success: boolean; url: string }>(
      `${this.apiUrl}/providers/${providerId}/stripe/connect/dashboard`,
      { headers: this.getHeaders() }
    );
  }

  createBillingSetupIntent(providerId: number): Observable<{ success: boolean; client_secret: string; customer_id: string | null }>{
    return this.http.post<{ success: boolean; client_secret: string; customer_id: string | null }>(
      `${this.apiUrl}/providers/${providerId}/billing/setup-intent`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getProviderDebts(providerId: number): Observable<{ success: boolean; debts: Array<any> }>{
    return this.http.get<{ success: boolean; debts: Array<any> }>(
      `${this.apiUrl}/providers/${providerId}/debts`,
      { headers: this.getHeaders() }
    );
  }
}
