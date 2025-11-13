import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlagsService } from '../../../../libs/core/services/feature-flags.service';
import { SessionService } from '../../../auth/services/session.service';

export const quotesFeatureGuard: CanActivateFn = () => {
  const featureFlags = inject(FeatureFlagsService);
  const router = inject(Router);
  const session = inject(SessionService);

  const user = session.getCurrentUser();
  const hasQuotesFeature = featureFlags.hasFeature('quotes');

  console.log('[QUOTES_GUARD] Evaluating access to /dash/cotizaciones', {
    userId: user?.id,
    role: user?.role,
    subscriptionTier: session.getSubscriptionStatus(),
    isProvider: session.isProvider(),
    hasQuotesFeature
  });

  if (hasQuotesFeature) {
    console.log('[QUOTES_GUARD] Access granted to cotizaciones');
    return true;
  }

  console.warn('[QUOTES_GUARD] Access denied. Redirecting to /dash/ingresos', {
    redirectWithUpgrade: true
  });

  router.navigate(['/dash/ingresos'], {
    queryParams: { upgrade: 'quotes' }
  });
  return false;
};

