import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected' | string;

export interface ProviderVerificationFile {
  id?: number;
  type: 'front' | 'back' | 'selfie' | 'extra' | string;
  key: string;
  bucket?: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  checksum?: string | null;
  uploadedAt?: string | null;
  updatedAt?: string | null;
  url?: string | null;
}

export interface ProviderVerificationRecord {
  id: number;
  provider_id: number;
  document_type: string;
  document_number: string;
  status: VerificationStatus;
  rejection_reason?: string | null;
  review_notes?: string | null;
  reviewed_by_admin_id?: number | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  metadata?: any;
  created_at?: string | null;
  updated_at?: string | null;
  files?: ProviderVerificationFile[];
}

export interface ProviderVerificationStatusResponse {
  success: boolean;
  verification: ProviderVerificationRecord | null;
  profile: {
    verification_status: VerificationStatus;
    is_verified: boolean;
  };
}

export interface StartVerificationPayload {
  documentNumber: string;
  documentType?: 'cedula' | 'pasaporte' | 'licencia';
}

export interface SignVerificationFilePayload {
  verificationId: number;
  type: 'front' | 'back' | 'selfie' | 'extra';
  contentType: string;
  sizeBytes: number;
}

export interface SignVerificationFileResponse {
  success: boolean;
  uploadUrl: string;
  headers: Record<string, string>;
  key: string;
  bucket: string;
}

export interface FinalizeVerificationFilePayload {
  verificationId: number;
  type: 'front' | 'back' | 'selfie' | 'extra';
  key: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
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

  startRequest(payload: StartVerificationPayload): Observable<{ success: boolean; verification: ProviderVerificationRecord }> {
    const body = {
      documentNumber: payload.documentNumber.trim(),
      documentType: payload.documentType || 'cedula'
    };
    return this.http.post<{ success: boolean; verification: ProviderVerificationRecord }>(
      `${this.baseUrl}/provider/verification/request`,
      body,
      { headers: this.authHeaders(true) }
    );
  }

  signFile(payload: SignVerificationFilePayload): Observable<SignVerificationFileResponse> {
    const body = {
      verificationId: payload.verificationId,
      type: payload.type,
      contentType: payload.contentType,
      sizeBytes: payload.sizeBytes
    };
    return this.http.post<SignVerificationFileResponse>(
      `${this.baseUrl}/provider/verification/files/sign`,
      body,
      { headers: this.authHeaders(true) }
    );
  }

  finalizeFile(payload: FinalizeVerificationFilePayload): Observable<{ success: boolean }> {
    const body = {
      verificationId: payload.verificationId,
      type: payload.type,
      key: payload.key,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      checksum: payload.checksum
    };
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/provider/verification/files/finalize`,
      body,
      { headers: this.authHeaders(true) }
    );
  }

  submitRequest(verificationId: number): Observable<{ success: boolean; status: VerificationStatus }> {
    const body = { verificationId };
    return this.http.post<{ success: boolean; status: VerificationStatus }>(
      `${this.baseUrl}/provider/verification/submit`,
      body,
      { headers: this.authHeaders(true) }
    );
  }
}


