import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { ProviderAvailabilityService, WeeklyBlockDTO } from '../../../services/provider-availability.service';
import { ProviderServicesService, ProviderServiceDto } from '../../../services/provider-services.service';

type WizardStep = 1 | 2 | 3;
type DurationOption = { label: string; minutes: number };

@Component({
  selector: 'app-provider-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-setup.component.html',
  styleUrls: ['./provider-setup.component.scss']
})
export class ProviderSetupComponent implements OnInit {
  // Wizard
  currentStep: WizardStep = 1;
  readonly totalSteps = 3;

  // Step 1: Servicio
  serviceName = '';
  servicePrice: number | null = null;
  servicePriceDisplay = '';

  // Categorías (usar las mismas que maneja el dashboard de servicios)
  readonly categoryOptions: string[] = ['Tecnología', 'Hogar', 'Belleza', 'Salud', 'Otra'];
  selectedCategory = '';
  customCategory = ''; // se usa cuando selectedCategory === 'Otra'
  durationOptions: DurationOption[] = [
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1 hora', minutes: 60 }
  ];
  selectedDurationMinutes = 30;

  // Step 2: Horario
  useStandardHours = true; // Lun-Vie 09:00-18:00
  worksWeekends = false;
  customStartTime = '09:00';
  customEndTime = '18:00';

  // State
  loading = false;
  saving = false;
  error: string | null = null;
  createdServiceId: number | null = null;
  scheduleCreated = false;

  private router = inject(Router);
  private servicesApi = inject(ProviderServicesService);
  private availabilityApi = inject(ProviderAvailabilityService);

