import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../../../auth/services/session.service';

@Component({
  selector: 'app-admin-pagos',
  standalone: true,
  imports: [CommonModule],
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
    this.http.get<any>(`${this.baseUrl}/admin/payments?limit=50`, { headers }).subscribe({
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
}


