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
    if (!token) {
      // Si no hay token, ir a reservas
      this.router.navigate(['/client/reservas']);
      return;
    }
    this.payments.tbkCommit(token).subscribe({
      next: () => this.router.navigate(['/client/reservas']),
      error: () => this.router.navigate(['/client/reservas'])
    });
  }
}


