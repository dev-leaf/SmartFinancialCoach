import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { insightsService } from '../api/insightsService';
import { formatApiError } from '../services/api/httpClient';
import { AIInsight } from '../types/insights';

interface InsightsStoreState {
  insights: AIInsight[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchInsights: () => Promise<void>;
  generateInsights: () => Promise<void>;
  getInsightsByCategory: (category: string) => AIInsight[];
  getActionableInsights: () => AIInsight[];
  getPositiveInsights: () => AIInsight[];
  getCriticalInsights: () => AIInsight[];
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useInsightsStore = create<InsightsStoreState>()(
  devtools((set, get) => ({
    insights: [],
    isLoading: false,
    error: null,
    lastUpdated: null,

    fetchInsights: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await insightsService.getInsights();
        const insights = Array.isArray(response.data) ? response.data : [];
        set({ insights, isLoading: false, lastUpdated: new Date() });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    generateInsights: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await insightsService.generateInsights();
        const insights = Array.isArray(response.data) ? response.data : [];
        set({ insights, isLoading: false, lastUpdated: new Date() });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    getInsightsByCategory: (category: string) => {
      return get().insights.filter(i => i.category === category);
    },

    getActionableInsights: () => {
      return get().insights.filter(i => i.actionable).slice(0, 5);
    },

    getPositiveInsights: () => {
      return get().insights.filter(i => i.impact === 'positive');
    },

    getCriticalInsights: () => {
      return get().insights.filter(i => i.severity === 'critical');
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  })),
);
