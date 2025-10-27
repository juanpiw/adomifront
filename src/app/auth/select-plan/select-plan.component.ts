import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Plan {
  id: number;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  max_services: number;
  max_bookings: number;
  // id de origen cuando derivamos (mensual <-> anual)
  sourceId?: number;
}

interface TempUserData {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'provider';
}

@Component({
  selector: 'app-select-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-plan.component.html',
  styleUrls: ['./select-plan.component.scss']
})
export class SelectPlanComponent implements OnInit {
  plans: Plan[] = [];
  selectedPlan: Plan | null = null;
  loading = true;
  error: string | null = null;
  tempUserData: TempUserData | null = null;
  
  // Billing toggle
  isAnnualBilling = true; // Por defecto anual
  monthlyPlans: Plan[] = [];
  annualPlans: Plan[] = [];

  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit() {
    console.log('[SELECT_PLAN] Init');
    // Verificar que hay datos temporales del usuario
    const tempData = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' 
      ? sessionStorage.getItem('tempUserData') : null;
    if (!tempData) {
      console.warn('[SELECT_PLAN] tempUserData no encontrado. Redirigiendo a /auth/register');
      this.router.navigateByUrl('/auth/register');
      return;
    }

    try {
      this.tempUserData = JSON.parse(tempData);
      console.log('[SELECT_PLAN] tempUserData:', this.tempUserData);
    } catch (e) {
      console.error('[SELECT_PLAN] Error parseando tempUserData:', e);
    }
    
    // ✅ VALIDACIÓN CRÍTICA: Solo proveedores pueden acceder a planes
    if (this.tempUserData?.role !== 'provider') {
      console.log('[SELECT_PLAN] Acceso denegado - rol no es provider:', this.tempUserData?.role);
      this.error = 'Los planes de pago están disponibles solo para profesionales.';
      this.loading = false;
      
      // Redirigir a registro después de 3 segundos
      setTimeout(() => {
        this.router.navigateByUrl('/auth/register');
      }, 3000);
      return;
    }
    
    this.loadPlans();
  }

  loadPlans() {
    console.log('[SELECT_PLAN] Cargando planes...');
    this.http.get<{ ok: boolean; plans: Plan[] }>(`${environment.apiBaseUrl}/plans`)
      .subscribe({
        next: (response) => {
          console.log('[SELECT_PLAN] Planes recibidos:', response);
          this.plans = response.plans;
          this.separatePlansByInterval();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading plans:', error);
          this.error = 'Error al cargar los planes. Inténtalo nuevamente.';
          this.loading = false;
        }
      });
  }

  separatePlansByInterval() {
    console.log('[SELECT_PLAN] Separando planes por intervalo');
    this.annualPlans = this.plans.filter(plan => plan.interval === 'year');
    this.monthlyPlans = this.plans.filter(plan => plan.interval === 'month');
    
    // Si no hay planes mensuales, crear versiones mensuales de los anuales
    if (this.monthlyPlans.length === 0 && this.annualPlans.length > 0) {
      this.monthlyPlans = this.annualPlans.map(plan => ({
        ...plan,
        id: plan.id, // mantener mismo id para que el backend encuentre el plan
        sourceId: plan.id,
        price: Math.round(plan.price / 12), // Precio mensual aproximado
        interval: 'month' as const
      }));
    }

    // Si no hay planes anuales, derivarlos multiplicando por 12 los mensuales
    if (this.annualPlans.length === 0 && this.monthlyPlans.length > 0) {
      this.annualPlans = this.monthlyPlans.map(plan => ({
        ...plan,
        id: plan.id, // mantener mismo id para que el backend encuentre el plan
        sourceId: plan.id,
        price: Math.round(plan.price * 12),
        interval: 'year' as const
      }));
    }
    console.log('[SELECT_PLAN] monthlyPlans:', this.monthlyPlans.length, 'annualPlans:', this.annualPlans.length);
  }

  selectPlan(plan: Plan) {
    console.log('[SELECT_PLAN] Plan seleccionado:', plan);
    this.selectedPlan = plan;
  }

  toggleBilling() {
    console.log('[SELECT_PLAN] Toggle billing. Estado previo isAnnualBilling:', this.isAnnualBilling);
    this.isAnnualBilling = !this.isAnnualBilling;
    this.selectedPlan = null; // Limpiar selección al cambiar
    console.log('[SELECT_PLAN] Estado nuevo isAnnualBilling:', this.isAnnualBilling);
  }

  getCurrentPlans(): Plan[] {
    return this.isAnnualBilling ? this.annualPlans : this.monthlyPlans;
  }

  getBillingLabel(): string {
    return this.isAnnualBilling ? 'Anual' : 'Mensual';
  }

  getSavingsPercentage(): number {
    if (this.annualPlans.length === 0 || this.monthlyPlans.length === 0) return 0;
    
    // Calcular ahorro promedio
    let totalSavings = 0;
    for (let i = 0; i < this.annualPlans.length; i++) {
      const annual = this.annualPlans[i];
      const monthly = this.monthlyPlans[i];
      if (monthly) {
        const monthlyAnnual = monthly.price * 12;
        const savings = ((monthlyAnnual - annual.price) / monthlyAnnual) * 100;
        totalSavings += savings;
      }
    }
    return Math.round(totalSavings / this.annualPlans.length);
  }

  continueToPayment() {
    if (!this.selectedPlan || !this.tempUserData) {
      console.warn('[SELECT_PLAN] No hay selectedPlan o tempUserData. Abortando.');
      return;
    }

    console.log('[SELECT_PLAN] Continuar a pago con plan:', this.selectedPlan);
    // Guardar plan seleccionado temporalmente
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('selectedPlan', JSON.stringify(this.selectedPlan));
      console.log('[SELECT_PLAN] selectedPlan guardado en sessionStorage');
    }
    
    // Redirigir a checkout
    console.log('[SELECT_PLAN] Navegando a /auth/checkout');
    this.router.navigateByUrl('/auth/checkout');
  }

  goBack() {
    this.router.navigateByUrl('/auth/register');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  }

  isPlanRecommended(plan: Plan): boolean {
    return plan.name.toLowerCase().includes('premium');
  }
}
