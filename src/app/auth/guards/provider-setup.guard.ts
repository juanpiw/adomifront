import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService, AuthUser } from '../services/auth.service';
import { ProviderAvailabilityService, WeeklyBlockDTO } from '../../services/provider-availability.service';
import { ProviderServicesService, ProviderServiceDto } from '../../services/provider-services.service';
import { environment } from '../../../environments/environment';

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

function isProviderLike(user: AuthUser | null | undefined): boolean {
  const role = String((user as any)?.role || '').toLowerCase();
  const pendingRole = String((user as any)?.pending_role || (user as any)?.pendingRole || '').toLowerCase();
  return role === 'provider' || pendingRole === 'provider';
}

function isAllowedDuringSetup(url: string): boolean {
  return url.includes('/dash/provider-setup') || url.includes('/dash/ingresos');
}

const guardImpl = async (targetUrl?: string): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const servicesApi = inject(ProviderServicesService);
  const availabilityApi = inject(ProviderAvailabilityService);
  const debug = !environment.production;

  const hasToken = !!auth.getAccessToken();
  // Sin token no hay sesión activa: no bloquear por datos stale en storage.
  if (!hasToken) {
    if (debug) {
      console.log('[PROVIDER_SETUP_GUARD] allow (no token)');
    }
    return true;
  }

  let user: AuthUser | null = auth.getCurrentUser() || getStoredUser();
  if (debug) {
    console.log('[PROVIDER_SETUP_GUARD] start', {
      url: targetUrl,
      hasToken,
      hasUserInMemory: !!auth.getCurrentUser(),
      hasUserStored: !!getStoredUser()
    });
  }

  // Si hay token pero no user cargado, intentar rehidratar desde /auth/me para decidir correctamente
  if (!user && hasToken) {
    try {
      const me = await firstValueFrom(auth.getCurrentUserInfo());
      const backendUser: AuthUser | null = (me as any)?.data?.user || (me as any)?.user || null;
      if (backendUser) {
        auth.applyUserFromBackend(backendUser);
        user = backendUser;
        if (debug) {
          console.log('[PROVIDER_SETUP_GUARD] hydrated user from /auth/me', {
            userId: backendUser?.id,
            role: backendUser?.role,
            pending_role: backendUser?.pending_role,
            active_plan_id: backendUser?.active_plan_id
          });
        }
      }
    } catch (e) {
      if (debug) {
        console.warn('[PROVIDER_SETUP_GUARD] could not hydrate from /auth/me', e);
      }
    }
  }

  // Evitar bloquear cuando el usuario aún no está disponible y no se puede rehidratar
  if (!user) {
    if (debug) {
      console.log('[PROVIDER_SETUP_GUARD] allow (no user available)');
    }
    return true;
  }

  // Solo aplica a cuentas provider-like
  if (!isProviderLike(user)) {
    if (debug) {
      console.log('[PROVIDER_SETUP_GUARD] allow (not provider-like)', {
        userId: user?.id,
        role: user?.role,
        pending_role: (user as any)?.pending_role
      });
    }
    return true;
  }

  // Asegurar que tenemos user fresco si falta active_plan_id (evita falsos negativos por estado viejo)
  if (!user.active_plan_id) {
    try {
      const me = await firstValueFrom(auth.getCurrentUserInfo());
      const backendUser: AuthUser | null = (me as any)?.data?.user || (me as any)?.user || null;
      if (backendUser) {
        auth.applyUserFromBackend(backendUser);
        user = backendUser;
        if (debug) {
          console.log('[PROVIDER_SETUP_GUARD] refreshed user due to missing active_plan_id', {
            userId: backendUser?.id,
            role: backendUser?.role,
            pending_role: backendUser?.pending_role,
            active_plan_id: backendUser?.active_plan_id
          });
        }
      }
    } catch {
      // si falla, no bloqueamos por no poder validar
      if (debug) {
        console.warn('[PROVIDER_SETUP_GUARD] allow (failed to refresh /auth/me)');
      }
      return true;
    }
  }

  // Solo forzar wizard si ya tiene plan activo
  if (!user.active_plan_id) {
    if (debug) {
      console.log('[PROVIDER_SETUP_GUARD] allow (no active_plan_id yet)', {
        userId: user?.id,
        role: user?.role,
        pending_role: (user as any)?.pending_role
      });
    }
    return true;
  }

  const url = targetUrl || '';
  if (isAllowedDuringSetup(url)) {
    if (debug) {
      console.log('[PROVIDER_SETUP_GUARD] allow (allowed during setup)', { url });
    }
    return true;
  }

  // Verificar si ya tiene servicio + horario configurados
  try {
    const { services, blocks } = await firstValueFrom(
      forkJoin({
        services: servicesApi.list().pipe(
          map((r: any) => (Array.isArray(r?.services) ? (r.services as ProviderServiceDto[]) : [])),
          catchError(() => of([] as ProviderServiceDto[]))
        ),
        blocks: availabilityApi.getWeekly().pipe(
          map((r: any) => (Array.isArray(r?.blocks) ? (r.blocks as WeeklyBlockDTO[]) : [])),
          catchError(() => of([] as WeeklyBlockDTO[]))
        )
      })
    );

    const hasService = (services?.length || 0) > 0;
    const hasSchedule = (blocks?.length || 0) > 0;

    if (debug) {
      console.log('[PROVIDER_SETUP_GUARD] status', {
        userId: user?.id,
        active_plan_id: user?.active_plan_id,
        servicesCount: services?.length || 0,
        blocksCount: blocks?.length || 0
      });
    }

    if (hasService && hasSchedule) {
      if (debug) {
        console.log('[PROVIDER_SETUP_GUARD] allow (setup complete)');
      }
      return true;
    }

    if (debug) {
      console.warn('[PROVIDER_SETUP_GUARD] redirect -> /dash/provider-setup (setup incomplete)');
    }
    return router.parseUrl('/dash/provider-setup');
  } catch {
    // Si no pudimos verificar, no bloqueamos (evita lockout por errores transitorios)
    if (debug) {
      console.warn('[PROVIDER_SETUP_GUARD] allow (verification failed)');
    }
    return true;
  }
};

export const providerSetupGuard: CanActivateFn = (_route, state) => guardImpl(state?.url);
export const providerSetupChildGuard: CanActivateChildFn = (_route, state) => guardImpl(state?.url);

