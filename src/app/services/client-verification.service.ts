import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ClientVerificationStatus = 'none' | 'pending' | 'approved' | 'rejected' | string;

export interface ClientVerificationFile {
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

export interface ClientVerificationRecord {
  id: number;
  client_id: number;
  document_type: string;
  document_number: string;
  status: ClientVerificationStatus;
  rejection_reason?: string | null;
  review_notes?: string | null;
  reviewed_by_admin_id?: number | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  metadata?: any;
  created_at?: string | null;
  updated_at?: string | null;
  files?: ClientVerificationFile[];
}

export interface ClientVerificationStatusResponse {
  success: boolean;
  verification: ClientVerificationRecord | null;
  profile: {
    verification_status: ClientVerificationStatus;
    is_verified: boolean;
  };
}

export interface ClientStartVerificationPayload {
  documentNumber: string;
  documentType?: 'cedula' | 'pasaporte' | 'licencia';
}

export interface ClientSignVerificationFilePayload {
  verificationId: number;
  type: 'front' | 'back' | 'selfie' | 'extra';
  contentType: string;
  sizeBytes: number;
}

export interface ClientSignVerificationFileResponse {
  success: boolean;
  uploadUrl: string;
  headers: Record<string, string>;
  key: string;
  bucket: string;
}

export interface ClientFinalizeVerificationFilePayload {
  verificationId: number;
  type: 'front' | 'back' | 'selfie' | 'extra';
  key: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientVerificationService {
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

  getStatus(): Observable<ClientVerificationStatusResponse> {
    return this.http.get<ClientVerificationStatusResponse>(`${this.baseUrl}/client/verification/status`, {
      headers: this.authHeaders(true)
    });
  }

  startRequest(payload: ClientStartVerificationPayload): Observable<{ success: boolean; verification: ClientVerificationRecord }> {
    const body = {
      documentNumber: payload.documentNumber.trim(),
      documentType: payload.documentType || 'cedula'
    };
    return this.http.post<{ success: boolean; verification: ClientVerificationRecord }>(
      `${this.baseUrl}/client/verification/request`,
      body,
      { headers: this.authHeaders(true) }
    );
  }

  signFile(payload: ClientSignVerificationFilePayload): Observable<ClientSignVerificationFileResponse> {
    const body = {
      verificationId: payload.verificationId,
      type: payload.type,
      contentType: payload.contentType,
      sizeBytes: payload.sizeBytes
    };
    return this.http.post<ClientSignVerificationFileResponse>(
      `${this.baseUrl}/client/verification/files/sign`,
      body,
      { headers: this.authHeaders(true) }
    );
  }

  finalizeFile(payload: ClientFinalizeVerificationFilePayload): Observable<{ success: boolean }> {
    const body = {
      verificationId: payload.verificationId,
      type: payload.type,
      key: payload.key,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      checksum: payload.checksum
    };
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/client/verification/files/finalize`,
      body,
      { headers: this.authHeaders(true) }
    );
  }

  submitRequest(verificationId: number): Observable<{ success: boolean; status: ClientVerificationStatus }> {
    const body = { verificationId };
    return this.http.post<{ success: boolean; status: ClientVerificationStatus }>(
      `${this.baseUrl}/client/verification/submit`,
      body,
      { headers: this.authHeaders(true) }
    );
  }
}

