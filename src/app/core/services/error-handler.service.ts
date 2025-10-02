import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorDetails {
  message: string;
  status: number;
  field?: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  /**
   * Maneja errores HTTP y devuelve un mensaje de error amigable
   */
  handleHttpError(error: HttpErrorResponse): ErrorDetails {
    console.error('HTTP Error:', error);

    // Error de red o conexión
    if (error.status === 0) {
      return {
        message: 'Error de conexión. Verifica tu conexión a internet',
        status: 0,
        code: 'NETWORK_ERROR'
      };
    }

    // Error de validación (400)
    if (error.status === 400) {
      if (error.error?.details && Array.isArray(error.error.details)) {
        // Errores de validación específicos del backend
        const firstError = error.error.details[0];
        return {
          message: firstError.message || 'Datos inválidos',
          status: 400,
          field: firstError.field,
          code: 'VALIDATION_ERROR'
        };
      }
      return {
        message: error.error?.error || 'Datos inválidos',
        status: 400,
        code: 'BAD_REQUEST'
      };
    }

    // No autorizado (401)
    if (error.status === 401) {
      return {
        message: 'Credenciales inválidas',
        status: 401,
        code: 'UNAUTHORIZED'
      };
    }

    // Prohibido (403)
    if (error.status === 403) {
      return {
        message: 'No tienes permisos para realizar esta acción',
        status: 403,
        code: 'FORBIDDEN'
      };
    }

    // No encontrado (404)
    if (error.status === 404) {
      return {
        message: 'Recurso no encontrado',
        status: 404,
        code: 'NOT_FOUND'
      };
    }

    // Conflicto (409)
    if (error.status === 409) {
      return {
        message: error.error?.error || 'El recurso ya existe',
        status: 409,
        code: 'CONFLICT'
      };
    }

    // Demasiadas solicitudes (429)
    if (error.status === 429) {
      return {
        message: 'Demasiadas solicitudes. Inténtalo más tarde',
        status: 429,
        code: 'RATE_LIMITED'
      };
    }

    // Error del servidor (500+)
    if (error.status >= 500) {
      return {
        message: 'Error interno del servidor. Inténtalo más tarde',
        status: error.status,
        code: 'SERVER_ERROR'
      };
    }

    // Error genérico
    return {
      message: error.error?.error || error.error?.message || 'Ha ocurrido un error inesperado',
      status: error.status,
      code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Maneja errores de autenticación específicos
   */
  handleAuthError(error: HttpErrorResponse): ErrorDetails {
    const baseError = this.handleHttpError(error);

    // Personalizar mensajes para autenticación
    if (error.status === 401) {
      if (error.error?.error === 'invalid credentials') {
        baseError.message = 'Email o contraseña incorrectos';
      } else if (error.error?.error === 'Invalid or expired access token') {
        baseError.message = 'Sesión expirada. Inicia sesión nuevamente';
      } else if (error.error?.error === 'Invalid or expired refresh token') {
        baseError.message = 'Sesión expirada. Inicia sesión nuevamente';
      }
    }

    if (error.status === 403) {
      if (error.error?.error === 'Invalid or revoked refresh token') {
        baseError.message = 'Sesión inválida. Inicia sesión nuevamente';
      }
    }

    return baseError;
  }

  /**
   * Maneja errores de registro específicos
   */
  handleRegisterError(error: HttpErrorResponse): ErrorDetails {
    const baseError = this.handleHttpError(error);

    // Personalizar mensajes para registro
    if (error.status === 409) {
      if (error.error?.error === 'email already registered') {
        baseError.message = 'El email ya está registrado';
      }
    }

    if (error.status === 400) {
      if (error.error?.details && Array.isArray(error.error.details)) {
        const validationErrors = error.error.details;
        const fieldErrors: { [key: string]: string } = {};
        
        validationErrors.forEach((err: any) => {
          if (err.field) {
            fieldErrors[err.field] = err.message;
          }
        });

        // Si hay errores de campo específicos, devolver el primero
        const firstField = Object.keys(fieldErrors)[0];
        if (firstField) {
          return {
            message: fieldErrors[firstField],
            status: 400,
            field: firstField,
            code: 'VALIDATION_ERROR'
          };
        }
      }
    }

    return baseError;
  }

  /**
   * Maneja errores de validación de formularios
   */
  handleValidationError(error: any, field: string): string {
    if (error?.details && Array.isArray(error.details)) {
      const fieldError = error.details.find((err: any) => err.field === field);
      if (fieldError) {
        return fieldError.message;
      }
    }

    if (error?.error && typeof error.error === 'string') {
      return error.error;
    }

    return 'Campo inválido';
  }

  /**
   * Obtiene un mensaje de error amigable para mostrar al usuario
   */
  getFriendlyMessage(error: ErrorDetails): string {
    const messages: { [key: string]: string } = {
      'NETWORK_ERROR': 'Verifica tu conexión a internet',
      'VALIDATION_ERROR': 'Verifica los datos ingresados',
      'UNAUTHORIZED': 'Credenciales incorrectas',
      'FORBIDDEN': 'No tienes permisos para esta acción',
      'NOT_FOUND': 'No se encontró el recurso solicitado',
      'CONFLICT': 'El recurso ya existe',
      'RATE_LIMITED': 'Demasiadas solicitudes. Espera un momento',
      'SERVER_ERROR': 'Error del servidor. Inténtalo más tarde',
      'UNKNOWN_ERROR': 'Ha ocurrido un error inesperado'
    };

    return messages[error.code || 'UNKNOWN_ERROR'] || error.message;
  }

  /**
   * Verifica si un error es recuperable (el usuario puede intentar de nuevo)
   */
  isRecoverableError(error: ErrorDetails): boolean {
    const recoverableCodes = [
      'NETWORK_ERROR',
      'RATE_LIMITED',
      'SERVER_ERROR'
    ];

    return recoverableCodes.includes(error.code || '');
  }

  /**
   * Verifica si un error requiere que el usuario se autentique nuevamente
   */
  requiresReauth(error: ErrorDetails): boolean {
    const reauthCodes = [
      'UNAUTHORIZED',
      'FORBIDDEN'
    ];

    return reauthCodes.includes(error.code || '');
  }
}

