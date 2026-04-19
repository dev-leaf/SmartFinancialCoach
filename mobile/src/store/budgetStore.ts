import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { budgetService } from '../api/budgetService';
import { env } from '../config/env';
import { formatApiError } from '../services/api/httpClient';
import { logger } from '../services/logging/logger';
import { Budget, BudgetState, BudgetSummary, SetBudgetPayload } from '../types/budget';

/**
 * Budget Store
 * Manages budget, summary with alerts, loading and error states
 */

interface BudgetStoreState extends BudgetState {
  fetchBudget: () => Promise<void>;
  setMonthlyBudget: (payload: SetBudgetPayload) => Promise<Budget>;
  fetchBudgetSummary: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

export const useBudgetStore = create<BudgetStoreState>()(
  devtools((set) => ({
    budget: null,
    summary: null,
    isLoading: false,
    error: null,

    fetchBudget: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await budgetService.getCurrentBudget();

        const budget =
          response.data && typeof response.data === 'object' && 'amount' in response.data
            ? (response.data as Budget)
            : null;

        set({ budget, isLoading: false });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    setMonthlyBudget: async (payload: SetBudgetPayload) => {
      set({ isLoading: true, error: null });
      try {
        const response = await budgetService.setMonthlyBudget(payload);

        if (!response.data || typeof response.data !== 'object' || !('amount' in response.data)) {
          throw new Error('Budget response was empty.');
        }

        const budget = response.data as Budget;
        set({ budget, isLoading: false });

        return budget;
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    fetchBudgetSummary: async () => {
      set({ isLoading: true, error: null });
      try {
        const [summaryResponse, budgetResponse] = await Promise.all([
          budgetService.getBudgetSummary(),
          budgetService.getCurrentBudget(),
        ]);

        const budgetAmount =
          budgetResponse.data && typeof budgetResponse.data === 'object' && 'amount' in budgetResponse.data
            ? Number(budgetResponse.data.amount)
            : env.defaultBudgetAmount;

        const summaryData = summaryResponse.data;
        const summary: BudgetSummary | null = summaryData
          ? {
              totalSpending: summaryData.totalSpending,
              monthlyBudget: budgetAmount,
              remainingBudget: summaryData.remaining,
              spendingPercentage: summaryData.percentageUsed,
              alertLevel: summaryData.alertLevel,
              expenseCount: summaryData.expenseCount,
            }
          : null;

        set({ summary, isLoading: false });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        logger.captureException(error, { scope: 'budgetStore.fetchBudgetSummary' });
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    setError: (error: string | null) => set({ error }),

    clearError: () => set({ error: null }),

    resetStore: () => {
      set({
        budget: null,
        summary: null,
        isLoading: false,
        error: null,
      });
    },
  }))
);
