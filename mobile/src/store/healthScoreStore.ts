import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { healthScoreService } from '../api/healthScoreService';
import { formatApiError } from '../services/api/httpClient';
import { HealthScore } from '../types/health-score';

interface HealthScoreStoreState {
  healthScore: HealthScore | null;
  isLoading: boolean;
  error: string | null;
  fetchHealthScore: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useHealthScoreStore = create<HealthScoreStoreState>()(
  devtools((set) => ({
    healthScore: null,
    isLoading: false,
    error: null,

    fetchHealthScore: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await healthScoreService.getScore();
        const healthScore = response.data as HealthScore;
        set({ healthScore, isLoading: false });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  })),
);
