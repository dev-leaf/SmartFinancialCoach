/**
 * Razorpay Payment Service for React Native
 * Handles Razorpay payment integration on mobile
 */

import { RazorpayCheckout } from 'react-native-razorpay';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  customer: {
    id: string;
    email: string;
    name?: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    duration: string;
  };
}

export interface PaymentResult {
  success: boolean;
  orderId: string;
  paymentId: string;
  signature: string;
  error?: string;
}

/**
 * Mobile Razorpay Service
 */
export class MobileRazorpayService {
  private apiClient: any;
  private baseUrl: string;

  constructor(baseUrl: string, jwtToken: string) {
    this.baseUrl = baseUrl;
    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get available plans from backend
   */
  async getAvailablePlans(): Promise<any> {
    try {
      const response = await this.apiClient.get('/subscriptions/plans');
      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to fetch plans:', error);
      throw error;
    }
  }

  /**
   * Step 1: Create payment order
   * Backend creates Razorpay order
   */
  async createPaymentOrder(planId: string): Promise<PaymentOrder> {
    try {
      const response = await this.apiClient.post('/subscriptions/create-order', {
        planId,
        provider: 'razorpay',
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create order');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to create payment order:', error);
      throw error;
    }
  }

  /**
   * Step 2: Open Razorpay checkout
   * User completes payment
   */
  async openRazorpayCheckout(paymentOrder: PaymentOrder): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      const options: any = {
        description: paymentOrder.plan.name,
        image: 'https://your-app-logo-url', // Add your app logo
        currency: paymentOrder.currency,
        key: paymentOrder.razorpayKeyId,
        amount: paymentOrder.amount, // in paise
        name: 'SmartFinancialCoach',
        order_id: paymentOrder.orderId,
        prefill: {
          email: paymentOrder.customer.email,
          contact: '', // Optional: Add phone if available
          name: paymentOrder.customer.name,
        },
        theme: { color: '#0A84FF' }, // Primary color
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      RazorpayCheckout.open(options)
        .then((data: any) => {
          // Payment completed successfully
          resolve({
            success: true,
            orderId: paymentOrder.orderId,
            paymentId: data.razorpay_payment_id,
            signature: data.razorpay_signature,
          });
        })
        .catch((error: any) => {
          // Payment failed
          console.error('❌ Razorpay checkout error:', error);
          reject({
            success: false,
            orderId: paymentOrder.orderId,
            error: error.description || error.message || 'Payment failed',
          });
        });
    });
  }

  /**
   * Step 3: Verify payment with backend
   * Backend verifies signature and updates subscription
   */
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<any> {
    try {
      const response = await this.apiClient.post('/subscriptions/verify-payment', {
        orderId,
        paymentId,
        signature,
        provider: 'razorpay',
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Payment verification failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Complete payment flow:
   * 1. Create order
   * 2. Open checkout
   * 3. Verify signature
   * 4. Confirm subscription
   */
  async completePaymentFlow(planId: string): Promise<any> {
    try {
      // Step 1: Create order
      console.log(`📋 Creating payment order for plan: ${planId}`);
      const paymentOrder = await this.createPaymentOrder(planId);
      console.log(`✅ Order created: ${paymentOrder.orderId}`);

      // Step 2: Open Razorpay checkout
      console.log('💳 Opening Razorpay checkout...');
      const paymentResult = await this.openRazorpayCheckout(paymentOrder);
      console.log(`✅ Payment completed: ${paymentResult.paymentId}`);

      // Step 3: Verify payment
      console.log('🔐 Verifying payment signature...');
      const verificationResult = await this.verifyPayment(
        paymentResult.orderId,
        paymentResult.paymentId,
        paymentResult.signature,
      );
      console.log(`✅ Payment verified successfully!`);

      return verificationResult;
    } catch (error) {
      console.error('❌ Payment flow error:', error);
      throw error;
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(): Promise<any> {
    try {
      const response = await this.apiClient.get('/subscriptions/status');
      if (!response.data.success) {
        throw new Error('Failed to fetch subscription status');
      }
      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to get subscription status:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(reason?: string): Promise<any> {
    try {
      const response = await this.apiClient.post('/subscriptions/cancel', {
        reason,
      });
      if (!response.data.success) {
        throw new Error('Failed to cancel subscription');
      }
      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      throw error;
    }
  }
}

/**
 * Secure Storage Service
 * Store sensitive subscription data securely
 */
export class SecureSubscriptionStorage {
  private readonly SUBSCRIPTION_KEY = 'app.smartfinancialcoach.subscription';
  private readonly PAYMENT_TOKEN_KEY = 'app.smartfinancialcoach.payment_token';

  /**
   * Save subscription securely
   */
  async saveSubscription(subscription: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.SUBSCRIPTION_KEY,
        JSON.stringify(subscription),
      );
      console.log('✅ Subscription saved securely');
    } catch (error) {
      console.error('❌ Failed to save subscription:', error);
      throw error;
    }
  }

  /**
   * Retrieve subscription from secure storage
   */
  async getSubscription(): Promise<any | null> {
    try {
      const data = await SecureStore.getItemAsync(this.SUBSCRIPTION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Failed to retrieve subscription:', error);
      return null;
    }
  }

  /**
   * Clear subscription data
   */
  async clearSubscription(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.SUBSCRIPTION_KEY);
      console.log('✅ Subscription data cleared');
    } catch (error) {
      console.error('❌ Failed to clear subscription:', error);
    }
  }

  /**
   * Check if subscription is valid
   */
  async isSubscriptionValid(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (!subscription) return false;

      // Check if subscription has expired
      if (subscription.expiresAt) {
        const expiresAt = new Date(subscription.expiresAt);
        if (expiresAt <= new Date()) {
          console.log('⏰ Subscription has expired');
          return false;
        }
      }

      // Check if subscription is active
      return subscription.status === 'active' && subscription.tier !== 'free';
    } catch (error) {
      console.error('❌ Failed to validate subscription:', error);
      return false;
    }
  }

  /**
   * Get days remaining in subscription
   */
  async getDaysRemaining(): Promise<number> {
    try {
      const subscription = await this.getSubscription();
      if (!subscription || !subscription.expiresAt) return 0;

      const expiresAt = new Date(subscription.expiresAt);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      return Math.max(0, daysRemaining);
    } catch (error) {
      console.error('❌ Failed to calculate days remaining:', error);
      return 0;
    }
  }
}

/**
 * Payment Utilities
 */
export class PaymentUtils {
  /**
   * Format price for display
   */
  static formatPrice(priceInPaise: number, currency = 'INR'): string {
    const priceInRupees = priceInPaise / 100;
    if (currency === 'INR') {
      return `₹${priceInRupees.toFixed(0)}`;
    }
    return `${currency} ${priceInRupees.toFixed(2)}`;
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get plan duration label
   */
  static getPlanDurationLabel(months: number): string {
    if (months === 1) return 'month';
    if (months === 12) return 'year';
    return `${months} months`;
  }

  /**
   * Calculate savings
   */
  static calculateSavings(monthlyPrice: number, yearlyPrice: number): number {
    const yearlyEquivalent = monthlyPrice * 12;
    return yearlyEquivalent - yearlyPrice;
  }

  /**
   * Get savings percentage
   */
  static calculateSavingsPercentage(monthlyPrice: number, yearlyPrice: number): number {
    const savings = this.calculateSavings(monthlyPrice, yearlyPrice);
    return Math.round((savings / (monthlyPrice * 12)) * 100);
  }
}
