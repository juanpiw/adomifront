// Interfaces
export interface KpiItem {
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'flat';
  percentChange?: number;
}

export interface ReviewItem {
  clientName: string;
  rating: number; // 1..5
  comment?: string | null;
  date?: string;
  serviceName?: string | null;
}

// Components
export * from './statistics-header/statistics-header.component';
export * from './date-filter/date-filter.component';
export * from './kpi-cards/kpi-cards.component';
export * from './revenue-chart/revenue-chart.component';
export * from './services-chart/services-chart.component';
export * from './reviews-table/reviews-table.component';

