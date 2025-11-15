export type QuoteStatus = 'new' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type QuotesTabId = 'new' | 'sent' | 'accepted' | 'history';

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
  requestedTime?: string | null;
  appointmentId?: number | string | null;
  client: QuoteClient;
  provider?: QuoteProvider;
  message?: string | null;
  amount?: number | null;
  currency?: string;
  validUntil?: string | null;
  proposal?: QuoteProposalInfo | null;
  attachments?: QuoteAttachment[] | null;
  items?: QuoteItem[] | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  preferredDate?: string | null;
  preferredTimeRange?: string | null;
}

export interface QuoteProposalInfo {
  amount?: number | null;
  currency?: string | null;
  details?: string | null;
  validUntil?: string | null;
}

export interface QuoteTab {
  id: QuotesTabId;
  label: string;
  badge?: number;
}

export interface QuoteAttachment {
  id: string | number;
  name: string | null;
  size?: number | null;
  type?: string | null;
  url?: string | null;
}

export interface QuoteItem {
  id: number | string;
  title?: string | null;
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
}

export interface QuoteProvider {
  id: number | string;
  name: string;
  avatarUrl?: string | null;
  memberSince?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface QuoteActionEvent {
  quote: Quote;
  action: 'view' | 'review' | 'open-chat';
}


