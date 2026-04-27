import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { ProviderAvailabilityService, WeeklyBlockDTO, WeeklyBlockInput } from '../../../services/provider-availability.service';
import { ProviderServicesService, ProviderServiceDto } from '../../../services/provider-services.service';
import { ProviderProfileService } from '../../../services/provider-profile.service';
import { ProviderCvStepComponent } from './components/provider-cv-step/provider-cv-step.component';
import { ProviderHealthStepComponent } from './components/provider-health-step/provider-health-step.component';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
type DurationOption = { label: string; minutes: number };
type DayKey = WeeklyBlockDTO['day_of_week'];
type ProviderTrack = 'general' | 'health';

const DAY_LABELS: Array<{ key: DayKey; label: string }> = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

@Component({
  selector: 'app-provider-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ProviderHealthStepComponent, ProviderCvStepComponent],
  templateUrl: './provider-setup.component.html',
  styleUrls: ['./provider-setup.component.scss']
})
export class ProviderSetupComponent implements OnInit {
  private readonly providerTrackStorageKey = 'adomi_provider_track';
  private readonly healthSetupStorageKey = 'adomi_provider_health_setup';
  private readonly healthCurriculumStorageKey = 'adomi_provider_health_curriculum';

  // Wizard
  currentStep: WizardStep = 1;
  providerTrack: ProviderTrack = 'general';

  // Step 1: Perfil
  profilePhotoFile: File | null = null;
  profilePhotoPreviewUrl: string | null = null;
  profileFullName = '';
  profileProfessionalTitle = '';
  profileMainCommune = '';
  profilePhone = '';
  profileYearsExperience: number | null = null;
  profileSaved = false;

  // Step 2 (solo salud): validacion profesional
  healthRnpiCertificateFile: File | null = null;
  healthRnpiCertificateName = '';
  healthRnpiCertificateSize: number | null = null;
  healthRnpiCertificateMimeType = '';
  healthRnpiCertificateUploading = false;
  healthRnpiCertificateFolio = '';
  acceptsFonasa = true;
  healthVerificationGuideUrl = 'https://rnpi.superdesalud.gob.cl/#';

  // Step 3 / 2: Servicio
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

  // Step 4 / 3: Horario
  dayOptions = DAY_LABELS;
  scheduleDay: DayKey = 'monday';
  scheduleStart = '09:00';
  scheduleEnd = '18:00';
  weeklyDraft: WeeklyBlockInput[] = [];

  // Step 5 (solo salud): Curriculum
  curriculumFile: File | null = null;
  curriculumFileName = '';
  curriculumBio = '';

  // State
  loading = false;
  saving = false;
  error: string | null = null;
  createdServiceId: number | null = null;
  scheduleCreated = false;
  published = false;
  showHealthChoiceModal = false;

  private router = inject(Router);
  private servicesApi = inject(ProviderServicesService);
  private availabilityApi = inject(ProviderAvailabilityService);
  private profileApi = inject(ProviderProfileService);

