// Interfaces
export interface Service {
  id: number;
  name: string;
  category: string;
  type: string;
  customType?: string;
  description: string;
  price: number;
  duration: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceCategory {
  name: string;
  services: string[];
}

export interface ServiceFormData {
  category: string;
  type: string;
  customType?: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

// Components
export * from './services-header/services-header.component';
export * from './service-card/service-card.component';
export * from './services-list/services-list.component';
export * from './service-form/service-form.component';
export * from './empty-services-state/empty-services-state.component';
export * from './confirmation-modal/confirmation-modal.component';
export * from './feedback-toast/feedback-toast.component';
