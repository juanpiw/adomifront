export type SuggestionCategory = 
  'profile' | 'agenda' | 'income' | 'services' | 'settings' | 'help' | 
  'dashboard' | 'notifications' | 'messages' | 'reports' | 'analytics';

export interface SearchSuggestion {
  id: string;
  title: string;
  description?: string;
  category: SuggestionCategory;
  link: string;
  keywords: string[];
  priority: number; // 1-10, mayor número = mayor prioridad
  icon?: string;
  isPopular?: boolean;
}

export interface SearchContext {
  currentPage: string;
  userRole: 'client' | 'provider' | 'admin';
  recentSearches: string[];
  preferences: {
    showPopular: boolean;
    showRecent: boolean;
    maxResults: number;
  };
}

export interface SearchResult {
  suggestions: SearchSuggestion[];
  totalCount: number;
  searchTime: number;
  hasMore: boolean;
}












