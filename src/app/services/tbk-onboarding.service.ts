import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthUser } from '../auth/services/auth.service';
import { ProviderProfileService } from './provider-profile.service';

export type TbkOnboardingStatus = 'none' | 'pending' | 'active' | 'restricted';

export interface TbkOnboardingState {
  status: TbkOnboardingStatus | null;
  code: string | null;
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
  needsAttention: boolean;
}

@Injectable({ providedIn: 'root' })
export class TbkOnboardingService {
  private auth = inject(AuthService);
  private providerProfile = inject(ProviderProfileService);

  private stateSubject = new BehaviorSubject<TbkOnboardingState>({
    status: null,
    code: null,
    loading: false,
    error: null,
    lastChecked: null,
    needsAttention: false
  });

  private fetching: Promise<void> | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): TbkOnboardingState {
    return this.stateSubject.value;
  }

  requiresBlocking(): boolean {
    const current = this.snapshot;
    return current.status === 'none' && current.needsAttention === true;
  }

  async refreshStatus(force = false): Promise<void> {
    if (this.fetching && !force) {
      return this.fetching;
    }

    const current = this.snapshot;
    this.stateSubject.next({ ...current, loading: true, error: null });

    this.fetching = (async () => {
      try {
        const providerId = await this.resolveProviderId();
        if (!providerId) {
          this.stateSubject.next({
            status: null,
            code: null,
            loading: false,
            error: null,
            lastChecked: new Date(),
            needsAttention: false
          });
          return;
        }

        const response = await firstValueFrom(this.providerProfile.tbkGetSecondaryStatus(providerId));
        const rawStatus = (response?.tbk?.status ?? 'none') as TbkOnboardingStatus;
        const normalized = this.normalizeStatus(rawStatus);
        const code = response?.tbk?.code ?? null;

        this.stateSubject.next({
          status: normalized,
          code,
          loading: false,
          error: null,
          lastChecked: new Date(),
          needsAttention: this.computeNeedsAttention(normalized)
        });
      } catch (error: any) {
        const message = error?.error?.error || error?.message || 'No se pudo obtener el estado TBK.';
        this.stateSubject.next({
          ...this.snapshot,
          loading: false,
          error: message,
          lastChecked: new Date()
        });
      } finally {
        this.fetching = null;
      }
    })();

    return this.fetching;
  }

  updateStatus(status: TbkOnboardingStatus, code: string | null = null): void {
    this.stateSubject.next({
      status,
      code,
      loading: false,
      error: null,
      lastChecked: new Date(),
      needsAttention: this.computeNeedsAttention(status)
    });
  }

  private async resolveProviderId(): Promise<number | null> {
    const user = this.auth.getCurrentUser();
    if (this.isProvider(user)) {
      return user!.id;
    }

    try {
      const result = await firstValueFrom(this.auth.getCurrentUserInfo());
      const hydratedUser = (result as any)?.data?.user || (result as any)?.user || null;
      if (this.isProvider(hydratedUser)) {
        return Number(hydratedUser.id);
      }
    } catch (error) {
      console.warn('[TBK_ONBOARDING] No se pudo resolver el usuario actual:', error);
    }

    return null;
  }

  private normalizeStatus(status: any): TbkOnboardingStatus {
    const value = String(status || '').toLowerCase();
    if (value === 'pending') return 'pending';
    if (value === 'active') return 'active';
    if (value === 'restricted') return 'restricted';
    return 'none';
  }

  private computeNeedsAttention(status: TbkOnboardingStatus | null): boolean {
    if (!status) return false;
    return status === 'none' || status === 'restricted';
  }

  private isProvider(user: AuthUser | null | undefined): user is AuthUser {
    return !!user && user.role === 'provider' && typeof user.id === 'number';
  }
}




