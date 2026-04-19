/**
 * CRITICAL FIX P0: Payment Verification Controller
 * 
 * Endpoints for payment processing with idempotency
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService, PaymentVerificationDto, VerificationResult } from './billing.service';

interface AuthReq {
  user: { id: string };
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * POST /billing/verify
   * CRITICAL FIX P0: Verify payment with idempotency key
   * Prevents double charges on network retry
   */
  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Request() req: AuthReq,
    @Body() verificationDto: PaymentVerificationDto,
  ): Promise<ApiResponse<VerificationResult>> {
    if (!verificationDto.idempotencyKey) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Idempotency key is required',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    const result = await this.billingService.verifyPayment(
      req.user.id,
      verificationDto,
    );

    return {
      success: result.success,
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /billing/subscription
   * Get current user's subscription
   * Auto-downgrades if expired
   */
  @Get('subscription')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getSubscription(
    @Request() req: AuthReq,
  ): Promise<ApiResponse<any>> {
    const subscription = await this.billingService.getUserSubscription(
      req.user.id,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subscription retrieved',
      data: subscription || { tier: 'free', status: 'active' },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /billing/premium-check/:feature
   * Check if user has access to a premium feature
   */
  @Get('premium-check/:feature')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async checkPremiumAccess(
    @Request() req: AuthReq,
    @Body() { feature }: { feature: string },
  ): Promise<ApiResponse<{ hasAccess: boolean }>> {
    const hasAccess = await this.billingService.checkPremiumAccess(
      req.user.id,
      feature,
    );

    if (!hasAccess) {
      return {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        message: `Feature '${feature}' requires premium subscription`,
        data: { hasAccess: false },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Premium access granted',
      data: { hasAccess: true },
      timestamp: new Date().toISOString(),
    };
  }
}
