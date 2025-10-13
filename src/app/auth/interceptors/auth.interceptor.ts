import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
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

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un error 401 (no autorizado)
      if (error.status === 401) {
        const hasRefresh = !!sessionService.getRefreshToken();
        if (hasRefresh) {
          return handle401Error(authReq, next, authService, sessionService, sessionExpired);
        }
        // Sin refresh: mostrar modal de sesión expirada
        sessionExpired.open();
      }

      // Si es un error 403 (prohibido)
      if (error.status === 403) {
        sessionExpired.open('Tu sesión no tiene permisos para continuar. Vuelve a entrar.');
      }

      return throwError(() => error);
    })
  );
};

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

function handle401Error(req: any, next: any, authService: AuthService, sessionService: SessionService, sessionExpired: SessionExpiredService): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = sessionService.getRefreshToken();
    
    if (!refreshToken) {
      sessionExpired.open();
      return throwError(() => new Error('No refresh token available'));
    }

    return authService.refreshToken(refreshToken).pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        
        if (response.success && response.accessToken) {
          // Guardar el nuevo access token
          sessionService.setAccessToken(response.accessToken);
          refreshTokenSubject.next(response.accessToken);
          
          // Reintentar la petición original con el nuevo token
          return next(addTokenToRequest(req, sessionService));
        } else {
          // Si el refresh falla
          sessionExpired.open();
          return throwError(() => new Error('Token refresh failed'));
        }
      }),
      catchError((error) => {
        isRefreshing = false;
        sessionExpired.open();
        return throwError(() => error);
      })
    );
  } else {
    // Si ya se está refrescando, esperar a que termine
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next(addTokenToRequest(req, sessionService)))
    );
  }
}