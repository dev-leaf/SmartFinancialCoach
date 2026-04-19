/**
 * CRITICAL FIX P0: Payment Idempotency System
 * 
 * Prevents double-charging users by:
 * 1. Storing idempotency keys in database with UNIQUE constraint
 * 2. Checking for duplicate requests before processing
 * 3. Using database transactions for atomicity
 * 
 * Edge cases handled:
 * - Network retry: Same idempotencyKey returns cached result
 * - Race condition: Database constraint prevents duplicates
 * - Concurrent requests: Transaction ensures one wins
 */

import { Injectable, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { logger } from '../../common/services/logger.service';

export interface PaymentVerificationDto {
  orderId: string;
  paymentId: string;
  signature: string;
  idempotencyKey: string;
}

export interface VerificationResult {
  success: boolean;
  subscription: {
    userId: string;
    tier: string;
    status: string;
    expiresAt: Date;
  };
  message: string;
}

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify payment and create subscription with idempotency
   * CRITICAL: This endpoint prevents double charges
   */
  async verifyPayment(
    userId: string,
    verificationDto: PaymentVerificationDto,
  ): Promise<VerificationResult> {
    const { orderId, paymentId, signature, idempotencyKey } = verificationDto;

    // Input validation
    if (!idempotencyKey || !orderId || !paymentId || !signature) {
      throw new BadRequestException('Missing required fields');
    }

    // CRITICAL FIX: Check if already processed
    // This prevents duplicate charges on network retry
    try {
      const existingPayment = await this.prisma.paymentTransaction.findUnique({
        where: { idempotencyKey },
        include: { userSubscription: true },
      });

      if (existingPayment) {
        logger.info('Payment already processed', {
          userId,
          idempotencyKey,
          paymentId: existingPayment.paymentId,
        });

        // Return cached result - NOT charged again
        return {
          success: true,
          subscription: {
            userId: existingPayment.userSubscription.userId,
            tier: existingPayment.userSubscription.tier,
            status: existingPayment.userSubscription.status,
            expiresAt: existingPayment.userSubscription.expiresAt,
          },
          message: 'Payment already verified (idempotency)',
        };
      }
    } catch (error) {
      logger.error('Error checking idempotency', error);
      throw new InternalServerErrorException('Payment verification failed');
    }

    // CRITICAL FIX: Verify payment signature with Razorpay
    // In production, validate against Razorpay webhook or API
    const isValidSignature = await this.verifyRazorpaySignature(
      orderId,
      paymentId,
      signature,
    );

    if (!isValidSignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // CRITICAL FIX: Create subscription atomically in transaction
    // Ensures idempotency key prevents duplicates even on concurrent requests
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Double-check inside transaction (race condition prevention)
          const existing = await tx.paymentTransaction.findUnique({
            where: { idempotencyKey },
            include: { userSubscription: true },
          });

          if (existing) {
            logger.info('Duplicate detected inside transaction', {
              userId,
              idempotencyKey,
            });
            return existing;
          }

          // Get plan details from order metadata
          const planDetails = await this.getPlanDetails(orderId);

          if (!planDetails) {
            throw new NotFoundException('Plan not found');
          }

          // Create user subscription
          const userSubscription = await tx.userSubscription.upsert({
            where: { userId },
            update: {
              tier: planDetails.tier,
              status: 'active',
              startDate: new Date(),
              expiresAt: new Date(
                Date.now() + planDetails.durationDays * 24 * 60 * 60 * 1000,
              ),
            },
            create: {
              userId,
              tier: planDetails.tier,
              status: 'active',
              plan: planDetails.planName,
              startDate: new Date(),
              expiresAt: new Date(
                Date.now() + planDetails.durationDays * 24 * 60 * 60 * 1000,
              ),
            },
          });

          // Create payment transaction record
          const paymentTransaction = await tx.paymentTransaction.create({
            data: {
              userId,
              orderId,
              paymentId,
              signature,
              idempotencyKey, // UNIQUE constraint prevents duplicates
              amount: planDetails.amount,
              status: 'completed',
              userSubscriptionId: userSubscription.userId,
            },
          });

          return paymentTransaction;
        },
        {
          // Set timeout for transaction to prevent deadlocks
          timeout: 10000,
        },
      );

      logger.info('Payment verified and subscription created', {
        userId,
        paymentId,
        tier: result.userSubscription?.tier,
      });

      return {
        success: true,
        subscription: {
          userId: result.userSubscription.userId,
          tier: result.userSubscription.tier,
          status: result.userSubscription.status,
          expiresAt: result.userSubscription.expiresAt,
        },
        message: 'Payment verified and subscription activated',
      };
    } catch (error) {
      if (
        error.code === 'P2002' &&
        error.meta?.target?.includes('idempotencyKey')
      ) {
        // Duplicate key - return cached result
        const existing = await this.prisma.paymentTransaction.findUnique({
          where: { idempotencyKey },
          include: { userSubscription: true },
        });

        if (existing) {
          return {
            success: true,
            subscription: {
              userId: existing.userSubscription.userId,
              tier: existing.userSubscription.tier,
              status: existing.userSubscription.status,
              expiresAt: existing.userSubscription.expiresAt,
            },
            message: 'Payment already processed',
          };
        }
      }

      logger.error('Payment verification error', error);
      throw new InternalServerErrorException('Payment verification failed');
    }
  }

  /**
   * Get subscription for user
   * CRITICAL FIX: Check expiry and auto-downgrade
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return null;
    }

    // CRITICAL FIX: Check if expired and auto-downgrade
    if (
      subscription.status === 'active' &&
      subscription.expiresAt &&
      subscription.expiresAt < new Date()
    ) {
      logger.info('Subscription expired, downgrading to free', { userId });

      await this.prisma.userSubscription.update({
        where: { userId },
        data: {
          status: 'expired',
          tier: 'free',
        },
      });

      return null; // User is now free tier
    }

    return subscription;
  }

  /**
   * Check if user has premium access to a feature
   */
  async checkPremiumAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return false; // Free tier
    }

    // Define feature access by tier
    const featureAccess: Record<string, string[]> = {
      investments: ['premium', 'pro'],
      ai_coach: ['premium', 'pro'],
      custom_alerts: ['pro'],
      data_export: ['pro'],
      advanced_analytics: ['pro'],
    };

    const requiredTiers = featureAccess[feature] || [];

    if (requiredTiers.length === 0) {
      return true; // Feature available to all tiers
    }

    return requiredTiers.includes(subscription.tier);
  }

  /**
   * Verify Razorpay payment signature
   * In production, validate against Razorpay's public key
   */
  private async verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<boolean> {
    try {
      // TODO: Implement actual Razorpay signature verification
      // const crypto = require('crypto');
      // const secret = process.env.RAZORPAY_KEY_SECRET;
      // const body = `${orderId}|${paymentId}`;
      // const expectedSignature = crypto
      //   .createHmac('sha256', secret)
      //   .update(body)
      //   .digest('hex');
      // return signature === expectedSignature;

      // Placeholder - implement with actual Razorpay library
      return signature && orderId && paymentId;
    } catch (error) {
      logger.error('Signature verification error', error);
      return false;
    }
  }

  /**
   * Get plan details from order
   * In production, fetch from database or payment provider
   */
  private async getPlanDetails(
    orderId: string,
  ): Promise<{
    planName: string;
    tier: string;
    amount: number;
    durationDays: number;
  } | null> {
    // TODO: Fetch from order metadata or payment provider
    // For now, hardcode common plans
    const plans: Record<
      string,
      { planName: string; tier: string; amount: number; durationDays: number }
    > = {
      premium_monthly: {
        planName: 'Premium Monthly',
        tier: 'premium',
        amount: 299,
        durationDays: 30,
      },
      pro_yearly: {
        planName: 'Pro Yearly',
        tier: 'pro',
        amount: 2499,
        durationDays: 365,
      },
    };

    return plans[orderId] || null;
  }
}
