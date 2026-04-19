import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { SubscriptionService } from './services/subscription.service';
import { RazorpayService } from './services/razorpay.service';
import { CreatePaymentOrderDto, VerifyPaymentDto, CancelSubscriptionDto } from './dto/payment.dto';

type AuthReq = ExpressRequest & { user: { id: string; email: string; name: string } };

interface ApiRes<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Payment Controller
 * Handles payment flow: create order → verify payment → update subscription
 */
@Controller('subscriptions')
export class PaymentController {
  constructor(
    private subscriptionService: SubscriptionService,
    private razorpayService: RazorpayService,
  ) {}

  // ============================================
  // SUBSCRIPTION STATUS ENDPOINTS
  // ============================================

  /**
   * GET /subscriptions/status
   * Get detailed subscription status with payment info
   */
  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async getSubscriptionStatus(@Request() req: AuthReq): Promise<ApiRes<any>> {
    const user = req.user;
    const status = await this.subscriptionService.getSubscriptionStatus(user.id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Subscription status retrieved',
      data: status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /subscriptions/plans
   * Get available subscription plans
   */
  @Get('plans')
  async getAvailablePlans(): Promise<ApiRes<any>> {
    const plans = this.razorpayService.getAllPlans();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Available plans retrieved',
      data: {
        plans,
        currency: 'INR',
        trialDays: 7,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /subscriptions/features
   * Get feature gates for current user
   */
  @Get('features')
  @UseGuards(AuthGuard('jwt'))
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

  // ============================================
  // PAYMENT FLOW ENDPOINTS
  // ============================================

  /**
   * POST /subscriptions/create-order
   * Step 1: User selects plan → Create payment order
   * 
   * Request Body:
   * {
   *   "planId": "pro_monthly" | "pro_yearly",
   *   "provider": "razorpay" (optional, defaults to razorpay)
   * }
   */
  @Post('create-order')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createPaymentOrder(
    @Request() req: AuthReq,
    @Body() createPaymentOrderDto: CreatePaymentOrderDto,
  ): Promise<ApiRes<any>> {
    const user = req.user;

    if (!createPaymentOrderDto.planId) {
      throw new BadRequestException('Plan ID is required');
    }

    try {
      const orderResponse = await this.subscriptionService.createPaymentOrder(
        user.id,
        user.email,
        user.name || 'User',
        createPaymentOrderDto,
      );

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Payment order created successfully',
        data: orderResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/verify-payment
   * Step 2: Mobile verifies payment → Backend confirms payment
   * 
   * Request Body:
   * {
   *   "orderId": "order_...",
   *   "paymentId": "pay_...",
   *   "signature": "signature_hash",
   *   "provider": "razorpay"
   * }
   * 
   * Response: Updated subscription with new status
   */
  @Post('verify-payment')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Request() req: AuthReq,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ): Promise<ApiRes<any>> {
    const user = req.user;

    if (!verifyPaymentDto.orderId || !verifyPaymentDto.paymentId || !verifyPaymentDto.signature) {
      throw new BadRequestException('Order ID, Payment ID, and Signature are required');
    }

    try {
      const result = await this.subscriptionService.verifyAndProcessPayment(user.id, verifyPaymentDto);

      return {
        success: result.success,
        statusCode: HttpStatus.OK,
        message: result.message,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/cancel
   * Cancel subscription and downgrade to free tier
   */
  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(
    @Request() req: AuthReq,
    @Body() cancelDto?: CancelSubscriptionDto,
  ): Promise<ApiRes<any>> {
    const user = req.user;

    try {
      const subscription = await this.subscriptionService.cancelSubscription(user.id, cancelDto);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Subscription cancelled successfully',
        data: subscription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw error;
    }
  }

  // ============================================
  // WEBHOOK ENDPOINT
  // ============================================

  /**
   * POST /subscriptions/webhook/razorpay
   * Razorpay webhook endpoint
   * Handle payment events from Razorpay
   * 
   * Security: Verify webhook signature
   * 
   * Events handled:
   * - payment.authorized
   * - payment.failed
   * - order.paid
   * - subscription.created
   * - subscription.activated
   * - subscription.cancelled
   */
  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
  ): Promise<{ received: boolean }> {
    try {
      const rawBody = req.rawBody?.toString('utf-8') || '';
      const signature = req.headers['x-razorpay-signature'] as string;

      if (!signature) {
        console.warn('⚠️ Missing webhook signature');
        return { received: false };
      }

      // Verify webhook signature
      const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return { received: false };
      }

      const eventData = JSON.parse(rawBody);
      console.log(`🔔 Valid webhook received: ${eventData.event}`);

      // Process webhook event
      await this.subscriptionService.handlePaymentWebhook(eventData);

      return { received: true };
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      // Return 200 to prevent Razorpay retries
      // Log error for debugging
      return { received: false };
    }
  }

  // ============================================
  // LEGACY ENDPOINTS (For backward compatibility)
  // ============================================

  /**
   * GET /subscription (Legacy)
   * Get user's current subscription
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
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
   * POST /subscription/upgrade (Legacy - MockMock payment)
   * Deprecated: Use create-order + verify-payment instead
   */
  @Post('upgrade')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async upgradeSubscription(
    @Request() req: AuthReq,
    @Body() { tier }: { tier: string },
  ): Promise<ApiRes<any>> {
    // For backward compatibility with mock system
    // This is deprecated in production
    console.warn('⚠️ Using deprecated /upgrade endpoint. Use create-order + verify-payment instead.');

    if (!['free', 'premium', 'pro'].includes(tier)) {
      throw new BadRequestException('Invalid tier');
    }

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Use create-order + verify-payment for real payments',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
