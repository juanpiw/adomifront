export type SupportTicketStatus = 'abierto' | 'en_proceso' | 'cerrado';
export type SupportProfile = 'client' | 'provider';

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  date: string;
  description: string;
  profile: SupportProfile;
}

export interface SupportTicketCreateInput {
  category: string;
  subject: string;
  description: string;
}

export interface SupportStats {
  open: number;
  closed: number;
}