  ngOnInit(): void {
    this.loadProviderTrack();
    this.loadHealthSetup();
    this.loadCurriculumSetup();

    // Si ya tiene servicio + horario, no mostrar wizard
    this.loading = true;
    forkJoin({
      profile: this.profileApi.getProfile().pipe(catchError(() => of(null))),
      healthSetup: this.profileApi.getHealthSetup().pipe(catchError(() => of(null))),
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
      .subscribe(({ profile, healthSetup, services, blocks }) => {
        // Prefill básico del perfil (si existe)
        if (profile) {
          const p: any = profile as any;
          this.profileFullName = String(p?.full_name || p?.name || '').trim();
          this.profileProfessionalTitle = String(p?.professional_title || '').trim();
          this.profileMainCommune = String(p?.main_commune || '').trim();
          this.profilePhone = String(p?.phone || '').trim();
          const years = Number(p?.years_experience);
          this.profileYearsExperience = Number.isFinite(years) ? years : null;
          const photoUrl = String(p?.profile_photo_url || '').trim();
          this.profilePhotoPreviewUrl = photoUrl || null;
        }
        if (healthSetup) {
          const profileData: any = (healthSetup as any)?.profile || null;
          const documents: any[] = Array.isArray((healthSetup as any)?.documents) ? (healthSetup as any).documents : [];
          if (profileData || documents.length > 0) {
            this.providerTrack = 'health';
            this.persistProviderTrack();
          }
          if (profileData) {
            this.healthRnpiCertificateFolio = String(profileData?.rnpi_folio || this.healthRnpiCertificateFolio || '').trim();
            this.acceptsFonasa = profileData?.accepts_fonasa !== false;
            this.curriculumBio = String(profileData?.curriculum_bio || this.curriculumBio || '');
          }
          const rnpiDoc = documents.find((doc) => doc?.document_type === 'rnpi_certificate');
          const curriculumDoc = documents.find((doc) => doc?.document_type === 'curriculum_vitae');
          if (rnpiDoc?.file_name) {
            this.healthRnpiCertificateName = String(rnpiDoc.file_name).trim();
            this.healthRnpiCertificateSize = Number.isFinite(Number(rnpiDoc?.size_bytes)) ? Number(rnpiDoc.size_bytes) : null;
            this.healthRnpiCertificateMimeType = String(rnpiDoc?.mime_type || '').trim();
          }
          if (curriculumDoc?.file_name) {
            this.curriculumFileName = String(curriculumDoc.file_name).trim();
          }
        }
        if ((services?.length || 0) > 0 && (blocks?.length || 0) > 0) {
          this.router.navigateByUrl('/dash/home').catch(() => {});
        }
      });
  }

  get totalSteps(): number {
    return this.isHealthProfessional ? 6 : 4;
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
      const nameOk = this.profileFullName.trim().length >= 2;
      return nameOk;
    }
    if (this.isHealthProfessional && this.currentStep === this.healthStepNumber) {
      return this.healthRnpiCertificateFolio.trim().length >= 4 && this.healthRnpiCertificateName.trim().length > 0;
    }
    if (this.currentStep === this.serviceStepNumber) {
      const nameOk = this.serviceName.trim().length >= 2;
      const categoryOk = this.getResolvedCategory().trim().length >= 2;
      const priceOk = Number.isFinite(Number(this.servicePrice)) && Number(this.servicePrice) > 0;
      return nameOk && categoryOk && priceOk;
    }
    if (this.currentStep === this.scheduleStepNumber) {
      return (this.weeklyDraft.length || 0) > 0;
    }
    if (this.isHealthProfessional && this.currentStep === this.curriculumStepNumber) {
      return this.curriculumFileName.trim().length > 0;
    }
    return true;
  }

  get nextLabel(): string {
    if (this.currentStep !== this.finalStepNumber) return 'Continuar';
    return this.published ? 'Configurar perfil' : 'Publicar Servicio';
  }

  get isHealthProfessional(): boolean {
    return this.providerTrack === 'health';
  }

  get providerCategoryOptions(): string[] {
    if (this.isHealthProfessional) return ['Salud', 'Otra'];
    return this.categoryOptions.filter((option) => option !== 'Salud');
  }

  get healthStepNumber(): WizardStep {
    return 2;
  }

  get serviceStepNumber(): WizardStep {
    return this.isHealthProfessional ? 3 : 2;
  }

  get scheduleStepNumber(): WizardStep {
    return this.isHealthProfessional ? 4 : 3;
  }

  get curriculumStepNumber(): WizardStep {
    return 5;
  }

  get finalStepNumber(): WizardStep {
    return this.isHealthProfessional ? 6 : 4;
  }

  get wizardSteps(): Array<{ number: WizardStep; label: string }> {
    if (this.isHealthProfessional) {
      return [
        { number: 1, label: 'Perfil' },
        { number: 2, label: 'Salud' },
        { number: 3, label: 'Servicio' },
        { number: 4, label: 'Horario' },
        { number: 5, label: 'Curriculum' },
        { number: 6, label: 'Listo' }
      ];
    }
    return [
      { number: 1, label: 'Perfil' },
      { number: 2, label: 'Servicio' },
      { number: 3, label: 'Horario' },
      { number: 4, label: 'Listo' }
    ];
  }

  get professionalTitleLabel(): string {
    return this.isHealthProfessional ? 'Título / Especialidad' : 'Título Profesional';
  }

  get professionalTitlePlaceholder(): string {
    return this.isHealthProfessional ? 'Ej: Kinesiólogo, Enfermera, Médico General' : 'Ej: Estilista, Masajista, Chef';
  }

  get serviceStepTitle(): string {
    return this.isHealthProfessional ? '¿Qué prestación ofreces?' : '¿Qué servicio ofreces?';
  }

  get serviceStepSubtitle(): string {
    return this.isHealthProfessional
      ? 'Crea tu primera prestación de salud para que los pacientes puedan reservar. Podrás editarla después.'
      : 'Crea tu primer servicio para que los clientes puedan reservar. Podrás editarlo después.';
  }

  get serviceNameLabel(): string {
    return this.isHealthProfessional ? 'Nombre de la prestacion' : 'Nombre del servicio';
  }

  get serviceNamePlaceholder(): string {
    return this.isHealthProfessional ? 'Ej. Evaluacion kinésica, Curacion avanzada...' : 'Ej. Corte de Cabello, Asesoria Legal...';
  }

  get healthVerificationCompleted(): boolean {
    return this.healthRnpiCertificateFolio.trim().length >= 4 && this.healthRnpiCertificateName.trim().length > 0;
  }

  get availabilityLabel(): string {
    const blocks = Array.isArray(this.weeklyDraft) ? this.weeklyDraft : [];
    if (blocks.length === 0) return 'Disponible (por definir)';
    const hasWeekend = blocks.some(
      (b) => (b.day_of_week === 'saturday' || b.day_of_week === 'sunday') && (b.is_active ?? true) !== false
    );
    return hasWeekend ? 'Disponible Lun-Dom' : 'Disponible Lun-Vie';
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

  handlePrimaryContinue(): void {
    if (this.currentStep !== 1) {
      this.nextStep();
      return;
    }
    this.error = null;
    if (!this.canGoNext) return;
    this.showHealthChoiceModal = true;
  }

  closeHealthChoiceModal(): void {
    if (this.saving) return;
    this.showHealthChoiceModal = false;
  }

  chooseHealthTrack(isHealth: boolean): void {
    if (this.saving) return;
    this.showHealthChoiceModal = false;
    this.continueFromStepOne(isHealth ? 'health' : 'general');
  }

  continueFromStepOne(track: ProviderTrack): void {
    this.setProviderTrack(track);
    void this.persistProfileAndGoNext();
  }

  onHealthCertificateFolioChange(value: string): void {
    this.healthRnpiCertificateFolio = value;
    this.persistHealthSetup();
  }

  onHealthCertificateSelected(file: File | null): void {
    this.healthRnpiCertificateFile = file;
    this.healthRnpiCertificateName = file?.name || '';
    this.healthRnpiCertificateSize = file?.size || null;
    this.healthRnpiCertificateMimeType = file?.type || '';
    this.persistHealthSetup();
  }

  onHealthCertificateRemoved(): void {
    if (this.saving) return;
    if (this.healthRnpiCertificateFile) {
      this.healthRnpiCertificateFile = null;
      this.healthRnpiCertificateName = '';
      this.healthRnpiCertificateSize = null;
      this.healthRnpiCertificateMimeType = '';
      this.persistHealthSetup();
      return;
    }

    if (!this.healthRnpiCertificateName.trim()) return;

    this.error = null;
    this.saving = true;
    this.profileApi.deleteHealthDocument('rnpi_certificate')
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.healthRnpiCertificateName = '';
          this.healthRnpiCertificateSize = null;
          this.healthRnpiCertificateMimeType = '';
          this.healthRnpiCertificateFolio = '';
          this.persistHealthSetup();
        },
        error: (err) => {
          this.error = err?.error?.error || err?.message || 'No pudimos eliminar tu certificado RNPI.';
        }
      });
  }

  onAcceptsFonasaChange(value: boolean): void {
    this.acceptsFonasa = value;
    this.persistHealthSetup();
  }

  onCurriculumFileSelected(file: File | null): void {
    this.curriculumFile = file;
    this.curriculumFileName = file?.name || '';
    this.persistCurriculumSetup();
  }

  onCurriculumBioChange(value: string): void {
    this.curriculumBio = value;
    this.persistCurriculumSetup();
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
      this.handlePrimaryContinue();
      return;
    }

    if (this.isHealthProfessional && this.currentStep === this.healthStepNumber) {
      this.persistHealthStepAndGoNext();
      return;
    }

    if (this.currentStep === this.serviceStepNumber) {
      void this.persistServiceAndGoNext();
      return;
    }

    if (this.currentStep === this.scheduleStepNumber) {
      void this.persistScheduleAndGoNext();
      return;
    }

    if (this.isHealthProfessional && this.currentStep === this.curriculumStepNumber) {
      this.persistCurriculumAndGoNext();
      return;
    }

    // Ultimo paso: "Publicar" (finalizar onboarding)
    if (!this.published) {
      this.published = true;
      return;
    }
    this.goToProfile();
  }

  onProfilePhotoSelected(file: File | null): void {
    this.profilePhotoFile = file;
    this.profilePhotoPreviewUrl = null;
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePhotoPreviewUrl = typeof reader.result === 'string' ? reader.result : null;
      };
      reader.readAsDataURL(file);
    } catch {
      this.profilePhotoPreviewUrl = null;
    }
  }

  onProfilePhotoInputChange(evt: Event): void {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.onProfilePhotoSelected(file);
  }

  addBlock(): void {
    const start = String(this.scheduleStart || '').slice(0, 5);
    const end = String(this.scheduleEnd || '').slice(0, 5);
    if (!this.scheduleDay || !start || !end || start >= end) {
      this.error = 'Revisa el horario: la hora de inicio debe ser menor que la de término.';
      return;
    }
    this.error = null;
    this.weeklyDraft.push({
      day_of_week: this.scheduleDay,
      start_time: start,
      end_time: end,
      is_active: true
    });
    // Ordenar por día y hora para que se vea bien
    this.weeklyDraft = this.sortDraft(this.weeklyDraft);
  }

  removeDraft(index: number): void {
    if (index < 0 || index >= this.weeklyDraft.length) return;
    this.weeklyDraft = this.weeklyDraft.filter((_, i) => i !== index);
  }

  toggleDraftActive(index: number): void {
    const b = this.weeklyDraft[index];
    if (!b) return;
    this.weeklyDraft[index] = { ...b, is_active: !b.is_active };
  }

  clearDraft(): void {
    this.weeklyDraft = [];
  }

  applyPresetStandard(): void {
    // Lun-Vie 09:00-18:00
    const blocks: WeeklyBlockInput[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((d) => ({
      day_of_week: d as DayKey,
      start_time: '09:00',
      end_time: '18:00',
      is_active: true
    }));
    this.weeklyDraft = this.sortDraft(blocks);
  }

  applyPresetStandardWithWeekends(): void {
    const blocks: WeeklyBlockInput[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => ({
      day_of_week: d as DayKey,
      start_time: '09:00',
      end_time: '18:00',
      is_active: true
    }));
    this.weeklyDraft = this.sortDraft(blocks);
  }

  getDraftGrouped(): Array<{ day: DayKey; label: string; blocks: Array<WeeklyBlockInput & { index: number }> }> {
    const groups = new Map<DayKey, Array<WeeklyBlockInput & { index: number }>>();
    this.weeklyDraft.forEach((b, idx) => {
      const arr = groups.get(b.day_of_week) || [];
      arr.push({ ...b, index: idx });
      groups.set(b.day_of_week, arr);
    });
    return this.dayOptions.map((d) => ({
      day: d.key,
      label: d.label,
      blocks: groups.get(d.key) || []
    }));
  }

  private sortDraft(list: WeeklyBlockInput[]): WeeklyBlockInput[] {
    const order = new Map<DayKey, number>(this.dayOptions.map((d, i) => [d.key, i]));
    return [...list].sort((a, b) => {
      const da = order.get(a.day_of_week) ?? 999;
      const db = order.get(b.day_of_week) ?? 999;
      if (da !== db) return da - db;
      if (a.start_time !== b.start_time) return a.start_time.localeCompare(b.start_time);
      return a.end_time.localeCompare(b.end_time);
    });
  }

  goToMercadoPagoSetup(): void {
    this.router.navigate(['/dash/ingresos'], { queryParams: { section: 'mp', onboarding: '1' } }).catch(() => {});
  }

  goToProfile(): void {
    this.router.navigateByUrl('/dash/perfil').catch(() => {});
  }

  private loadProviderTrack(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.providerTrackStorageKey);
      if (stored === 'health' || stored === 'general') {
        this.providerTrack = stored;
      }
    } catch {
      // noop
    }
  }

  private loadHealthSetup(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.healthSetupStorageKey);
      if (!raw) return;
      const data = JSON.parse(raw) as any;
      this.healthRnpiCertificateFolio = String(data?.folio || '').trim();
      this.healthRnpiCertificateName = String(data?.certificateName || '').trim();
      this.healthRnpiCertificateSize = Number.isFinite(Number(data?.certificateSize)) ? Number(data.certificateSize) : null;
      this.healthRnpiCertificateMimeType = String(data?.certificateMimeType || '').trim();
      this.acceptsFonasa = data?.acceptsFonasa !== false;
    } catch {
      // noop
    }
  }

  private loadCurriculumSetup(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.healthCurriculumStorageKey);
      if (!raw) return;
      const data = JSON.parse(raw) as any;
      this.curriculumFileName = String(data?.fileName || '').trim();
      this.curriculumBio = String(data?.bio || '');
    } catch {
      // noop
    }
  }

  private persistProviderTrack(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.providerTrackStorageKey, this.providerTrack);
    } catch {
      // noop
    }
  }

  private persistHealthSetup(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        this.healthSetupStorageKey,
        JSON.stringify({
          folio: this.healthRnpiCertificateFolio,
          certificateName: this.healthRnpiCertificateName,
          certificateSize: this.healthRnpiCertificateSize,
          certificateMimeType: this.healthRnpiCertificateMimeType,
          acceptsFonasa: this.acceptsFonasa
        })
      );
    } catch {
      // noop
    }
  }

  private persistCurriculumSetup(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        this.healthCurriculumStorageKey,
        JSON.stringify({
          fileName: this.curriculumFileName,
          bio: this.curriculumBio
        })
      );
    } catch {
      // noop
    }
  }

  private setProviderTrack(track: ProviderTrack): void {
    this.providerTrack = track;
    this.persistProviderTrack();
    if (track === 'health') {
      if (!this.selectedCategory || this.selectedCategory === 'Otra') {
        this.selectedCategory = 'Salud';
      }
      this.persistHealthSetup();
      return;
    }
    if (this.selectedCategory === 'Salud') {
      this.selectedCategory = '';
    }
  }

  private saveHealthProfile$() {
    return this.profileApi.saveHealthSetup({
      rnpi_folio: this.healthRnpiCertificateFolio.trim() || null,
      accepts_fonasa: this.acceptsFonasa,
      curriculum_bio: this.curriculumBio.trim() || null
    } as any);
  }

  private persistHealthStepAndGoNext(): void {
    if (!this.canGoNext) return;
    this.error = null;
    this.saving = true;
    this.healthRnpiCertificateUploading = !!this.healthRnpiCertificateFile;
    this.persistHealthSetup();

    const upload$ = this.healthRnpiCertificateFile
      ? this.profileApi.uploadHealthDocument(this.healthRnpiCertificateFile, 'rnpi_certificate').pipe(catchError((err) => of({ __err: err } as any)))
      : of(null);

    forkJoin({
      upload: upload$,
      saved: this.saveHealthProfile$().pipe(catchError((err) => of({ __err: err } as any)))
    })
      .pipe(finalize(() => {
        this.saving = false;
        this.healthRnpiCertificateUploading = false;
      }))
      .subscribe(({ upload, saved }) => {
        if ((upload as any)?.__err) {
          const err = (upload as any).__err;
          this.error = err?.error?.error || err?.message || 'No pudimos subir tu certificado RNPI.';
          return;
        }
        if ((saved as any)?.__err) {
          const err = (saved as any).__err;
          this.error = err?.error?.error || err?.message || 'No pudimos guardar tu información de salud.';
          return;
        }
        if ((upload as any)?.file_name) {
          this.healthRnpiCertificateName = String((upload as any).file_name || this.healthRnpiCertificateName);
          this.healthRnpiCertificateSize = Number.isFinite(Number((upload as any).size_bytes)) ? Number((upload as any).size_bytes) : this.healthRnpiCertificateSize;
          this.healthRnpiCertificateMimeType = String((upload as any).mime_type || this.healthRnpiCertificateMimeType || '').trim();
          this.healthRnpiCertificateFile = null;
        }
        this.currentStep = this.serviceStepNumber;
      });
  }

  private persistCurriculumAndGoNext(): void {
    if (!this.canGoNext) return;
    this.error = null;
    this.saving = true;
    this.persistCurriculumSetup();

    const upload$ = this.curriculumFile
      ? this.profileApi.uploadHealthDocument(this.curriculumFile, 'curriculum_vitae').pipe(catchError((err) => of({ __err: err } as any)))
      : of(null);

    forkJoin({
      upload: upload$,
      saved: this.saveHealthProfile$().pipe(catchError((err) => of({ __err: err } as any)))
    })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(({ upload, saved }) => {
        if ((upload as any)?.__err) {
          const err = (upload as any).__err;
          this.error = err?.error?.error || err?.message || 'No pudimos subir tu currículum.';
          return;
        }
        if ((saved as any)?.__err) {
          const err = (saved as any).__err;
          this.error = err?.error?.error || err?.message || 'No pudimos guardar tu currículum.';
          return;
        }
        if ((upload as any)?.file_name) {
          this.curriculumFileName = String((upload as any).file_name || this.curriculumFileName);
          this.curriculumFile = null;
        }
        this.currentStep = this.finalStepNumber;
      });
  }

  private async persistProfileAndGoNext(): Promise<void> {
    if (!this.canGoNext) return;

    // Evitar guardar 2 veces si el usuario vuelve atrás
    if (this.profileSaved) {
      this.currentStep = this.isHealthProfessional ? this.healthStepNumber : this.serviceStepNumber;
      return;
    }

    this.saving = true;

    const payload: any = {
      fullName: this.profileFullName.trim(),
      professionalTitle: this.profileProfessionalTitle.trim(),
      mainCommune: this.profileMainCommune.trim(),
      yearsExperience: Number.isFinite(Number(this.profileYearsExperience)) ? Number(this.profileYearsExperience) : 0,
      phone: this.profilePhone.trim()
    };

    // 1) Foto (opcional) — no bloquea si falla.
    const upload$ = this.profilePhotoFile
      ? this.profileApi.uploadPhoto(this.profilePhotoFile, 'profile').pipe(catchError(() => of(null)))
      : of(null);

    // 2) Datos básicos
    const save$ = this.profileApi.updateBasicInfo(payload).pipe(catchError((err) => of({ __err: err })));

    forkJoin({ upload: upload$, saved: save$ })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(({ saved }) => {
        if ((saved as any)?.__err) {
          const err = (saved as any).__err;
          this.error = err?.error?.error || err?.message || 'No pudimos guardar tu perfil. Intenta nuevamente.';
          return;
        }
        this.profileSaved = true;
        this.currentStep = this.isHealthProfessional ? this.healthStepNumber : this.serviceStepNumber;
      });
  }

  private async persistServiceAndGoNext(): Promise<void> {
    if (!this.canGoNext) return;

    // Evitar crear 2 veces si el usuario volvió atrás
    if (this.createdServiceId) {
      this.currentStep = this.scheduleStepNumber;
      return;
    }

    this.saving = true;
    const name = this.serviceName.trim();
    const customCategory = this.getResolvedCategory();
    const parsedPrice = Number(this.servicePrice);
    const price = Number.isFinite(parsedPrice) ? Math.max(0, parsedPrice) : 0;
    if (!price || price <= 0) {
      this.error = 'Ingresa un precio válido (mayor a 0) para continuar.';
      this.saving = false;
      return;
    }
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
            this.currentStep = this.scheduleStepNumber;
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
      this.currentStep = this.isHealthProfessional ? this.curriculumStepNumber : this.finalStepNumber;
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
            this.currentStep = this.isHealthProfessional ? this.curriculumStepNumber : this.finalStepNumber;
            return;
          }
          this.saveDraftBlocks();
        },
        error: () => {
          // Si no pudimos leer, igual intentamos crear (mejor esfuerzo)
          this.saveDraftBlocks();
        }
      });
  }

  private saveDraftBlocks(): void {
    const blocks = Array.isArray(this.weeklyDraft) ? this.weeklyDraft : [];
    if (blocks.length === 0) {
      this.error = 'Agrega al menos un bloque de disponibilidad para continuar.';
      this.saving = false;
      return;
    }
    this.availabilityApi.saveWeeklyBlocks(blocks).pipe(finalize(() => (this.saving = false))).subscribe({
      next: (resp: any) => {
        if (resp?.success) {
          this.scheduleCreated = true;
          this.currentStep = this.isHealthProfessional ? this.curriculumStepNumber : this.finalStepNumber;
          return;
        }
        this.error = resp?.error || 'No pudimos guardar tu horario. Intenta nuevamente.';
      },
      error: (err: any) => {
        this.error = err?.error?.error || err?.error?.message || err?.message || 'No pudimos guardar tu horario. Intenta nuevamente.';
      }
    });
  }
}

