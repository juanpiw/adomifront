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
  comment: string;
  date: string; // ISO date
}

export interface ChartSeries {
  label: string;
  data: number[];
}

// Components
export * from './statistics-header/statistics-header.component';
export * from './date-filter/date-filter.component';
export * from './kpi-cards/kpi-cards.component';
// Pendiente: agregar export de gráficos y tabla de reseñas cuando sean creados

