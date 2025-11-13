import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlagsService } from '../../../../libs/core/services/feature-flags.service';

export const quotesFeatureGuard: CanActivateFn = () => {
  const featureFlags = inject(FeatureFlagsService);
  const router = inject(Router);

  if (featureFlags.hasFeature('quotes')) {
    return true;
  }

  router.navigate(['/dash/ingresos'], {
    queryParams: { upgrade: 'quotes' }
  });
  return false;
};

