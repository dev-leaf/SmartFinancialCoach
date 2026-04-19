import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-storage';
import { MobileRazorpayService, SecureSubscriptionStorage, PaymentUtils } from '../services/payment/razorpay.service';
import { logger } from '../utils/logger';

/**
 * Payment Plan Configuration
 */
export interface PlanInfo {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'pro';
  priceInRupees: number;
  priceInPaise: number;
  durationMonths: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  savingsPercentage?: number;
}

/**
 * Subscription State
 */
export interface SubscriptionState {
  // Plans
  plans: PlanInfo[];

  // Current subscription
  subscription: {
    plan: string;
    tier: 'free' | 'premium' | 'pro';
    status: 'active' | 'cancelled' | 'expired' | 'trialing' | 'past_due';
    startDate: Date;
    expiresAt: Date | null;
    renewalDate: Date | null;
    daysRemaining: number;
    autoRenew: boolean;
    lastPaymentId: string | null;
    trialActive: boolean;
    trialEndsAt: Date | null;
  } | null;

  // Feature access
  features: {
    investments: boolean;
    aiInsights: boolean;
    netWorth: boolean;
    subscriptionTracking: boolean;
    advancedAnalytics: boolean;
    customAlerts: boolean;
    exportData: boolean;
  };

  // Payment state
  isPremium: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  paymentInProgress: boolean;
  error: string | null;
  errorType?: 'network' | 'validation' | 'payment' | 'unknown';

  // Actions
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  createPaymentOrder: (planId: string) => Promise<any>;
  processPayment: (planId: string) => Promise<void>;
  verifyPayment: (orderId: string, paymentId: string, signature: string) => Promise<void>;
  cancelSubscription: (reason?: string) => Promise<void>;
  restoreSubscription: () => Promise<void>;
  clearError: () => void;
  clear: () => void;

  // Service instances
  setPaymentService: (service: MobileRazorpayService) => void;
}

/**
 * Mock plans (for testing without real backend)
 */
const MOCK_PLANS: PlanInfo[] = [
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    tier: 'premium',
    priceInRupees: 299,
    priceInPaise: 29900,
    durationMonths: 1,
    description: 'Unlock powerful features to master your finances.',
    features: [
      'Real-time price updates (<10s)',
      'Advanced analytics & charts',
      'AI-powered insights',
      'Custom price alerts',
      'Portfolio rebalancing',
      'Monthly reports',
    ],
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    tier: 'pro',
    priceInRupees: 2499,
    priceInPaise: 249900,
    durationMonths: 12,
    description: 'Best value for serious investors.',
    features: [
      'Everything in Pro Monthly',
      'Tax insights & export',
      'Data export (CSV/PDF)',
      'Unlimited API access',
      'Priority support',
      'Advanced tax reporting',
    ],
    highlighted: true,
    badge: 'Best Value',
    savingsPercentage: 30,
  },
];

/**
 * Mock subscription (for testing)
 */
const MOCK_SUBSCRIPTION = {
  plan: 'free',
  tier: 'free' as const,
  status: 'active' as const,
  startDate: new Date(),
  expiresAt: null,
  renewalDate: null,
  daysRemaining: 0,
  autoRenew: true,
  lastPaymentId: null,
  trialActive: false,
  trialEndsAt: null,
};

/**
 * Enhanced Subscription Store with Real Payment Support
 */
