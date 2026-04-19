import { useAuthStore } from '../../store/authStore';

interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

/**
 * Mobile analytics service
 * Handles event tracking for PostHog, Firebase, or Mixpanel
 */
export class MobileAnalyticsService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL;

  static async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    try {
      const { user } = useAuthStore.getState();

      const payload: AnalyticsEvent = {
        event,
        userId: user?.id,
        properties,
        timestamp: new Date().toISOString(),
      };

      // Send to backend
      await fetch(`${this.baseUrl}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  static async trackScreenView(screenName: string): Promise<void> {
    await this.trackEvent('screen_view', { screen: screenName });
  }

  static async trackExpenseCreated(amount: number, category: string): Promise<void> {
    await this.trackEvent('expense_created', { amount, category });
  }

  static async trackInvestmentViewed(): Promise<void> {
    await this.trackEvent('feature_used', { feature: 'investments' });
  }

  static async trackHealthScoreViewed(): Promise<void> {
    await this.trackEvent('feature_used', { feature: 'health_score' });
  }

  static async trackPremiumUpgradeClicked(tier: string): Promise<void> {
    await this.trackEvent('upgrade_clicked', { tier });
  }

  static async trackSubscriptionUpgraded(tier: string): Promise<void> {
    await this.trackEvent('subscription_upgraded', { tier });
  }
}
