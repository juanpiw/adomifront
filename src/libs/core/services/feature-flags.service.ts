import { Injectable, inject } from '@angular/core';
import { SessionService } from '../../../app/auth/services/session.service';

export type FeatureKey = 'quotes';

type SubscriptionTier = 'basic' | 'premium' | 'founder' | null;

const FEATURE_MATRIX: Record<FeatureKey, SubscriptionTier[]> = {
  quotes: ['premium', 'founder']
};

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagsService {
  private session = inject(SessionService);

  hasFeature(feature: FeatureKey): boolean {
    const tier = this.session.getSubscriptionStatus();
    const allowedTiers = FEATURE_MATRIX[feature];
    if (!allowedTiers) {
      return false;
    }
    return !!tier && allowedTiers.includes(tier);
  }
}

