import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SearchSuggestion, SearchContext, SearchResult, SuggestionCategory } from '../models/search-suggestion.model';

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private searchData: SearchSuggestion[] = [
    // Sugerencias para Dashboard
    {
      id: 'dashboard-overview',
      title: 'Ver resumen del dashboard',
      description: 'Accede al panel principal con estadísticas y resumen',
      category: 'dashboard',
      link: '/dash/home',
      keywords: ['dashboard', 'resumen', 'inicio', 'panel', 'estadísticas'],
      priority: 10,
      icon: 'home',
      isPopular: true
    },
    {
      id: 'dashboard-notifications',
      title: 'Gestionar notificaciones',
      description: 'Configura y revisa tus notificaciones',
      category: 'notifications',
      link: '/dash/notificaciones',
      keywords: ['notificaciones', 'alertas', 'avisos', 'configurar'],
      priority: 8,
      icon: 'bell'
    },

    // Sugerencias para Perfil
    {
      id: 'profile-edit',
      title: 'Editar mi perfil',
      description: 'Actualiza tu información personal y profesional',
      category: 'profile',
      link: '/dash/perfil',
      keywords: ['perfil', 'editar', 'información', 'datos', 'personal'],
      priority: 9,
      icon: 'user',
      isPopular: true
    },
    {
      id: 'profile-photos',
      title: 'Subir fotos al portafolio',
      description: 'Agrega imágenes a tu galería de trabajos',
      category: 'profile',
      link: '/dash/perfil',
      keywords: ['fotos', 'portafolio', 'galería', 'imágenes', 'trabajos'],
      priority: 7,
      icon: 'image'
    },
    {
      id: 'profile-verification',
      title: 'Verificar mi perfil',
      description: 'Completa la verificación de tu cuenta',
      category: 'profile',
      link: '/dash/perfil',
      keywords: ['verificación', 'verificar', 'cuenta', 'documentos'],
      priority: 6,
      icon: 'check-circle'
    },

    // Sugerencias para Agenda
    {
      id: 'agenda-view',
      title: 'Ver mi agenda',
      description: 'Consulta tus citas programadas',
      category: 'agenda',
      link: '/dash/agenda',
      keywords: ['agenda', 'citas', 'horarios', 'programadas', 'calendario'],
      priority: 9,
      icon: 'calendar',
      isPopular: true
    },
    {
      id: 'agenda-availability',
      title: 'Configurar disponibilidad',
      description: 'Establece tus horarios de trabajo',
      category: 'agenda',
      link: '/dash/agenda',
      keywords: ['disponibilidad', 'horarios', 'trabajo', 'configurar'],
      priority: 8,
      icon: 'clock'
    },

    // Sugerencias para Ingresos
    {
      id: 'income-view',
      title: 'Ver mis ingresos',
      description: 'Consulta tus ganancias y reportes financieros',
      category: 'income',
      link: '/dash/ingresos',
      keywords: ['ingresos', 'ganancias', 'dinero', 'finanzas', 'reportes'],
      priority: 8,
      icon: 'money',
      isPopular: true
    },
    {
      id: 'income-reports',
      title: 'Generar reportes',
      description: 'Crea reportes detallados de tus ingresos',
      category: 'income',
      link: '/dash/ingresos',
      keywords: ['reportes', 'generar', 'detallados', 'estadísticas'],
      priority: 6,
      icon: 'chart'
    },

    // Sugerencias para Servicios
    {
      id: 'services-manage',
      title: 'Gestionar mis servicios',
      description: 'Administra los servicios que ofreces',
      category: 'services',
      link: '/dash/servicios',
      keywords: ['servicios', 'gestionar', 'administrar', 'ofrecer'],
      priority: 8,
      icon: 'briefcase'
    },
    {
      id: 'services-pricing',
      title: 'Configurar precios',
      description: 'Establece los precios de tus servicios',
      category: 'services',
      link: '/dash/servicios',
      keywords: ['precios', 'configurar', 'establecer', 'tarifas'],
      priority: 7,
      icon: 'tag'
    },

    // Sugerencias para Mensajes
    {
      id: 'messages-view',
      title: 'Ver mis mensajes',
      description: 'Consulta tus conversaciones con clientes',
      category: 'messages',
      link: '/dash/mensajes',
      keywords: ['mensajes', 'conversaciones', 'chat', 'clientes'],
      priority: 7,
      icon: 'message'
    },

    // Sugerencias para Configuración
    {
      id: 'settings-general',
      title: 'Configuración general',
      description: 'Ajusta las configuraciones de tu cuenta',
      category: 'settings',
      link: '/dash/configuracion',
      keywords: ['configuración', 'ajustes', 'cuenta', 'general'],
      priority: 6,
      icon: 'settings'
    },
    {
      id: 'settings-notifications',
      title: 'Configurar notificaciones',
      description: 'Personaliza qué notificaciones recibir',
      category: 'settings',
      link: '/dash/configuracion',
      keywords: ['notificaciones', 'configurar', 'personalizar', 'recibir'],
      priority: 5,
      icon: 'bell'
    },

    // Sugerencias de Ayuda
    {
      id: 'help-support',
      title: 'Contactar soporte',
      description: 'Obtén ayuda del equipo de soporte',
      category: 'help',
      link: '/dash/soporte',
      keywords: ['soporte', 'ayuda', 'contactar', 'problema'],
      priority: 5,
      icon: 'help-circle'
    },
    {
      id: 'help-faq',
      title: 'Preguntas frecuentes',
      description: 'Encuentra respuestas a preguntas comunes',
      category: 'help',
      link: '/dash/ayuda',
      keywords: ['preguntas', 'frecuentes', 'faq', 'respuestas'],
      priority: 4,
      icon: 'help-circle'
    }
  ];

  private currentContext: SearchContext = {
    currentPage: '',
    userRole: 'provider',
    recentSearches: [],
    preferences: {
      showPopular: true,
      showRecent: true,
      maxResults: 10
    }
  };

  constructor() {
    this.loadRecentSearches();
  }

  /**
   * Realiza una búsqueda global
   */
  search(query: string): Observable<SearchResult> {
    if (!query.trim()) {
      return of({
        suggestions: this.getDefaultSuggestions(),
        totalCount: 0,
        searchTime: 0,
        hasMore: false
      });
    }

    const startTime = Date.now();
    const normalizedQuery = query.toLowerCase().trim();
    
    // Filtrar sugerencias basadas en la consulta
    const results = this.searchData
      .filter(suggestion => this.matchesQuery(suggestion, normalizedQuery))
      .sort((a, b) => {
        // Ordenar por relevancia (coincidencia exacta primero, luego por prioridad)
        const aScore = this.calculateRelevanceScore(a, normalizedQuery);
        const bScore = this.calculateRelevanceScore(b, normalizedQuery);
        return bScore - aScore;
      })
      .slice(0, this.currentContext.preferences.maxResults);

    const searchTime = Date.now() - startTime;

    // Guardar búsqueda reciente
    this.saveRecentSearch(query);

    return of({
      suggestions: results,
      totalCount: results.length,
      searchTime,
      hasMore: results.length >= this.currentContext.preferences.maxResults
    }).pipe(delay(150)); // Simular latencia de red
  }

  /**
   * Obtiene sugerencias por defecto
   */
  getDefaultSuggestions(): SearchSuggestion[] {
    const popular = this.searchData
      .filter(s => s.isPopular)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);

    return popular;
  }

  /**
   * Obtiene sugerencias recientes
   */
  getRecentSuggestions(): SearchSuggestion[] {
    return this.currentContext.recentSearches
      .slice(0, 5)
      .map(search => this.searchData.find(s => s.title.toLowerCase().includes(search.toLowerCase())))
      .filter(Boolean) as SearchSuggestion[];
  }

  /**
   * Establece el contexto de búsqueda
   */
  setContext(context: Partial<SearchContext>): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  /**
   * Obtiene el contexto actual
   */
  getContext(): SearchContext {
    return { ...this.currentContext };
  }

  /**
   * Verifica si una sugerencia coincide con la consulta
   */
  private matchesQuery(suggestion: SearchSuggestion, query: string): boolean {
    const searchableText = [
      suggestion.title,
      suggestion.description || '',
      ...suggestion.keywords
    ].join(' ').toLowerCase();

    return searchableText.includes(query);
  }

  /**
   * Calcula el puntaje de relevancia de una sugerencia
   */
  private calculateRelevanceScore(suggestion: SearchSuggestion, query: string): number {
    let score = 0;

    // Coincidencia exacta en el título
    if (suggestion.title.toLowerCase().includes(query)) {
      score += 100;
    }

    // Coincidencia en descripción
    if (suggestion.description?.toLowerCase().includes(query)) {
      score += 50;
    }

    // Coincidencia en palabras clave
    const keywordMatches = suggestion.keywords.filter(keyword => 
      keyword.toLowerCase().includes(query)
    ).length;
    score += keywordMatches * 25;

    // Prioridad base
    score += suggestion.priority * 5;

    // Bonus por ser popular
    if (suggestion.isPopular) {
      score += 20;
    }

    return score;
  }

  /**
   * Guarda una búsqueda reciente
   */
  private saveRecentSearch(query: string): void {
    const recent = this.currentContext.recentSearches.filter(s => s !== query);
    recent.unshift(query);
    this.currentContext.recentSearches = recent.slice(0, 10);
    
    // Guardar en localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('global-search-recent', JSON.stringify(this.currentContext.recentSearches));
    }
  }

  /**
   * Carga búsquedas recientes desde localStorage
   */
  private loadRecentSearches(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('global-search-recent');
        if (stored) {
          this.currentContext.recentSearches = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Error loading recent searches:', error);
      }
    }
  }

  /**
   * Obtiene las búsquedas recientes
   */
  getRecentSearches(): string[] {
    return this.currentContext.recentSearches;
  }

  /**
   * Limpia las búsquedas recientes
   */
  clearRecentSearches(): void {
    this.currentContext.recentSearches = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('global-search-recent');
    }
  }
}
