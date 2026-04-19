import { SetMetadata } from '@nestjs/common';
import { SubscriptionTier } from './subscription-tier';

export const REQUIRED_TIER_KEY = 'requiredTier';

export function RequireTier(tier: SubscriptionTier) {
  return SetMetadata(REQUIRED_TIER_KEY, tier);
}

