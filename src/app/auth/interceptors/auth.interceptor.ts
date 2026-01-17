import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { SessionExpiredService } from '../../core/services/session-expired.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<any>(null);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const sessionExpired = inject(SessionExpiredService);

  // Agregar token de autorización si existe
  const authReq = addTokenToRequest(req, sessionService);

  // Si el token está por expirar y tenemos refresh token, refrescar ANTES de disparar 401,
  // para que la sesión sea "sliding" mientras el usuario usa la app.
  const shouldPreRefresh =
    !!sessionService.getAccessToken() &&
    !!sessionService.getRefreshToken() &&
    sessionService.isTokenNearExpiry() &&
    !isRefreshRequest(req) &&
    !isPublicAuthFlowRequest(req);

  const request$ = shouldPreRefresh
    ? refreshTokens(authService, sessionService, sessionExpired).pipe(
        switchMap(() => next(addTokenToRequest(req, sessionService)))
      )
    : next(authReq);

  return request$.pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un error 401 (no autorizado)
      if (error.status === 401) {
        // En rutas públicas de auth, no forzar redirect ni refresh: propagamos el error al componente.
        if (isPublicAuthFlowRequest(authReq)) {
          return throwError(() => error);
        }
        const hasRefresh = !!sessionService.getRefreshToken();
        if (hasRefresh) {
          return handle401Error(authReq, next, authService, sessionService, sessionExpired);
        }
        // Sin refresh: cerrar sesión y redirigir de inmediato
        try { sessionService.clearSession(); } catch {}
        try { authService.logout().subscribe({ error: () => {} }); } catch {}
        sessionExpired.forceRedirect();
      }

      // Si es un error 403 (prohibido) sólo forzamos logout cuando el backend lo indique explícitamente
      if (error.status === 403) {
        const forceLogout =
          (error.error && (error.error.forceLogout || error.error.force_logout)) ||
          error.headers.get('x-force-logout') === '1';

        if (forceLogout) {
          try { sessionService.clearSession(); } catch {}
          sessionExpired.forceRedirect('Tu sesión no tiene permisos para continuar. Vuelve a entrar.');
          return throwError(() => error);
        }

        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};

function isRefreshRequest(req: any): boolean {
  try {
    const url = String(req?.url || '');
    return url.includes('/auth/refresh');
  } catch {
    return false;
  }
}

function isPublicAuthFlowRequest(req: any): boolean {
  try {
    const url = String(req?.url || '');
    // Rutas públicas que NO deben gatillar auto-refresh de tokens.
    return (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password') ||
      url.includes('/auth/check-email') ||
      url.includes('/auth/google')
    );
  } catch {
    return false;
  }
}

function addTokenToRequest(req: any, sessionService: SessionService): any {
  const token = sessionService.getAccessToken();
  
  if (token) {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return req;
}

function refreshTokens(
  authService: AuthService,
  sessionService: SessionService,
  sessionExpired: SessionExpiredService
): Observable<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = sessionService.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      sessionExpired.open();
      return throwError(() => new Error('No refresh token available'));
    }

    return authService.refreshToken(refreshToken).pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const accessToken = response?.accessToken || response?.data?.accessToken;
        const newRefreshToken = response?.refreshToken || response?.data?.refreshToken;
        const ok = !!(response?.success ?? response?.data?.success) && !!accessToken;

        if (ok) {
          sessionService.setAccessToken(accessToken);
          if (newRefreshToken) {
            // Importante: algunos backends rotan refresh tokens. Si no lo guardamos, la sesión "expira" aunque el usuario esté activo.
            sessionService.setRefreshToken(newRefreshToken);
          }
          refreshTokenSubject.next(accessToken);
          return of(accessToken);
        }

        sessionExpired.open();
        return throwError(() => new Error('Token refresh failed'));
      }),
      catchError((error) => {
        isRefreshing = false;
        // Si falla refresh (ej: 401), limpiar sesión para evitar loops de refresh en background.
        try { sessionService.clearSession(); } catch {}
        sessionExpired.open();
        return throwError(() => error);
      })
    );
  }

  // Si ya se está refrescando, esperar a que termine
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap((token) => of(token as string))
  );
}

function handle401Error(req: any, next: any, authService: AuthService, sessionService: SessionService, sessionExpired: SessionExpiredService): Observable<any> {
  return refreshTokens(authService, sessionService, sessionExpired).pipe(
    switchMap(() => next(addTokenToRequest(req, sessionService)))
  );
}