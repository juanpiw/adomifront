import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthUser } from '../services/auth.service';
import { ensureTempUserData, needsProviderPlan } from '../utils/provider-onboarding.util';
import { environment } from '../../../environments/environment';

const redirectToPlan = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  let user = auth.getCurrentUser() || getStoredUser();
  const hasToken = !!auth.getAccessToken();
  const debug = !environment.production;
  if (debug) {
    console.log('[PROVIDER_ONBOARDING_GUARD] start', {
      hasToken,
      hasUserInMemory: !!auth.getCurrentUser(),
      hasUserStored: !!getStoredUser()
    });
  }

  // Si hay token pero no user cargado aún, intentar rehidratar para decidir correctamente
  if (!user && hasToken) {
    try {
      const me = await firstValueFrom(auth.getCurrentUserInfo());
      const backendUser: AuthUser | null = (me as any)?.data?.user || (me as any)?.user || null;
      if (backendUser) {
        auth.applyUserFromBackend(backendUser);
        user = backendUser;
        if (debug) {
          console.log('[PROVIDER_ONBOARDING_GUARD] hydrated user from /auth/me', {
            userId: backendUser?.id,
            role: backendUser?.role,
            pending_role: backendUser?.pending_role,
            active_plan_id: backendUser?.active_plan_id
          });
        }
      }
    } catch (e) {
      if (debug) {
        console.warn('[PROVIDER_ONBOARDING_GUARD] could not hydrate from /auth/me', e);
      }
    }
  }

  // Si sigue sin user, no forzar (evita lockout)
  if (!user) {
    if (debug) {
      console.log('[PROVIDER_ONBOARDING_GUARD] Skip: no user available');
    }
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
      if (debug) {
        console.warn('[PROVIDER_ONBOARDING_GUARD] No se pudo refrescar /auth/me', err);
      }
    }
  }

  if (!needsProviderPlan(user)) {
    if (debug) {
      console.log('[PROVIDER_ONBOARDING_GUARD] Allow: user has plan or not pending', {
        userId: user?.id,
        role: user?.role,
        pending_role: user?.pending_role,
        active_plan_id: user?.active_plan_id
      });
    }
    return true;
  }

  if (debug) {
    console.warn('[PROVIDER_ONBOARDING_GUARD] Forzando /auth/select-plan para usuario pendiente', {
      userId: user?.id,
      role: user?.role,
      pending_role: user?.pending_role,
      account_switch_in_progress: user?.account_switch_in_progress,
      active_plan_id: user?.active_plan_id
    });
  }

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





