import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { netWorthGraphService, NetWorthGraph } from '../api/netWorthGraphService';
import { formatApiError } from '../services/api/httpClient';

type Days = 30 | 90;

interface NetWorthGraphState {
  days: Days;
  graph: NetWorthGraph | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  setDays: (days: Days) => void;
  fetchGraph: (days?: Days) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNetWorthGraphStore = create<NetWorthGraphState>()(
  devtools((set, get) => ({
    days: 30,
    graph: null,
    isLoading: false,
    error: null,
    lastUpdated: null,

    setDays: (days) => set({ days }),

    fetchGraph: async (daysOverride) => {
      const days = daysOverride ?? get().days;
      set({ isLoading: true, error: null, days });
      try {
        const response = await netWorthGraphService.getNetWorthGraph(days);
        set({ graph: response.data, isLoading: false, lastUpdated: new Date() });
      } catch (err) {
        set({ error: formatApiError(err as any), isLoading: false });
      }
    },

    refresh: async () => {
      await get().fetchGraph(get().days);
    },
  })),
);

