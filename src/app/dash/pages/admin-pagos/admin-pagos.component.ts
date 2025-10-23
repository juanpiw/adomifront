import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../../../auth/services/session.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pagos.component.html',
  styleUrls: ['./admin-pagos.component.scss']
})
export class AdminPagosComponent implements OnInit {
  private http = inject(HttpClient);
  private session = inject(SessionService);
  baseUrl = environment.apiBaseUrl;
  loading = false;
  error: string | null = null;
  rows: any[] = [];
  adminSecret = '';
  startISO: string | null = null;
  endISO: string | null = null;

  ngOnInit() {
    const email = this.session.getUser()?.email?.toLowerCase();
    if (email !== 'juanpablojpw@gmail.com') {
      this.error = 'Acceso restringido';
      return;
    }
    const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin:secret') : null;
    if (saved) this.adminSecret = saved;
    if (this.adminSecret) this.load();
  }

  setSecretAndLoad() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('admin:secret', this.adminSecret);
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    const token = this.session.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': this.adminSecret
    });
    const params: string[] = ['limit=100'];
    if (this.startISO && this.endISO) {
      params.push(`start=${encodeURIComponent(this.startISO)}`);
      params.push(`end=${encodeURIComponent(this.endISO)}`);
    }
    this.http.get<any>(`${this.baseUrl}/admin/payments?${params.join('&')}`, { headers }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          this.rows = res.data || [];
        } else {
          this.error = 'Respuesta inválida';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Error cargando pagos';
      }
    });
  }

  exportCsv() {
    const token = this.session.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'x-admin-secret': this.adminSecret
    });
    const params: string[] = [];
    if (this.startISO && this.endISO) {
      params.push(`start=${encodeURIComponent(this.startISO)}`);
      params.push(`end=${encodeURIComponent(this.endISO)}`);
    }
    const url = `${this.baseUrl}/admin/payments/export.csv${params.length ? ('?' + params.join('&')) : ''}`;
    this.http.get(url, { headers, responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'payments.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  applyRange(range: any) {
    const r = String(range) as 'day' | 'week' | 'month' | 'all';
    const now = new Date();
    const start = new Date(now);
    if (r === 'day') {
      start.setHours(0,0,0,0);
    } else if (r === 'week') {
      const day = now.getDay();
      const diff = (day === 0 ? 6 : day - 1); // lunes como inicio
      start.setDate(now.getDate() - diff);
      start.setHours(0,0,0,0);
    } else if (r === 'month') {
      start.setDate(1);
      start.setHours(0,0,0,0);
    }
    if (r === 'all') {
      this.startISO = null;
      this.endISO = null;
    } else {
      this.startISO = start.toISOString().slice(0,19).replace('T',' ');
      const end = new Date(now);
      this.endISO = end.toISOString().slice(0,19).replace('T',' ');
    }
    this.load();
  }

  computeSettlementDate(paidAt: string | Date | null): Date | null {
    if (!paidAt) return null;
    const d = new Date(paidAt);
    // T+3 hábiles (simplificado: salta sábados y domingos)
    let added = 0;
    while (added < 3) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return d;
  }

  mask(value: string | null | undefined): string {
    if (!value) return '-';
    const v = String(value).replace(/\s+/g, '');
    if (v.length <= 4) return '••••';
    return '•••• ' + v.slice(-4);
  }
}


