import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureGate {
  investments: boolean;
  aiInsights: boolean;
  netWorth: boolean;
  subscriptionTracking: boolean;
  advancedAnalytics: boolean;
  customAlerts: boolean;
  exportData: boolean;
}

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create user subscription
   */
  async getSubscription(userId: string): Promise<UserSubscription> {
    let subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Create default free tier
      subscription = await this.prisma.userSubscription.create({
        data: {
          userId,
          tier: 'free',
          isActive: true,
          expiresAt: null,
        },
      });
    }

    return { ...subscription, tier: subscription.tier as SubscriptionTier };
  }

  /**
   * Get feature gates based on subscription tier
   */
  async getFeatureGates(userId: string): Promise<FeatureGate> {
    const subscription = await this.getSubscription(userId);

    switch (subscription.tier) {
      case 'pro':
        return {
          investments: true,
          aiInsights: true,
          netWorth: true,
          subscriptionTracking: true,
          advancedAnalytics: true,
          customAlerts: true,
          exportData: true,
        };

      case 'premium':
        return {
          investments: true,
          aiInsights: true,
          netWorth: true,
          subscriptionTracking: true,
          advancedAnalytics: false,
          customAlerts: false,
          exportData: false,
        };

      case 'free':
      default:
        return {
          investments: false,
          aiInsights: false,
          netWorth: false,
          subscriptionTracking: false,
          advancedAnalytics: false,
          customAlerts: false,
          exportData: false,
        };
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(userId: string, feature: keyof FeatureGate): Promise<boolean> {
    const gates = await this.getFeatureGates(userId);
    return gates[feature] === true;
  }

  /**
   * Upgrade subscription (mock implementation)
   * In production, integrate with Stripe/Razorpay
   */
  async upgradeSubscription(userId: string, tier: SubscriptionTier): Promise<UserSubscription> {
    const prev = await this.prisma.userSubscription.findUnique({ where: { userId } });
    let expiresAt: Date | null = null;
    let trialEndsAt: Date | null = null;

    if (tier === 'premium') {
      // Premium: 7-day free trial, then (mock) 1 month validity for now
      trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (tier === 'pro') {
      // Pro: 7-day free trial, then (mock) 1 month validity for now
      trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const result = await this.prisma.userSubscription.upsert({
      where: { userId },
      update: { tier, isActive: true, expiresAt, trialEndsAt, updatedAt: new Date() },
      create: { userId, tier, isActive: true, expiresAt, trialEndsAt },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        userId,
        eventType: 'upgrade',
        fromTier: prev?.tier ?? 'free',
        toTier: tier,
        amountInr: tier === 'premium' ? 99 : tier === 'pro' ? 299 : 0,
      },
    });

    return result as UserSubscription;
  }

  /**
   * Cancel subscription (downgrade to free)
   */
  async cancelSubscription(userId: string): Promise<UserSubscription> {
    const prev = await this.prisma.userSubscription.findUnique({ where: { userId } });
    const cancelled = await this.prisma.userSubscription.update({
      where: { userId },
      data: { tier: 'free', isActive: false, expiresAt: null, updatedAt: new Date() },
    });
    await this.prisma.subscriptionEvent.create({
      data: {
        userId,
        eventType: 'cancel',
        fromTier: prev?.tier ?? 'free',
        toTier: 'free',
        amountInr: 0,
      },
    });
    return { ...cancelled, tier: 'free' as SubscriptionTier };
  }

  /**
   * Check if subscription expired and auto-downgrade
   */
  async checkAndHandleExpired(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId);

    if (
      subscription.isActive &&
      subscription.expiresAt &&
      subscription.expiresAt <= new Date()
    ) {
      await this.prisma.userSubscription.update({
        where: { userId },
        data: {
          isActive: false,
          tier: 'free',
          updatedAt: new Date(),
        },
      });
    }
  }
}
