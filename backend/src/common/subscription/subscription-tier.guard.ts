import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../../modules/billing/subscription.service';
import { REQUIRED_TIER_KEY } from './require-tier.decorator';
import { SubscriptionTier, TierRank } from './subscription-tier';

@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<SubscriptionTier | undefined>(
      REQUIRED_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req: any = context.switchToHttp().getRequest();
    const userId: string | undefined = req?.user?.id;
    if (!userId) return true; // auth guard should handle, but don't block here

    await this.subscriptionService.checkAndHandleExpired(userId);
    const sub = await this.subscriptionService.getSubscription(userId);
    const tier = (sub?.tier ?? 'free') as SubscriptionTier;

    if (TierRank[tier] >= TierRank[required]) return true;

    throw new ForbiddenException({
      code: 'FEATURE_LOCKED',
      requiredTier: required,
      currentTier: tier,
      message: `Requires ${required.toUpperCase()} plan`,
    });
  }
}

