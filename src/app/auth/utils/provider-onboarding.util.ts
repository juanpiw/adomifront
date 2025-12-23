import { AuthUser } from '../services/auth.service';

export interface ProviderTempUserData {
  name: string;
  email: string;
  password: string;
  role: 'provider';
}

const TEMP_USER_KEY = 'tempUserData';

/**
 * Determina si el usuario debe ser enviado forzosamente al flujo de selección de plan.
 * Se considera pendiente si tiene pending_role provider y no tiene plan activo o tiene un switch en curso.
 */
export function needsProviderPlan(user?: Partial<AuthUser> | null): boolean {
  if (!user) return false;
  const hasActivePlan = !!user.active_plan_id;
  const finalRoleProvider = user.role === 'provider';
  const pendingProvider = user.pending_role === 'provider';

  // Si el usuario ya tiene plan activo, no forzar.
  if (hasActivePlan) return false;

  // Solo forzar si está en pending_role provider o es provider sin plan asignado.
  return pendingProvider || finalRoleProvider;
}

/**
 * Garantiza que exista tempUserData en sessionStorage para reconstruir el flujo de onboarding.
 * Retorna el objeto que se almacenó o null si no se pudo crear.
 */
export function ensureTempUserData(user?: Partial<AuthUser & { intendedRole?: string }> | null): ProviderTempUserData | null {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }

  if (!user || (!user.email && !user.name)) {
    return null;
  }

  const existing = sessionStorage.getItem(TEMP_USER_KEY);
  if (existing && existing !== 'undefined' && existing !== 'null') {
    try {
      return JSON.parse(existing);
    } catch {
      sessionStorage.removeItem(TEMP_USER_KEY);
    }
  }

  const email = user.email || '';
  if (!email) {
    return null;
  }

  const name = user.name || (email ? email.split('@')[0] : '');
  const temp: ProviderTempUserData = {
    name,
    email,
    password: '',
    role: 'provider'
  };

  try {
    sessionStorage.setItem(TEMP_USER_KEY, JSON.stringify(temp));
    return temp;
  } catch {
    return null;
  }
}

/**
 * Limpia solo los datos temporales del onboarding si no se requieren más.
 */
export function clearTempUserData() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.removeItem(TEMP_USER_KEY);
}





