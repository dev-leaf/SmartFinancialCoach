export type SubscriptionTier = 'free' | 'premium' | 'pro';

export const TierRank: Record<SubscriptionTier, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

