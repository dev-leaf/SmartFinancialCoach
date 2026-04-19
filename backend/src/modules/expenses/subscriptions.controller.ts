import { Controller, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { SubscriptionDetectionService } from './services/subscription-detection.service';

type AuthReq = ExpressRequest & { user: { id: string } };

interface ApiRes<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionDetectionService) {}

  /**
   * GET /subscriptions
   * Detect recurring expenses / subscriptions for the authenticated user.
   */
  @Get()
  async detectSubscriptions(@Request() req: AuthReq): Promise<ApiRes<any>> {
    const insights = await this.subscriptionService.detectSubscriptions(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subscriptions detected successfully',
      data: insights,
      timestamp: new Date().toISOString(),
    };
  }
}
