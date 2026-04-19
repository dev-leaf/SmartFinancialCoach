/**
 * Payment DTOs for Razorpay/Stripe Integration
 * Used for creating orders, verifying payments, and managing subscriptions
 */

// ============================================
// REQUEST DTOs
// ============================================

/**
 * Create Payment Order Request
 * User selects a plan and initiates payment
 */
export class CreatePaymentOrderDto {
  /**
   * Plan ID: "pro_monthly" | "pro_yearly"
   * @example "pro_monthly"
   */
  planId: string;

  /**
   * Payment provider: "razorpay" | "stripe"
   * @example "razorpay"
   */
  provider?: 'razorpay' | 'stripe';

  /**
   * Coupon code for discounts (optional)
   * @example "WELCOME20"
   */
  couponCode?: string;
}

/**
 * Verify Payment Request
 * Mobile sends payment details after successful payment
 */
export class VerifyPaymentDto {
  /**
   * Razorpay order ID
   * @example "order_abc123def456"
   */
  orderId: string;

  /**
   * Razorpay payment ID
   * @example "pay_abc123def456"
   */
  paymentId: string;

  /**
   * Razorpay signature for verification
   * @example "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a"
   */
  signature: string;

  /**
   * Payment provider
   * @example "razorpay"
   */
  provider: 'razorpay' | 'stripe';
}

/**
 * Cancel Subscription Request
 */
export class CancelSubscriptionDto {
  /**
   * Cancellation reason (optional)
   * @example "Too expensive"
   */
  reason?: string;

  /**
   * Feedback (optional)
   * @example "I found a cheaper alternative"
   */
  feedback?: string;
}

/**
 * Restore Purchase Request
 * Used for app store restore/recover purchase flow
 */
export class RestorePurchaseDto {
  /**
   * Original payment ID to restore
   * @example "pay_abc123def456"
   */
  originalPaymentId: string;

  /**
   * App store receipt (iOS)
   * @example "base64-encoded-receipt"
   */
  receipt?: string;
}

/**
 * Webhook Verification DTO
 */
export class WebhookVerificationDto {
  /**
   * Webhook event payload
   */
  payload: Record<string, any>;

  /**
   * Webhook signature
   */
  signature: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Payment Order Response
 * Contains order details for payment initiation
 */
export class PaymentOrderResponse {
  /**
   * Order ID for payment gateway
   */
  orderId: string;

  /**
   * Amount in paise (₹0.01)
   */
  amount: number;

  /**
   * Currency code
   */
  currency: string;

  /**
   * Plan details
   */
  plan: {
    id: string;
    name: string;
    price: number;
    duration: string;
    features: string[];
  };

  /**
   * Razorpay key ID (public)
   */
  razorpayKeyId?: string;

  /**
   * Customer details
   */
  customer: {
    id: string;
    email: string;
    name?: string;
  };

  /**
   * Metadata
   */
  metadata: {
    userId: string;
    planId: string;
    provider: string;
  };

  /**
   * Callback URLs
   */
  callbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Payment Verification Response
 */
export class PaymentVerificationResponse {
  /**
   * Verification success
   */
  success: boolean;

  /**
   * Updated subscription details
   */
  subscription: {
    plan: string;
    tier: 'free' | 'premium' | 'pro';
    status: string;
    startDate: Date;
    expiresAt: Date;
    renewalDate: Date;
    autoRenew: boolean;
  };

  /**
   * Payment details
   */
  payment: {
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: Date;
    receipt: string;
  };

  /**
   * Trial information (if applicable)
   */
  trial?: {
    enabled: boolean;
    endsAt: Date;
  };

  /**
   * Next action for mobile
   */
  nextAction: 'show_success' | 'show_error' | 'request_subscription_restore';
  message: string;
}

/**
 * Subscription Status Response
 */
export class SubscriptionStatusResponse {
  /**
   * Subscription status
   */
  status: 'active' | 'cancelled' | 'expired' | 'trialing' | 'past_due';

  /**
   * Current plan
   */
  plan: string; // "pro_monthly" | "pro_yearly" | "free"

  /**
   * Subscription tier
   */
  tier: 'free' | 'premium' | 'pro';

  /**
   * Start date
   */
  startDate: Date;

  /**
   * Expiration date
   */
  expiresAt?: Date;

  /**
   * Renewal date
   */
  renewalDate?: Date;

  /**
   * Auto-renew enabled
   */
  autoRenew: boolean;

