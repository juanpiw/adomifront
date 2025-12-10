import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentsService } from '../../../services/payments.service';

@Component({
  selector: 'app-tbk-return',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tbk-return" style="padding:24px;text-align:center">
      <h2 style="font-weight:800;color:#0f172a;margin-bottom:8px;">Procesando pago...</h2>
      <p style="color:#475569">Estamos confirmando tu transacción con Transbank.</p>
    </section>
  `
})
export class TbkReturnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private payments = inject(PaymentsService);

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const token = qp.get('token_ws') || qp.get('TBK_TOKEN') || '';
    const hasTokenWs = !!qp.get('token_ws');
    const hasTbkToken = !!qp.get('TBK_TOKEN');
    const isOneclickFinish = hasTbkToken && !hasTokenWs;
    console.log('[TBK_RETURN] query params:', Object.fromEntries(qp.keys.map(k => [k, qp.get(k)] as any)));
    console.log('[TBK_RETURN] token_ws detected:', hasTokenWs, 'TBK_TOKEN detected:', hasTbkToken);

    if (isOneclickFinish && token) {
      // Flujo Oneclick: solo redirige a reservas (finish inscripción se hace en app/reservas)
      console.log('[TBK_RETURN] Oneclick finish detected, redirecting to /client/reservas');
      this.router.navigate(['/client/reservas'], { queryParams: { tbk_token: token } });
      return;
    }

    if (!token) {
      // Si no hay token, ir a reservas
      console.warn('[TBK_RETURN] Missing token_ws, redirecting to /client/reservas');
      this.router.navigate(['/client/reservas']);
      return;
    }
    this.payments.tbkCommit(token).subscribe({
      next: (resp) => {
        console.log('[TBK_RETURN] Commit OK:', resp);
        this.router.navigate(['/client/reservas']);
      },
      error: (err) => {
        console.error('[TBK_RETURN] Commit error:', err);
        this.router.navigate(['/client/reservas']);
      }
    });
  }
}


