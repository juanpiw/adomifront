import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PlanService } from '../../services/plan.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tbk-plan-return',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tbk-plan-return">
      <div class="tbk-plan-return__card" [class.tbk-plan-return__card--success]="status === 'success'" [class.tbk-plan-return__card--error]="status === 'error'">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
      </div>
    </section>
  `,
  styles: [`
    .tbk-plan-return {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg, #f8fafc);
      padding: 32px 16px;
    }
    .tbk-plan-return__card {
      max-width: 480px;
      width: 100%;
      background: #ffffff;
      border-radius: 20px;
      padding: 32px 28px;
      text-align: center;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .tbk-plan-return__card h2 {
      margin: 0 0 12px;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
    }
    .tbk-plan-return__card p {
      margin: 0;
      color: #475569;
      line-height: 1.6;
    }
    .tbk-plan-return__card--success h2 {
      color: #047857;
    }
    .tbk-plan-return__card--error h2 {
      color: #dc2626;
    }
  `]
})
export class TbkPlanReturnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private planService = inject(PlanService);
  private authService = inject(AuthService);

  status: 'loading' | 'success' | 'error' = 'loading';
  title = 'Procesando pago...';
  message = 'Estamos confirmando tu suscripción con Webpay Plus.';

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token_ws')
      || this.route.snapshot.queryParamMap.get('TBK_TOKEN')
      || '';

    if (!token) {
      this.redirectWithError('missing_token');
      return;
    }

    try {
      const response = await firstValueFrom(this.planService.commitTbkPlanPayment(token));
      if (!response?.ok) {
        this.redirectWithError('commit_failed');
        return;
      }

      this.cleanupStorage();
      try {
        await firstValueFrom(this.authService.getCurrentUserInfo());
      } catch (refreshError) {
        console.warn('[TBK_PLAN_RETURN] No se pudo refrescar info de usuario:', refreshError);
      }

      this.status = 'success';
      this.title = 'Pago confirmado';
      this.message = 'Tu suscripción se activó correctamente. Te redirigiremos a tu panel.';

      setTimeout(() => {
        this.router.navigateByUrl('/dash/home');
      }, 1500);
    } catch (error: any) {
      console.error('[TBK_PLAN_RETURN] Error en commit:', error);
      const reason = error?.error?.error || error?.message || 'commit_error';
      this.redirectWithError(reason);
    }
  }

  private redirectWithError(reason?: string) {
    this.cleanupStorage();
    this.status = 'error';
    this.title = 'No pudimos confirmar tu pago';
    this.message = 'Intenta nuevamente o contáctanos si el cargo fue realizado.';
    setTimeout(() => {
      this.router.navigate(['/auth/payment-error'], {
        queryParams: reason ? { reason } : undefined
      });
    }, 1200);
  }

  private cleanupStorage() {
    try {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('tempUserData');
        sessionStorage.removeItem('selectedPlan');
        sessionStorage.removeItem('promoCode');
        sessionStorage.removeItem('paymentGateway');
        sessionStorage.removeItem('tbkPlanPending');
      }
    } catch {}
  }
}


