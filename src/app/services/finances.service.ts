import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/services/auth.service';

export interface FinancesSummaryDto {
  gross_amount: number;
  commission_amount: number;
  provider_net: number;
}

export interface FinanceTransactionDto {
  id: number;
  paid_at: string;
  amount: number;
  commission_amount: number;
  provider_amount: number;
  currency: string;
  appointment_id: number;
  date: string;
  start_time: string;
  service_id: number;
  service_name?: string;
  client_name?: string;
}

export interface ProviderIncomeGoalDto {
  id?: number;
  amount: number;
  period: 'mensual' | 'trimestral';
  setDate: string;
  currentIncome: number;
  progress: number;
}

@Injectable({ providedIn: 'root' })
export class FinancesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = environment.apiBaseUrl;

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  }

  getSummary(from?: string, to?: string): Observable<{ success: boolean; summary: FinancesSummaryDto }>{
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<{ success: boolean; summary: FinancesSummaryDto }>(
      `${this.base}/provider/finances/summary`,
      { headers: this.headers(), params }
    );
  }

  getTransactions(from?: string, to?: string, limit: number = 50, offset: number = 0): Observable<{ success: boolean; transactions: FinanceTransactionDto[]; total: number }>{
    let params = new HttpParams().set('limit', String(limit)).set('offset', String(offset));
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<{ success: boolean; transactions: FinanceTransactionDto[]; total: number }>(
      `${this.base}/provider/finances/transactions`,
      { headers: this.headers(), params }
    );
  }

  getIncomeGoal(providerId: number): Observable<{ success: boolean; goal: ProviderIncomeGoalDto | null }>{
    return this.http.get<{ success: boolean; goal: ProviderIncomeGoalDto | null }>(
      `${this.base}/providers/${providerId}/income-goals/current`,
      { headers: this.headers() }
    );
  }

  setIncomeGoal(providerId: number, payload: { amount: number; period: 'mensual' | 'trimestral' }): Observable<{ success: boolean; goal: ProviderIncomeGoalDto | null }>{
    return this.http.post<{ success: boolean; goal: ProviderIncomeGoalDto | null }>(
      `${this.base}/providers/${providerId}/income-goals`,
      payload,
      { headers: this.headers() }
    );
  }
}