  /**
   * Days remaining
   */
  daysRemaining?: number;

  /**
   * Trial information
   */
  trial: {
    active: boolean;
    endsAt?: Date;
    daysRemaining?: number;
  };

  /**
   * Last payment
   */
  lastPayment: {
    paymentId: string;
    amount: number;
    currency: string;
    date: Date;
    status: string;
  } | null;

  /**
   * Next payment
   */
  nextPayment: {
    amount: number;
    currency: string;
    date: Date;
  } | null;

  /**
   * Grace period (if in grace period)
   */
  gracePeriod: {
    active: boolean;
    endsAt?: Date;
  };

  /**
   * Available features
   */
  features: Record<string, boolean>;
}

/**
 * Refund Response
 */
export class RefundResponse {
  /**
   * Refund success
   */
  success: boolean;

  /**
   * Refund ID
   */
  refundId?: string;

  /**
   * Refund amount
   */
  amount?: number;

  /**
   * Refund status
   */
  status?: string;

  /**
   * Message
   */
  message: string;
}

// ============================================
// INTERNAL DTOs (Backend Use)
// ============================================

/**
 * Plan Configuration
 */
export class PlanConfig {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'pro';
  priceInr: number;
  durationMonths: number;
  features: string[];
  trialDays: number;
  description: string;
}

/**
 * Payment Webhook Event
 */
export class PaymentWebhookEvent {
  eventId: string;
  eventType:
    | 'payment.authorized'
    | 'payment.failed'
    | 'payment.captured'
    | 'order.paid'
    | 'subscription.created'
    | 'subscription.activated'
    | 'subscription.pending'
    | 'subscription.halted'
    | 'subscription.cancelled'
    | 'subscription.completed'
    | 'subscription.updated'
    | 'invoice.issued'
    | 'invoice.paid'
    | 'invoice.expired';
  timestamp: number;
  payload: {
    payment?: {
      id: string;
      entity: string;
      amount: number;
      currency: string;
      status: string;
      method: string;
      description?: string;
      email?: string;
      contact?: string;
      fee?: number;
      tax?: number;
      notes?: Record<string, any>;
      acquirer_data?: Record<string, any>;
      created_at: number;
    };
    order?: {
      id: string;
      entity: string;
      amount: number;
      amount_paid: number;
      amount_due: number;
      currency: string;
      receipt: string;
      offer_id?: string;
      status: string;
      attempts: number;
      notes?: Record<string, any>;
      created_at: number;
    };
    subscription?: {
      id: string;
      entity: string;
      plan_id: string;
      customer_id: string;
      status: string;
      current_start?: number;
      current_end?: number;
      ended_at?: number;
      quantity: number;
      notes?: Record<string, any>;
      created_at: number;
    };
    invoice?: {
      id: string;
      entity: string;
      receipt: string;
      invoice_number: string;
      customer_id: string;
      customer_details?: Record<string, any>;
      order_id?: string;
      subscription_id?: string;
      line_items?: Array<{
        id: string;
        item_id?: string;
        description: string;
        amount: number;
        unit_amount?: number;
        gross_amount: number;
        tax_amount?: number;
        hsn_code?: string;
        sac_code?: string;
        tax_rate?: number;
        unit?: string;
        tax_id?: string;
        tax_amount?: number;
        components?: Record<string, any>;
        quantity?: number;
      }>;
      payment_id?: string;
      status: string;
      expire_by?: number;
      issued_at?: number;
      paid_at?: number;
      cancelled_at?: number;
      expired_at?: number;
      sms_status?: string;
      email_status?: string;
      date: number;
      terms?: string;
      partial_payment: boolean;
      gross_amount: number;
      tax_amount: number;
      taxable_amount: number;
      amount: number;
      amount_paid: number;
      amount_due: number;
      currency: string;
      currency_symbol: string;
      description?: string;
      notes?: Record<string, any>;
      comment?: string;
      short_url: string;
      view_less: boolean;
      billing_start?: number;
      billing_end?: number;
      type: string;
      group_taxes_discounts: boolean;
      created_at: number;
      idempotency_key?: string;
    };
  };
}

/**
 * Payment Processor Response
 * Unified response from Razorpay/Stripe
 */
export class PaymentProcessorResponse {
  success: boolean;
  orderId: string;
  paymentId?: string;
  signature?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Subscription Expiry Calculation
 */
export class SubscriptionExpiryInfo {
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // Within 3 days
}
