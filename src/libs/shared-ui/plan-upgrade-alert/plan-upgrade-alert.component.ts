import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';

// Mantener este tipo alineado con PlanService.PlanInfo (extendido para nuevos campos)
export interface PlanInfo {
  id: number;
  name: string;
  expires_at: string | null;
  is_expired: boolean;
  days_remaining: number | null;
  // Campos extendidos opcionales
  current_period_start?: string | null;
  price?: number | null;
  currency?: string | null;
  billing_period?: 'month' | 'year' | string | null;
  commission_rate?: number | null;
  effective_commission_rate?: number | null;
  plan_key?: string | null;
  plan_type?: string | null;
  promo_expires_at?: string | null;
  founder_expires_at?: string | null;
  founder_discount_until?: string | null;
  founder_discount_active?: boolean;
}

@Component({
  selector: 'plan-upgrade-alert',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './plan-upgrade-alert.component.html',
  styleUrls: ['./plan-upgrade-alert.component.scss']
})
export class PlanUpgradeAlertComponent implements OnInit {
  @Input() planInfo: PlanInfo | null = null;
  @Input() show: boolean = false;
  @Output() upgrade = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  private router = inject(Router);

  ngOnInit() {
    // Auto-dismiss after 10 seconds if not interacted with
    if (this.show && this.planInfo?.is_expired) {
      setTimeout(() => {
        this.dismiss.emit();
      }, 10000);
    }
  }

  onUpgrade() {
    this.upgrade.emit();
    this.router.navigateByUrl('/auth/select-plan');
  }

  onDismiss() {
    this.dismiss.emit();
  }

  getAlertType(): 'expired' | 'expiring' | 'info' {
    if (!this.planInfo) return 'info';
    
    if (this.planInfo.is_expired) return 'expired';
    if (this.planInfo.days_remaining && this.planInfo.days_remaining <= 7) return 'expiring';
    return 'info';
  }

  getAlertMessage(): string {
    if (!this.planInfo) return '';

    if (this.planInfo.is_expired) {
      return 'Tu plan ha expirado. Actualiza para continuar usando todas las funciones.';
    }
    
    if (this.planInfo.days_remaining && this.planInfo.days_remaining <= 7) {
      return `Tu plan expira en ${this.planInfo.days_remaining} días. Actualiza para evitar interrupciones.`;
    }
    
    return 'Considera actualizar tu plan para acceder a más funciones.';
  }

  getAlertIcon(): IconName {
    const type = this.getAlertType();
    switch (type) {
      case 'expired': return 'alert-triangle';
      case 'expiring': return 'clock';
      default: return 'info';
    }
  }
}
