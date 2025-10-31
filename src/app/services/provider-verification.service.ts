import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected' | string;

export interface ProviderVerificationRecord {
  id: number;
  provider_id: number;
  document_type: string;
  document_number: string;
  front_document_url: string | null;
  back_document_url: string | null;
  selfie_url: string | null;
  status: VerificationStatus;
  rejection_reason?: string | null;
  verification_notes?: string | null;
  verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProviderVerificationStatusResponse {
  success: boolean;
  verification: ProviderVerificationRecord | null;
  profile: {
    verification_status: VerificationStatus;
    is_verified: boolean;
  };
}

export interface SubmitVerificationPayload {
  documentNumber: string;
  documentType?: 'cedula' | 'pasaporte' | 'licencia';
  frontFile: File;
  backFile: File;
  selfieFile?: File | null;
}

@Injectable({ providedIn: 'root' })
export class ProviderVerificationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private authHeaders(isJson = true): HttpHeaders {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adomi_access_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    return new HttpHeaders(headers);
  }

  getStatus(): Observable<ProviderVerificationStatusResponse> {
    return this.http.get<ProviderVerificationStatusResponse>(`${this.baseUrl}/provider/verification/status`, {
      headers: this.authHeaders(true)
    });
  }

  submit(payload: SubmitVerificationPayload): Observable<{ success: boolean; status: VerificationStatus }> {
    const formData = new FormData();
    formData.append('document_number', payload.documentNumber.trim());
    formData.append('document_type', payload.documentType || 'cedula');
    formData.append('document_front', payload.frontFile);
    formData.append('document_back', payload.backFile);
    if (payload.selfieFile) {
      formData.append('document_selfie', payload.selfieFile);
    }

    return this.http.post<{ success: boolean; status: VerificationStatus }>(`${this.baseUrl}/provider/verification`, formData, {
      headers: this.authHeaders(false)
    });
  }
}


