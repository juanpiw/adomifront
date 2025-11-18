import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { AuthService, AuthUser } from '../services/auth.service';
import { ensureTempUserData, needsProviderPlan } from '../utils/provider-onboarding.util';

const redirectToPlan = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser() || getStoredUser();

  if (!needsProviderPlan(user)) {
    return true;
  }

  console.warn('[PROVIDER_ONBOARDING_GUARD] Forzando /auth/select-plan para usuario pendiente', {
    userId: user?.id,
    role: user?.role,
    pending_role: user?.pending_role,
    account_switch_in_progress: user?.account_switch_in_progress,
    active_plan_id: user?.active_plan_id
  });

  ensureTempUserData(user || undefined);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('providerOnboarding', '1');
    }
  } catch {}

  return router.parseUrl('/auth/select-plan');
};

export const providerOnboardingGuard: CanActivateFn = () => redirectToPlan();
export const providerOnboardingChildGuard: CanActivateChildFn = () => redirectToPlan();

function getStoredUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('adomi_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

