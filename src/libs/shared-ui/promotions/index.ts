// Interfaces
export interface Promotion {
  id: number;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'other';
  discountValue: string;
  startDate: string; // ISO string (yyyy-mm-dd)
  endDate?: string;  // ISO string (yyyy-mm-dd)
  status: 'active' | 'inactive' | 'expired';
  usageCount?: number;
}

export interface PromotionFormData {
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'other';
  discountValue: string;
  startDate: string;
  endDate: string;
}

// Components
export * from './promotions-header/promotions-header.component';
export * from './collapsible-promo-form/collapsible-promo-form.component';
export * from './promotion-card/promotion-card.component';
export * from './active-promotions-list/active-promotions-list.component';
export * from './history-item/history-item.component';
export * from './promotions-history/promotions-history.component';

