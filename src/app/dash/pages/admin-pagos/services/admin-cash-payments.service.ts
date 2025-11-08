import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminPaymentsService } from '../admin-payments.service';
import {
  AdminManualCashPayment,
  AdminManualCashPaymentDetail,
  AdminManualCashPaymentHistoryRecord,
  ManualCashPaymentStatus,
  ManualCashPaymentsListResponse
} from '../models/admin-cash-payment.model';
import { SessionService } from '../../../../auth/services/session.service';

export type ManualCashPaymentsFilter = 'under_review' | 'paid' | 'rejected' | 'all';

interface ManualCashReviewState {
  loadingList: boolean;
  list: AdminManualCashPayment[];
  error: string | null;
  filter: ManualCashPaymentsFilter;
  pagination: ManualCashPaymentsListResponse['pagination'] | null;
  detailLoading: boolean;
  detailError: string | null;
  detail: AdminManualCashPaymentDetail | null;
  processingIds: Record<number, boolean>;
}

const initialState: ManualCashReviewState = {
  loadingList: false,
  list: [],
  error: null,
  filter: 'under_review',
  pagination: null,
  detailLoading: false,
  detailError: null,
  detail: null,
  processingIds: {}
};

@Injectable({ providedIn: 'root' })
export class AdminCashPaymentsService {
  private adminPayments = inject(AdminPaymentsService);
  private session = inject(SessionService);

  private stateSig = signal<ManualCashReviewState>({ ...initialState });
  private adminSecret = '';
  private detailId: number | null = null;

  state: Signal<ManualCashReviewState> = computed(() => this.stateSig());

  get currentFilter(): ManualCashPaymentsFilter {
    return this.stateSig().filter;
  }

  setSecret(secret: string | null | undefined): void {
    const normalized = (secret || '').trim();
    if (!normalized) {
      this.resetState();
      return;
    }
    if (normalized === this.adminSecret) {
      return;
    }
    this.adminSecret = normalized;
    this.resetState(true);
    void this.refreshList();
  }

  setFilter(filter: ManualCashPaymentsFilter): void {
    if (filter === this.stateSig().filter) {
      return;
    }
    this.patchState({ filter });
    void this.refreshList();
  }

  async refreshList(): Promise<void> {
    if (!this.adminSecret) {
      return;
    }
    this.patchState({ loadingList: true, error: null });
    try {
      const filter = this.stateSig().filter;
      const status: 'under_review' | 'paid' | 'rejected' | undefined =
        filter === 'all' ? undefined : filter;
      const response = await firstValueFrom(
        this.adminPayments.listManualCashPayments(this.adminSecret, this.session.getAccessToken(), {
          status
        })
      );
      const typed = this.mapListResponse(response);
      this.patchState({
        list: typed.data,
        pagination: typed.pagination || null,
        loadingList: false
      });
      if (this.detailId) {
        const stillExists = typed.data.some(item => item.id === this.detailId);
        if (!stillExists) {
          this.patchState({ detail: null });
          this.detailId = null;
        }
      }
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'Error al cargar los comprobantes manuales.';
      this.patchState({ error: message, loadingList: false });
    }
  }

  async openDetail(id: number): Promise<void> {
    if (!this.adminSecret) {
      return;
    }
    this.detailId = id;
    this.patchState({ detailLoading: true, detailError: null });
    try {
      const response = await firstValueFrom(
        this.adminPayments.getManualCashPayment(this.adminSecret, this.session.getAccessToken(), id)
      );
      const detail = this.mapDetail(response);
      this.patchState({ detail, detailLoading: false, detailError: null });
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'No se pudo cargar el detalle del comprobante.';
      this.patchState({ detailLoading: false, detailError: message, detail: null });
    }
  }

  clearDetail(): void {
    this.detailId = null;
    this.patchState({ detail: null, detailError: null, detailLoading: false });
  }

  async approve(
    id: number,
    payload: { reference?: string | null; notes?: string | null }
  ): Promise<{ success: boolean; error?: string }> {
    return this.runAction(id, async () => {
      const body = {
        reference: payload.reference ?? undefined,
        notes: payload.notes ?? undefined
      };
      await firstValueFrom(
        this.adminPayments.approveManualCashPayment(
          this.adminSecret,
          this.session.getAccessToken(),
          id,
          body
        )
      );
      await this.refreshList();
      if (this.detailId === id) {
        await this.openDetail(id);
      }
      return { success: true };
    });
  }

  async reject(
    id: number,
    payload: { reason: string; notes?: string | null }
  ): Promise<{ success: boolean; error?: string }> {
    if (!payload.reason?.trim()) {
      return { success: false, error: 'Debes indicar un motivo de rechazo.' };
    }
    return this.runAction(id, async () => {
      await firstValueFrom(
        this.adminPayments.rejectManualCashPayment(
          this.adminSecret,
          this.session.getAccessToken(),
          id,
          payload.reason.trim(),
          payload.notes ?? undefined
        )
      );
      await this.refreshList();
      if (this.detailId === id) {
        await this.openDetail(id);
      }
      return { success: true };
    });
  }

