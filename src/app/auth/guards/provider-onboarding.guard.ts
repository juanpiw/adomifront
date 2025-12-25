import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthUser } from '../services/auth.service';
import { ensureTempUserData, needsProviderPlan } from '../utils/provider-onboarding.util';

const redirectToPlan = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  let user = auth.getCurrentUser() || getStoredUser();

  // Si no hay usuario cargado aún, no forzar el guard (evita atrapar con token sin perfil)
  if (!user) {
    console.log('[PROVIDER_ONBOARDING_GUARD] Skip: no user loaded yet');
    return true;
  }

  // Si parece necesitar plan, rehidratar desde /auth/me para obtener active_plan_id actualizado
  if (needsProviderPlan(user)) {
    try {
      const me = await firstValueFrom(auth.getCurrentUserInfo());
      const backendUser: AuthUser | null = (me as any)?.data || (me as any)?.user || null;
      if (backendUser) {
        auth.applyUserFromBackend(backendUser);
        user = backendUser;
      }
    } catch (err) {
      console.warn('[PROVIDER_ONBOARDING_GUARD] No se pudo refrescar /auth/me', err);
    }
  }

  if (!needsProviderPlan(user)) {
    console.log('[PROVIDER_ONBOARDING_GUARD] Allow: user has plan or not pending', {
      userId: user?.id,
      role: user?.role,
      pending_role: user?.pending_role,
      active_plan_id: user?.active_plan_id
    });
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





