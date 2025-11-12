export type ManualCashPaymentStatus = 'under_review' | 'paid' | 'rejected';

export interface AdminManualCashPayment {
  id: number;
  provider_id: number;
  provider_name: string | null;
  provider_email: string | null;
  amount: number;
  currency: string;
  status: ManualCashPaymentStatus;
  created_at: string;
  updated_at?: string;
  debt_total: number;
  debt_count: number;
  public_receipt_url?: string | null;
  receipt_key?: string | null;
  difference?: number | null;
}

export interface AdminManualCashPaymentDebt {
  id: number;
  commission_amount: number;
  status: string;
  due_date: string | null;
  appointment_id?: number | null;
  service_name?: string | null;
  client_name?: string | null;
  client_email?: string | null;
}

export type ManualCashPaymentHistoryAction =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'reopened'
  | 'notes_updated';

export interface AdminManualCashPaymentHistoryRecord {
  id?: number;
  action: ManualCashPaymentHistoryAction;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  admin_id?: number | null;
  admin_name?: string | null;
  created_at: string;
}

export interface AdminManualCashPaymentDetail extends AdminManualCashPayment {
  reference: string | null;
  review_notes: string | null;
  metadata?: Record<string, any> | null;
  debts: AdminManualCashPaymentDebt[];
  history?: AdminManualCashPaymentHistoryRecord[];
}

export interface ManualCashPaymentsListResponse {
  data: AdminManualCashPayment[];
  pagination?: {
    total?: number;
    limit?: number;
    offset?: number;
    returned?: number;
  };
}




