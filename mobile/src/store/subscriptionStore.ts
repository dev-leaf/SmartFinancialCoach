import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { subscriptionService, FeatureGates, SubscriptionInfo } from '../api/subscriptionService';
import { formatApiError } from '../services/api/httpClient';

export interface PlanInfo {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'pro';
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

interface SubscriptionState {
  // Data
  subscription: SubscriptionInfo | null;
  features: FeatureGates | null;
  plans: PlanInfo[];
  currentPlan: 'free' | 'premium' | 'pro';
  isPremium: boolean;
  
  // Loading & Error
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  subscribe: (planId: string) => Promise<void>;
  restoreSubscription: () => Promise<void>;
  clearError: () => void;
  clear: () => void;
}

// Mock plans for fallback
const MOCK_PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: '₹0',
    period: 'Forever',
    description: 'Basic investment tracking',
    features: [
      'Track investments',
      'Basic portfolio',
      'Monthly reports',
      'Manual price updates',
    ],
  },
  {
    id: 'premium',
    name: 'Pro Monthly',
    tier: 'premium',
    price: '₹299',
    period: '/month',
    description: 'Advanced features included',
    features: [
      'All Free features',
      'Real-time prices (<10s)',
      'Advanced analytics',
      'AI insights',
      'Price alerts',
      'Data export (CSV/PDF)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Yearly',
    tier: 'pro',
    price: '₹2,499',
    period: '/year',
    description: 'Save 30% with annual plan',
    features: [
      'All Pro features',
      'Priority support',
      'Advanced reports',
      'Portfolio optimization',
      'Tax insights',
      'Custom alerts',
    ],
    highlighted: true,
    badge: 'Best Value',
  },
];

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools((set, get) => ({
    // Initial state
    subscription: null,
    features: null,
    plans: MOCK_PLANS,
    currentPlan: 'free',
    isPremium: false,
    isLoading: false,
    isSubmitting: false,
    error: null,

    // Fetch available plans
    fetchPlans: async () => {
      set({ isLoading: true, error: null });
      try {
        // In production, this would call backend
        // For now, use mock plans
        console.log('📋 Fetching plans...');
        set({ 
          plans: MOCK_PLANS,
          isLoading: false,
          error: null,
        });
      } catch (e) {
        console.error('❌ Failed to fetch plans:', e);
        set({ 
          error: formatApiError(e as any), 
          isLoading: false,
          // Keep mock plans as fallback
          plans: MOCK_PLANS,
        });
      }
    },

    // Fetch current subscription
    fetchSubscription: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await subscriptionService.getSubscription();
        const tier = res.data.subscription.tier as 'free' | 'premium' | 'pro';
        set({
          subscription: res.data.subscription,
          features: res.data.features,
          currentPlan: tier,
          isPremium: tier !== 'free' && res.data.subscription.isActive,
          isLoading: false,
          error: null,
        });
        console.log('✅ Subscription fetched:', tier);
      } catch (e) {
        console.error('❌ Failed to fetch subscription:', e);
        set({ 
          error: formatApiError(e as any), 
          isLoading: false,
          // Default to free tier on error
          currentPlan: 'free',
          isPremium: false,
        });
      }
    },

    // Subscribe to a plan
    subscribe: async (planId: string) => {
      set({ isSubmitting: true, error: null });
      try {
        const tierMap: Record<string, 'free' | 'premium' | 'pro'> = {
          'free': 'free',
          'premium': 'premium',
          'pro': 'pro',
        };
        
        const tier = tierMap[planId] || 'free';
        
        // Call backend
        const res = await subscriptionService.upgrade(tier);
        
        set({
          subscription: res.data.subscription || { 
            userId: '', 
            tier, 
            isActive: true, 
            expiresAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          currentPlan: tier,
          isPremium: tier !== 'free',
          isSubmitting: false,
          error: null,
        });
        
        console.log('✅ Subscribed to plan:', tier);
      } catch (e) {
        console.error('❌ Subscription failed:', e);
        set({ 
          error: formatApiError(e as any), 
          isSubmitting: false,
        });
        throw e;
      }
    },

    // Restore subscription from device storage
    restoreSubscription: async () => {
      set({ isLoading: true, error: null });
      try {
        // Would restore from device storage in production
        await get().fetchSubscription();
      } catch (e) {
        console.error('❌ Failed to restore subscription:', e);
        set({ 
          error: formatApiError(e as any), 
          isLoading: false,
        });
      }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Clear all
    clear: () => set({ 
      subscription: null, 
      features: null, 
      currentPlan: 'free',
      isPremium: false,
      isLoading: false,
      isSubmitting: false,
      error: null,
    }),
  })),
);


