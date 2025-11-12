import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface ClientWalletSummary {
  balance: number;
  pending_balance: number;
  hold_balance: number;
  total_received: number;
  total_spent: number;
  credits_count: number;
  currency: string;
  last_updated: string | null;
  note?: string;
}

export interface ClientWalletMovement {
  id: number;
  type: 'credit' | 'debit';
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  created_at: string;
}

interface WalletSummaryResponse {
  success: boolean;
  summary: ClientWalletSummary;
}

interface WalletMovementsResponse {
  success: boolean;
  movements: ClientWalletMovement[];
  pagination: { total: number; limit: number; offset: number };
}

@Injectable({ providedIn: 'root' })
export class ClientWalletService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = environment.apiBaseUrl;

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getSummary(): Observable<WalletSummaryResponse> {
    return this.http.get<WalletSummaryResponse>(`${this.baseUrl}/client/wallet/summary`, {
      headers: this.headers()
    });
  }

  getMovements(limit = 50, offset = 0): Observable<WalletMovementsResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    });
    return this.http.get<WalletMovementsResponse>(`${this.baseUrl}/client/wallet/movements?${params.toString()}`, {
      headers: this.headers()
    });
  }
}

