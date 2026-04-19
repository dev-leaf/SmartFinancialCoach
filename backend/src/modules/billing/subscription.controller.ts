import { Controller, Get, Post, Body, UseGuards, Request, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { SubscriptionService, SubscriptionTier } from './subscription.service';

type AuthReq = ExpressRequest & { user: { id: string } };

interface ApiRes<T> { success: boolean; statusCode: number; message: string; data: T; timestamp: string; }

@Controller('subscription')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  /**
   * GET /subscription
   * Get user's current subscription
   */
  @Get()
  async getSubscription(@Request() req: AuthReq): Promise<ApiRes<any>> {
    const user = req.user;
    const subscription = await this.subscriptionService.getSubscription(user.id);
    const features = await this.subscriptionService.getFeatureGates(user.id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subscription retrieved',
      data: {
        subscription,
        features,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /subscription/features
   * Get available features for current subscription
   */
  @Get('features')
  async getFeatures(@Request() req: AuthReq): Promise<ApiRes<any>> {
    const user = req.user;
    const features = await this.subscriptionService.getFeatureGates(user.id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Features retrieved',
      data: features,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /subscription/upgrade
   * Upgrade subscription tier
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  async upgradeSubscription(
    @Request() req: AuthReq,
    @Body() { tier }: { tier: SubscriptionTier }
  ): Promise<ApiRes<any>> {
    const user = req.user;
    if (!['free', 'premium', 'pro'].includes(tier)) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid tier',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    const subscription = await this.subscriptionService.upgradeSubscription(user.id, tier);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Upgraded to ${tier} tier`,
      data: subscription,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /subscription/cancel
   * Downgrade to free tier
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Request() req: AuthReq): Promise<ApiRes<any>> {
    const user = req.user;
    const subscription = await this.subscriptionService.cancelSubscription(user.id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subscription cancelled',
      data: subscription,
      timestamp: new Date().toISOString(),
    };
  }
}