  ngOnInit(): void {
    // Si ya tiene servicio + horario, no mostrar wizard
    this.loading = true;
    forkJoin({
      services: this.servicesApi.list().pipe(
        map((r: any) => (Array.isArray(r?.services) ? (r.services as ProviderServiceDto[]) : [])),
        catchError(() => of([] as ProviderServiceDto[]))
      ),
      blocks: this.availabilityApi.getWeekly().pipe(
        map((r: any) => (Array.isArray(r?.blocks) ? (r.blocks as WeeklyBlockDTO[]) : [])),
        catchError(() => of([] as WeeklyBlockDTO[]))
      )
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ services, blocks }) => {
        if ((services?.length || 0) > 0 && (blocks?.length || 0) > 0) {
          this.router.navigateByUrl('/dash/home').catch(() => {});
        }
      });
  }

  get progressPercent(): number {
    const steps = this.totalSteps;
    const step = this.currentStep;
    if (steps <= 1) return 0;
    return ((step - 1) / (steps - 1)) * 100;
  }

  get canGoNext(): boolean {
    if (this.loading || this.saving) return false;
    if (this.currentStep === 1) {
      const nameOk = this.serviceName.trim().length >= 2;
      const categoryOk = this.getResolvedCategory().trim().length >= 2;
      return nameOk && categoryOk;
    }
    if (this.currentStep === 2) {
      // Validar horas si está en modo personalizado
      if (!this.useStandardHours) {
        return !!this.customStartTime && !!this.customEndTime && this.customStartTime < this.customEndTime;
      }
      return true;
    }
    return true;
  }

  get nextLabel(): string {
    return this.currentStep === 3 ? 'Publicar Servicio' : 'Continuar';
  }

  formatClp(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    const normalized = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(normalized);
  }

  onPriceInput(evt: Event): void {
    const el = evt.target as HTMLInputElement | null;
    const raw = String(el?.value ?? '');
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) {
      this.servicePrice = null;
      this.servicePriceDisplay = '';
      return;
    }
    const n = Number(digits);
    const normalized = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    this.servicePrice = normalized;
    this.servicePriceDisplay = this.formatClp(normalized);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory = value;
    if (value !== 'Otra') {
      this.customCategory = '';
    }
  }

  private getResolvedCategory(): string {
    if (this.selectedCategory === 'Otra') return this.customCategory.trim();
    return String(this.selectedCategory || '').trim();
  }

  selectDuration(opt: DurationOption): void {
    this.selectedDurationMinutes = opt.minutes;
  }

  isDurationSelected(opt: DurationOption): boolean {
    return this.selectedDurationMinutes === opt.minutes;
  }

  prevStep(): void {
    this.error = null;
    if (this.saving) return;
    if (this.currentStep > 1) {
      this.currentStep = (this.currentStep - 1) as WizardStep;
    }
  }

  nextStep(): void {
    this.error = null;

    if (this.currentStep === 1) {
      void this.persistServiceAndGoNext();
      return;
    }

    if (this.currentStep === 2) {
      void this.persistScheduleAndGoNext();
      return;
    }

    // Step 3: finalizar
    this.router.navigateByUrl('/dash/home').catch(() => {});
  }

  onToggleStandardHours(next: boolean): void {
    this.useStandardHours = !!next;
  }

  goToTransbankSetup(): void {
    this.router.navigate(['/dash/ingresos'], { queryParams: { section: 'tbk', onboarding: '1' } }).catch(() => {});
  }

  private async persistServiceAndGoNext(): Promise<void> {
    if (!this.canGoNext) return;

    // Evitar crear 2 veces si el usuario volvió atrás
    if (this.createdServiceId) {
      this.currentStep = 2;
      return;
    }

    this.saving = true;
    const name = this.serviceName.trim();
    const customCategory = this.getResolvedCategory();
    const price = Number.isFinite(Number(this.servicePrice)) ? Math.max(0, Number(this.servicePrice)) : 0;
    const duration_minutes = Number(this.selectedDurationMinutes || 30);

    this.servicesApi
      .create({
        name,
        description: '',
        price,
        duration_minutes,
        // Backend exige category_id válido o custom_category no vacío.
        // En este wizard no manejamos category_id desde BD, así que siempre enviamos custom_category.
        custom_category: customCategory || undefined
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (resp: any) => {
          if (resp?.success && resp?.service?.id) {
            this.createdServiceId = Number(resp.service.id);
            this.currentStep = 2;
            return;
          }
          this.error = resp?.error || 'No pudimos crear tu servicio. Intenta nuevamente.';
        },
        error: (err: any) => {
          this.error = err?.error?.error || err?.message || 'No pudimos crear tu servicio. Intenta nuevamente.';
        }
      });
  }

  private async persistScheduleAndGoNext(): Promise<void> {
    if (!this.canGoNext) return;

    // Evitar crear 2 veces si el usuario volvió atrás
    if (this.scheduleCreated) {
      this.currentStep = 3;
      return;
    }

    this.saving = true;

    // Si ya tiene bloques, no crear (idempotencia defensiva)
    this.availabilityApi
      .getWeekly()
      .pipe(
        map((r: any) => (Array.isArray(r?.blocks) ? (r.blocks as WeeklyBlockDTO[]) : [])),
        catchError(() => of([] as WeeklyBlockDTO[]))
      )
      .subscribe({
        next: (existing) => {
          if ((existing?.length || 0) > 0) {
            this.scheduleCreated = true;
            this.saving = false;
            this.currentStep = 3;
            return;
          }
          this.createScheduleBlocks();
        },
        error: () => {
          // Si no pudimos leer, igual intentamos crear (mejor esfuerzo)
          this.createScheduleBlocks();
        }
      });
  }

  private createScheduleBlocks(): void {
    const start = this.useStandardHours ? '09:00' : this.customStartTime;
    const end = this.useStandardHours ? '18:00' : this.customEndTime;

    const baseDays: WeeklyBlockDTO['day_of_week'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekendDays: WeeklyBlockDTO['day_of_week'][] = this.worksWeekends ? ['saturday', 'sunday'] : [];
    const days = [...baseDays, ...weekendDays];

    if (!start || !end || start >= end) {
      this.error = 'Revisa el horario: la hora de inicio debe ser menor que la de término.';
      this.saving = false;
      return;
    }

    forkJoin(days.map((d) => this.availabilityApi.createWeekly(d, start, end, true))).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.scheduleCreated = true;
        this.currentStep = 3;
      },
      error: (err: any) => {
        this.error = err?.error?.error || err?.message || 'No pudimos guardar tu horario. Intenta nuevamente.';
      }
    });
  }
}

