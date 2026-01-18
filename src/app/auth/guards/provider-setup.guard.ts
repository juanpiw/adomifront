import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService, AuthUser } from '../services/auth.service';
import { ProviderAvailabilityService, WeeklyBlockDTO } from '../../services/provider-availability.service';
import { ProviderServicesService, ProviderServiceDto } from '../../services/provider-services.service';

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

  let user = auth.getCurrentUser() || getStoredUser();

  // Evitar bloquear cuando el usuario aún no está cargado
  if (!user) return true;

  // Solo aplica a cuentas provider-like
  if (!isProviderLike(user)) return true;

  // Asegurar que tenemos user fresco si falta active_plan_id (evita falsos negativos por estado viejo)
  if (!user.active_plan_id) {
    try {
      const me = await firstValueFrom(auth.getCurrentUserInfo());
      const backendUser: any = (me as any)?.data?.user || (me as any)?.user || null;
      if (backendUser) {
        auth.applyUserFromBackend(backendUser);
        user = backendUser;
      }
    } catch {
      // si falla, no bloqueamos por no poder validar
      return true;
    }
  }

  // Solo forzar wizard si ya tiene plan activo
  if (!user.active_plan_id) return true;

  const url = targetUrl || '';
  if (isAllowedDuringSetup(url)) return true;

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

    if (hasService && hasSchedule) return true;

    return router.parseUrl('/dash/provider-setup');
  } catch {
    // Si no pudimos verificar, no bloqueamos (evita lockout por errores transitorios)
    return true;
  }
};

export const providerSetupGuard: CanActivateFn = (_route, state) => guardImpl(state?.url);
export const providerSetupChildGuard: CanActivateChildFn = (_route, state) => guardImpl(state?.url);

