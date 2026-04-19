import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface UserProperties {
  email?: string;
  signupDate?: Date;
  subscription?: string;
  country?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // In production, initialize PostHog or Firebase
  constructor(private prisma: PrismaService) {
    // this.initializeAnalytics();
  }

  /**
   * Track an event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { event: eventName, userId, properties, timestamp } = event;

      // Log to console for now (replace with PostHog/Firebase)
      this.logger.debug(`Event: ${eventName}`, {
        userId,
        properties,
        timestamp: timestamp?.toISOString(),
      });

      await this.prisma.analyticsEventLog.create({
        data: {
          userId,
          event: eventName,
          properties: properties ?? {},
        },
      });

      // Production: Send to PostHog
      // await this.posthogClient.capture({
      //   distinctId: userId,
      //   event: eventName,
      //   properties,
      //   timestamp: timestamp?.getTime(),
      // });
    } catch (error) {
      this.logger.error('Failed to track event:', error);
    }
  }

  /**
   * Track user properties
   */
  async setUserProperties(userId: string, properties: UserProperties): Promise<void> {
    try {
      this.logger.debug(`User properties: ${userId}`, properties);

      // Production: Send to PostHog
      // await this.posthogClient.identify({
      //   distinctId: userId,
      //   properties: {
      //     email: properties.email,
      //     subscription_tier: properties.subscription,
      //   },
      // });
    } catch (error) {
      this.logger.error('Failed to set user properties:', error);
    }
  }

  /**
   * Common events
   */
  async trackSignup(userId: string, email: string): Promise<void> {
    await this.trackEvent({
      event: 'user_signup',
      userId,
      properties: { email },
    });
  }

  async trackLogin(userId: string): Promise<void> {
    await this.trackEvent({
      event: 'user_login',
      userId,
    });
  }

  async trackExpenseAdded(userId: string, category: string, amount: number): Promise<void> {
    await this.trackEvent({
      event: 'expense_added',
      userId,
      properties: { category, amount },
    });
  }

  async trackInvestmentAdded(userId: string, type: string, amount: number): Promise<void> {
    await this.trackEvent({
      event: 'investment_added',
      userId,
      properties: { type, amount },
    });
  }

  async trackSubscriptionUpgrade(userId: string, tier: string): Promise<void> {
    await this.trackEvent({
      event: 'upgrade',
      userId,
      properties: { tier },
    });
  }

  async trackFeatureUsed(userId: string, feature: string): Promise<void> {
    await this.trackEvent({
      event: 'feature_used',
      userId,
      properties: { feature },
    });
  }

  async trackErrorOccurred(userId: string, error: string, context: string): Promise<void> {
    await this.trackEvent({
      event: 'error_occurred',
      userId,
      properties: { error, context },
    });
  }

  /**
   * Get analytics for a specific metric
   */
  async getMetric(metric: string, startDate: Date, endDate: Date): Promise<any> {
    // In production, query PostHog/Firebase
    this.logger.debug(`Querying metric: ${metric}`, { startDate, endDate });
    return [];
  }
}