export const useSubscriptionStore = create<SubscriptionState>()(
  devtools((set, get) => ({
    // Initial state
    plans: [],
    subscription: null,
    features: {
      investments: false,
      aiInsights: false,
      netWorth: false,
      subscriptionTracking: false,
      advancedAnalytics: false,
      customAlerts: false,
      exportData: false,
    },
    isPremium: false,
    isLoading: false,
    isSubmitting: false,
    paymentInProgress: false,
    error: null,

    // ============================================
    // FETCH OPERATIONS
    // ============================================

    /**
     * Fetch available plans from backend
     */
    fetchPlans: async () => {
      set({ isLoading: true, error: null });
      logger.info('STORE', 'Fetching available plans...');
      try {
        const paymentService = get().paymentService as any;

        if (!paymentService) {
          logger.warn('STORE', 'Payment service not initialized, using mock plans');
          set({ plans: MOCK_PLANS, isLoading: false });
          return;
        }

        const plansData = await paymentService.getAvailablePlans();
        logger.success('STORE', 'Plans fetched successfully', {
          count: plansData.plans?.length || MOCK_PLANS.length,
        });
        set({ plans: plansData.plans || MOCK_PLANS, isLoading: false });
      } catch (error) {
        logger.error('STORE', 'Failed to fetch plans', error);
        // Fallback to mock plans
        set({
          plans: MOCK_PLANS,
          isLoading: false,
          error: 'Failed to load plans. Using cached data.',
          errorType: 'network',
        });
      }
    },

    /**
     * Fetch current subscription status from backend
     */
    fetchSubscription: async () => {
      set({ isLoading: true, error: null });
      logger.info('STORE', 'Fetching subscription status...');
      try {
        const paymentService = get().paymentService as any;

        if (!paymentService) {
          logger.warn('STORE', 'Payment service not initialized, using mock subscription');
          set({
            subscription: MOCK_SUBSCRIPTION,
            isPremium: false,
            isLoading: false,
          });
          return;
        }

        // Get subscription from API
        const statusData = await paymentService.getSubscriptionStatus();

        const subscription = {
          plan: statusData.plan,
          tier: statusData.tier,
          status: statusData.status,
          startDate: new Date(statusData.startDate),
          expiresAt: statusData.expiresAt ? new Date(statusData.expiresAt) : null,
          renewalDate: statusData.renewalDate ? new Date(statusData.renewalDate) : null,
          daysRemaining: statusData.daysRemaining || 0,
          autoRenew: statusData.autoRenew,
          lastPaymentId: statusData.lastPayment?.paymentId || null,
          trialActive: statusData.trial?.active || false,
          trialEndsAt: statusData.trial?.endsAt ? new Date(statusData.trial.endsAt) : null,
        };

        const isPremium = statusData.tier !== 'free' && statusData.status === 'active';

        logger.success('STORE', 'Subscription status retrieved', {
          tier: subscription.tier,
          status: subscription.status,
          isPremium,
        });

        set({
          subscription,
          features: statusData.features,
          isPremium,
          isLoading: false,
        });

        // Save to secure storage
        const secureStorage = new SecureSubscriptionStorage();
        await secureStorage.saveSubscription(subscription);
        logger.debug('STORE', 'Subscription saved to secure storage');
      } catch (error) {
        logger.error('STORE', 'Failed to fetch subscription', error);
        // Try to restore from secure storage
        const secureStorage = new SecureSubscriptionStorage();
        const cached = await secureStorage.getSubscription();

        set({
          subscription: cached || MOCK_SUBSCRIPTION,
          isPremium: cached ? cached.tier !== 'free' : false,
          isLoading: false,
          error: 'Failed to load subscription. Using cached data.',
          errorType: 'network',
        });
      }
    },

    // ============================================
    // PAYMENT FLOW
    // ============================================

    /**
     * Step 1: Create payment order
     */
    createPaymentOrder: async (planId: string) => {
      set({ isSubmitting: true, error: null, paymentInProgress: true });
      try {
        const paymentService = get().paymentService as any;

        if (!paymentService) {
          throw new Error('Payment service not initialized');
        }

        const order = await paymentService.createPaymentOrder(planId);
        console.log(`✅ Order created: ${order.orderId}`);
        return order;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create order';
        set({
          isSubmitting: false,
          paymentInProgress: false,
          error: message,
          errorType: 'payment',
        });
        throw error;
      }
    },

    /**
     * Complete payment flow (order + payment + verification)
     */
    processPayment: async (planId: string) => {
      set({ isSubmitting: true, paymentInProgress: true, error: null });
      logger.info('STORE', `Starting payment process for plan: ${planId}`);
      try {
        const paymentService = get().paymentService as any;

        if (!paymentService) {
          throw new Error('Payment service not initialized');
        }

        // Complete payment flow
        const result = await paymentService.completePaymentFlow(planId);

        logger.logPaymentOrderCreated(
          result.order?.orderId || 'unknown',
          result.order?.amount || 0,
          planId
        );

        // Update subscription state
        const subscription = {
          plan: planId,
          tier: planId.includes('yearly') ? ('pro' as const) : ('premium' as const),
          status: 'active' as const,
          startDate: new Date(),
          expiresAt: result.subscription.expiresAt
            ? new Date(result.subscription.expiresAt)
            : null,
          renewalDate: result.subscription.renewalDate
            ? new Date(result.subscription.renewalDate)
            : null,
          daysRemaining: result.subscription.daysRemaining || 0,
          autoRenew: result.subscription.autoRenew ?? true,
          lastPaymentId: result.payment.paymentId,
          trialActive: false,
          trialEndsAt: null,
        };

        logger.logSubscriptionUpdate('current-user', subscription.tier, subscription.status);

        set({
          subscription,
          isPremium: true,
          features: result.features || get().features,
          isSubmitting: false,
          paymentInProgress: false,
          error: null,
        });

        // Save to secure storage
        const secureStorage = new SecureSubscriptionStorage();
        await secureStorage.saveSubscription(subscription);
        logger.logStorageOperation('SAVE', 'subscription', true);

        logger.success('PAYMENT', 'Payment processed successfully!', {
          paymentId: result.payment.paymentId,
          planId,
          tier: subscription.tier,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Payment failed';
        logger.error('PAYMENT', 'Payment processing failed', error);
        set({
          isSubmitting: false,
          paymentInProgress: false,
          error: message,
          errorType: 'payment',
        });
        throw error;
      }
    },

    /**
     * Verify payment (called after Razorpay checkout)
     */
    verifyPayment: async (orderId: string, paymentId: string, signature: string) => {
      set({ isSubmitting: true, error: null });
      logger.info('STORE', `Verifying payment: ${paymentId}`);
      try {
        const paymentService = get().paymentService as any;

        if (!paymentService) {
          throw new Error('Payment service not initialized');
        }

        const result = await paymentService.verifyPayment(orderId, paymentId, signature);
        logger.logPaymentVerification(orderId, paymentId, 'verified');

        // Update subscription
        const subscription = {
          plan: result.subscription.plan,
          tier: result.subscription.tier,
          status: result.subscription.status,
          startDate: new Date(result.subscription.startDate),
          expiresAt: result.subscription.expiresAt
            ? new Date(result.subscription.expiresAt)
            : null,
          renewalDate: result.subscription.renewalDate
            ? new Date(result.subscription.renewalDate)
            : null,
          daysRemaining: Math.ceil(
            (new Date(result.subscription.expiresAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
          autoRenew: result.subscription.autoRenew ?? true,
          lastPaymentId: result.payment.paymentId,
          trialActive: false,
          trialEndsAt: null,
        };

        logger.logSubscriptionUpdate('current-user', subscription.tier, subscription.status);

        set({
          subscription,
          isPremium: true,
          isSubmitting: false,
          error: null,
        });

        // Save to secure storage
        const secureStorage = new SecureSubscriptionStorage();
        await secureStorage.saveSubscription(subscription);
        logger.logStorageOperation('SAVE', 'subscription', true);

        logger.success('PAYMENT', 'Payment verified successfully!', {
          paymentId,
          orderId,
          tier: subscription.tier,
        });
      } catch (error) {
        logger.logPaymentVerification(orderId, paymentId, 'failed');
        logger.error('PAYMENT', 'Payment verification failed', error);
        const message = error instanceof Error ? error.message : 'Verification failed';
        set({
          isSubmitting: false,
          error: message,
          errorType: 'payment',
        });
        throw error;
      }
    },

    // ============================================
    // SUBSCRIPTION MANAGEMENT
    // ============================================

    /**
     * Cancel subscription
     */
    cancelSubscription: async (reason?: string) => {
      set({ isSubmitting: true, error: null });
      logger.info('STORE', `Cancelling subscription. Reason: ${reason || 'Not provided'}`);
      try {
        const paymentService = get().paymentService as any;

        if (!paymentService) {
          throw new Error('Payment service not initialized');
        }

        await paymentService.cancelSubscription(reason);

        set({
          subscription: MOCK_SUBSCRIPTION,
          isPremium: false,
          isSubmitting: false,
        });

        // Clear from secure storage
        const secureStorage = new SecureSubscriptionStorage();
        await secureStorage.clearSubscription();
        logger.logStorageOperation('CLEAR', 'subscription', true);

        logger.success('SUBSCRIPTION', 'Subscription cancelled successfully', { reason });
      } catch (error) {
        logger.error('SUBSCRIPTION', 'Failed to cancel subscription', error);
        const message = error instanceof Error ? error.message : 'Cancellation failed';
        set({
          isSubmitting: false,
          error: message,
          errorType: 'payment',
        });
        throw error;
      }
    },

    /**
     * Restore subscription from device storage
     * Called on app launch
     */
    restoreSubscription: async () => {
      logger.info('STORE', 'Restoring subscription from storage...');
      try {
        const secureStorage = new SecureSubscriptionStorage();
        const cached = await secureStorage.getSubscription();

        if (cached) {
          set({
            subscription: cached,
            isPremium: cached.tier !== 'free' && cached.status === 'active',
          });
          logger.success('STORE', 'Subscription restored from secure storage', {
            tier: cached.tier,
            status: cached.status,
          });
        }

        // Also fetch fresh from API
        await get().fetchSubscription();
      } catch (error) {
        logger.error('STORE', 'Failed to restore subscription', error);
      }
    },

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    clearError: () => {
      set({ error: null, errorType: undefined });
    },

    clear: () => {
      set({
        plans: [],
        subscription: null,
        isPremium: false,
        isLoading: false,
        isSubmitting: false,
        paymentInProgress: false,
        error: null,
      });
    },

    /**
     * Set payment service instance
     */
    setPaymentService: (service: MobileRazorpayService) => {
      // Store service in a way that zustand can handle
      (get() as any).paymentService = service;
    },
  })),
);

/**
 * Hook to check if user can access a feature
 */
export const useFeatureAccess = (feature: keyof SubscriptionState['features']) => {
  const features = useSubscriptionStore((state) => state.features);
  return features[feature] === true;
};

/**
 * Hook to get subscription summary
 */
export const useSubscriptionSummary = () => {
  const subscription = useSubscriptionStore((state) => state.subscription);
  const isPremium = useSubscriptionStore((state) => state.isPremium);

  return {
    isPremium,
    isActive: subscription?.status === 'active',
    tier: subscription?.tier || 'free',
    daysRemaining: subscription?.daysRemaining || 0,
    expiresAt: subscription?.expiresAt,
    autoRenew: subscription?.autoRenew ?? true,
  };
};
