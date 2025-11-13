export type QuoteStatus = 'new' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuoteClient {
  id: number | string;
  name: string;
  avatarUrl?: string | null;
  memberSince?: string | null;
}

export interface Quote {
  id: number | string;
  serviceName: string;
  status: QuoteStatus;
  requestedAt: string;
  client: QuoteClient;
  message?: string | null;
  amount?: number | null;
  currency?: string;
  validUntil?: string | null;
}

export interface QuoteTab {
  id: QuoteStatus | 'history';
  label: string;
  badge?: number;
}

export interface QuoteAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface QuoteActionEvent {
  quote: Quote;
  action: 'view' | 'review' | 'open-chat';
}


