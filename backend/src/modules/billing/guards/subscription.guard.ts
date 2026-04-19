import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { Request as ExpressRequest } from 'express';

type AuthReq = ExpressRequest & { user: { id: string } };

/**
 * PremiumGuard
 * Protects premium routes - ensures user has active paid subscription
 * 
 * Usage:
 * @UseGuards(PremiumGuard)
 * async getPremiumContent(@Request() req) { ... }
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthReq>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is premium
    const isPremium = await this.subscriptionService.isPremiumUser(userId);

    if (!isPremium) {
      throw new ForbiddenException(
        'This feature requires an active premium subscription. Please upgrade to access.',
      );
    }

    return true;
  }
}

/**
 * FeatureGuard
 * Checks if user has access to a specific feature
 * 
 * Usage:
 * @UseGuards(new FeatureGuard('advancedAnalytics'))
 * async getAnalytics(@Request() req) { ... }
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private subscriptionService: SubscriptionService,
    private featureName: keyof import('../services/subscription.service').FeatureGate,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthReq>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check feature access
    const hasAccess = await this.subscriptionService.hasFeatureAccess(userId, this.featureName);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access to "${this.featureName}" requires an active premium subscription.`,
      );
    }

    return true;
  }
}

/**
 * ProGuard
 * Protects pro-only features (higher tier than premium)
 */
@Injectable()
export class ProGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthReq>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get subscription
    const subscription = await this.subscriptionService.getSubscription(userId);

    if (subscription.tier !== 'pro' || subscription.status !== 'active') {
      throw new ForbiddenException(
        'This feature is only available to Pro subscribers. Please upgrade to Pro tier.',
      );
    }

    return true;
  }
}