  async requestResubmission(
    id: number,
    payload: { reason: string; notes?: string | null }
  ): Promise<{ success: boolean; error?: string }> {
    if (!payload.reason?.trim()) {
      return { success: false, error: 'Debes indicar una instrucción para el proveedor.' };
    }
    return this.runAction(id, async () => {
      await firstValueFrom(
        this.adminPayments.requestManualCashResubmission(
          this.adminSecret,
          this.session.getAccessToken(),
          id,
          {
            reason: payload.reason.trim(),
            notes: payload.notes ?? null
          }
        )
      );
      await this.refreshList();
      if (this.detailId === id) {
        await this.openDetail(id);
      }
      return { success: true };
    });
  }

  private async runAction(
    id: number,
    task: () => Promise<{ success: boolean; error?: string }>
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.adminSecret) {
      return { success: false, error: 'Falta el admin secret.' };
    }
    this.setProcessing(id, true);
    try {
      return await task();
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'No se pudo completar la acción.';
      return { success: false, error: message };
    } finally {
      this.setProcessing(id, false);
    }
  }

  private setProcessing(id: number, value: boolean): void {
    const current = this.stateSig().processingIds;
    this.patchState({
      processingIds: {
        ...current,
        [id]: value
      }
    });
  }

  private resetState(keepFilter = false): void {
    const filter = keepFilter ? this.stateSig().filter : 'under_review';
    this.stateSig.set({
      ...initialState,
      filter
    });
    if (!keepFilter) {
      this.detailId = null;
    }
  }

  private patchState(partial: Partial<ManualCashReviewState>): void {
    this.stateSig.update(prev => ({
      ...prev,
      ...partial
    }));
  }

  private mapListResponse(response: any): ManualCashPaymentsListResponse {
    const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    const mapped: AdminManualCashPayment[] = data.map((item: any) => this.mapPayment(item));
    return {
      data: mapped,
      pagination: response?.pagination || null
    };
  }

  private mapDetail(response: any): AdminManualCashPaymentDetail {
    const payload = response?.data ?? response;
    const base = this.mapPayment(payload);
    const debtsArray = Array.isArray(payload?.debts) ? payload.debts : [];
    const historyArray = Array.isArray(payload?.history) ? payload.history : [];
    let metadata: Record<string, any> | null = payload?.metadata ?? payload?.meta ?? null;

    if (metadata && typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = { raw: metadata };
      }
    }

    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      metadata = { ...metadata };
    }

    return {
      ...base,
      reference: payload?.reference ?? null,
      review_notes: payload?.review_notes ?? null,
      metadata,
      debts: debtsArray.map((debt: any) => ({
        id: Number(debt?.id),
        commission_amount: Number(debt?.commission_amount ?? debt?.amount ?? 0),
        status: debt?.status || 'pending',
        due_date: debt?.due_date || null,
        appointment_id: debt?.appointment_id ?? null,
        service_name: debt?.service_name ?? null,
        client_name: debt?.client_name ?? null,
        client_email: debt?.client_email ?? null
      })),
      history: historyArray.map((record: any): AdminManualCashPaymentHistoryRecord => {
        let recordMetadata: Record<string, any> | null = record?.metadata ?? null;
        if (recordMetadata && typeof recordMetadata === 'string') {
          try {
            recordMetadata = JSON.parse(recordMetadata);
          } catch {
            recordMetadata = { raw: recordMetadata };
          }
        }
        return {
          id: record?.id,
          action: record?.action ?? 'notes_updated',
          notes: record?.notes ?? null,
          metadata: recordMetadata,
          admin_id: record?.admin_id ?? null,
          admin_name: record?.admin_name ?? null,
          created_at: record?.created_at || record?.createdAt || new Date().toISOString()
        };
      })
    };
  }

  private mapPayment(raw: any): AdminManualCashPayment {
    const source = raw?.data ?? raw;
    const amount = Number(source?.amount || 0);
    const debtTotal = Number(source?.debt_total ?? source?.debtTotal ?? 0);
    const difference =
      typeof source?.difference === 'number'
        ? Number(source.difference)
        : Number((amount - debtTotal).toFixed(2));
    return {
      id: Number(source?.id),
      provider_id: Number(source?.provider_id ?? source?.providerId ?? 0),
      provider_name: source?.provider_name ?? source?.providerName ?? null,
      provider_email: source?.provider_email ?? source?.providerEmail ?? null,
      amount,
      currency: source?.currency || 'CLP',
      status: (source?.status || 'under_review') as ManualCashPaymentStatus,
      created_at: source?.created_at || source?.createdAt || new Date().toISOString(),
      updated_at: source?.updated_at || source?.updatedAt || null,
      debt_total: debtTotal,
      debt_count: Number(source?.debt_count ?? source?.debtCount ?? 0),
      public_receipt_url: source?.public_receipt_url ?? source?.receiptUrl ?? null,
      receipt_key: source?.receipt_key ?? source?.receiptKey ?? null,
      difference: Number.isFinite(difference) ? difference : Number((amount - debtTotal).toFixed(2))
    };
  }
}


