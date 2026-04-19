import { httpClient } from '../services/api/httpClient';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface FeatureGates {
  investments: boolean;
  aiInsights: boolean;
  netWorth: boolean;
  subscriptionTracking: boolean;
  advancedAnalytics: boolean;
  customAlerts: boolean;
  exportData: boolean;
}

export interface SubscriptionInfo {
  userId: string;
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export const subscriptionService = {
  async getSubscription(): Promise<ApiResponse<{ subscription: SubscriptionInfo; features: FeatureGates }>> {
    return httpClient.get<ApiResponse<{ subscription: SubscriptionInfo; features: FeatureGates }>>('/subscription');
  },

  async upgrade(tier: SubscriptionTier): Promise<ApiResponse<any>> {
    return httpClient.post<ApiResponse<any>>('/subscription/upgrade', { tier });
  },
};

