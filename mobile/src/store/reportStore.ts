import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { weeklyReportService } from '../api/weeklyReportService';
import { formatApiError } from '../services/api/httpClient';
import { logger } from '../services/logging/logger';
import { WeeklyReport } from '../types/weekly-report';

interface WeeklyReportStoreState {
  report: WeeklyReport | null;
  isLoading: boolean;
  error: string | null;
  fetchWeeklyReport: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

/**
 * Weekly Report Store
 * Manages weekly financial report with spending analysis and insights
 */
export const useWeeklyReportStore = create<WeeklyReportStoreState>()(
  devtools((set) => ({
    report: null,
    isLoading: false,
    error: null,

    fetchWeeklyReport: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await weeklyReportService.getWeeklyReport();

        const report = response.data || null;

        set({ report, isLoading: false });
        logger.info('Weekly report fetched successfully', {
          totalSpent: report?.totalSpent,
          change: report?.change,
        });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        logger.error('Failed to fetch weekly report', { error: errorMessage });
        throw error;
      }
    },

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),

    resetStore: () => {
      set({
        report: null,
        isLoading: false,
        error: null,
      });
    },
  }))
);
