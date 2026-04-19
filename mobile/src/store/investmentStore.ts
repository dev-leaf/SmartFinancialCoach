import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { investmentService } from '../api/investmentService';
import { formatApiError } from '../services/api/httpClient';
import {
  Investment,
  PortfolioSummary,
  CreateInvestmentPayload,
  NetWorthData,
  NetWorthTrendPoint,
} from '../types/investment';

interface InvestmentStoreState {
  // ── Investments ─────────────────────────────────
  investments: Investment[];
  portfolioSummary: PortfolioSummary | null;
  priceHistory: Record<string, number[]>; // investmentId -> [prices...]
  cachedInvestments: Investment[] | null; // Last successful fetch for offline fallback
  cachedPortfolio: PortfolioSummary | null; // Last successful portfolio for offline fallback
  
  // ── Loading states (granular) ───────────────────
  isLoadingInitial: boolean; // First load of investments
  isRefreshing: boolean;     // Pull-to-refresh
  isSubmitting: boolean;     // Creating/updating/deleting investment
  
  // ── Error handling ──────────────────────────────
  error: string | null;
  errorType: 'network' | 'empty' | 'validation' | null; // Error classification
  lastUpdated: Date | null;

  // ── Net worth ───────────────────────────────────
  netWorth: NetWorthData | null;
  netWorthTrend: NetWorthTrendPoint[];
  isNetWorthLoading: boolean;
  netWorthError: string | null;

  // ── Actions ─────────────────────────────────────
  fetchInvestments: () => Promise<void>;
  fetchPortfolioSummary: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  createInvestment: (payload: CreateInvestmentPayload) => Promise<Investment>;
  updateInvestment: (id: string, payload: Partial<CreateInvestmentPayload>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  fetchNetWorth: () => Promise<void>;
  fetchNetWorthTrend: () => Promise<void>;
  updatePriceHistory: (investmentId: string, price: number) => void;
  getPriceHistory: (investmentId: string) => number[];
  setError: (error: string | null, type?: 'network' | 'empty' | 'validation') => void;
  clearError: () => void;
  // Optimistic updates
  addInvestmentOptimistic: (payload: CreateInvestmentPayload, tempId: string) => void;
  revertOptimisticAdd: (tempId: string) => void;
  recalculatePortfolioLocal: (investments: Investment[]) => void;
}

export const useInvestmentStore = create<InvestmentStoreState>()(
  devtools((set, get) => ({
    investments: [],
    portfolioSummary: null,
    priceHistory: {}, // Initialize price history
    cachedInvestments: null,
    cachedPortfolio: null,
    isLoadingInitial: false,
    isRefreshing: false,
    isSubmitting: false,
    error: null,
    errorType: null,
    lastUpdated: null,
    netWorth: null,
    netWorthTrend: [],
    isNetWorthLoading: false,
    netWorthError: null,

    // ── Fetch investments with live prices ─────────────────────────────────
    fetchInvestments: async () => {
      const currentInvestments = get().investments;
      const isInitialLoad = currentInvestments.length === 0;
      
      // Set appropriate loading state
      set(isInitialLoad 
        ? { isLoadingInitial: true, error: null, errorType: null }
        : { isRefreshing: true, error: null, errorType: null }
      );
      
      try {
        const response = await investmentService.getInvestments();
        console.log('📈 INVESTMENTS API Response:', response);
        
        // Safe extraction - ensure we have an array
        const investments: Investment[] = Array.isArray(response?.data) 
          ? (response.data as Investment[])
          : [];
        
        console.log('📈 Extracted investments count:', investments.length);
        
        // Always spread to force Zustand update
        set({ 
          investments: [...investments],
          cachedInvestments: [...investments], // Cache for offline fallback
          isLoadingInitial: false,
          isRefreshing: false,
          lastUpdated: new Date(),
          error: null,
          errorType: null,
        });
        
        console.log('✅ Investments set in store successfully');
      } catch (error) {
        console.error('❌ Investments fetch error:', error);
        const errorMsg = formatApiError(error as any);
        const errorType = errorMsg.includes('internet') || errorMsg.includes('network') 
          ? 'network' 
          : 'empty';
        
        // Use cached data if available
        const cachedData = get().cachedInvestments;
        if (cachedData && cachedData.length > 0) {
          set({ 
            error: `${errorMsg} (showing cached data)`,
            errorType,
            isLoadingInitial: false,
            isRefreshing: false,
          });
        } else {
          set({ 
            error: errorMsg,
            errorType,
            isLoadingInitial: false,
            isRefreshing: false,
          });
        }
        throw error;
      }
    },

    // ── Fetch portfolio summary ────────────────────────────────────────────
    fetchPortfolioSummary: async () => {
      set({ isLoadingInitial: true, error: null, errorType: null });
      try {
        const response = await investmentService.getPortfolioSummary();
        console.log('📊 PORTFOLIO API Response:', response);
        
        // Validate data exists
        if (!response?.data) {
          console.warn('⚠️ No data in portfolio response');
          set({ 
            portfolioSummary: null, 
            isLoadingInitial: false,
            error: 'Empty portfolio response',
            errorType: 'empty',
          });
          return;
        }
        
        const portfolioSummary = response.data as PortfolioSummary;
        console.log('📊 Portfolio Summary:', {
          totalCurrentValue: portfolioSummary.totalCurrentValue,
          totalProfitLoss: portfolioSummary.totalProfitLoss,
        });
        
        // Spread to force Zustand update
        set({ 
          portfolioSummary: { ...portfolioSummary },
          cachedPortfolio: { ...portfolioSummary },
          isLoadingInitial: false,
          isRefreshing: false,
          lastUpdated: new Date(),
          error: null,
          errorType: null,
        });
        
        console.log('✅ Portfolio summary set in store successfully');
      } catch (error) {
        console.error('❌ Portfolio fetch error:', error);
        const errorMsg = formatApiError(error as any);
        const errorType = errorMsg.includes('internet') || errorMsg.includes('network') 
          ? 'network' 
          : 'empty';
        
        const cachedData = get().cachedPortfolio;
        if (cachedData) {
          set({ 
            error: `${errorMsg} (showing cached data)`,
            errorType,
            isLoadingInitial: false,
            isRefreshing: false,
          });
        } else {
          set({ 
            error: errorMsg,
            errorType,
            isLoadingInitial: false,
            isRefreshing: false,
          });
        }
        throw error;
      }
    },

    // ── Refresh both investments + portfolio in parallel ───────────────────
    refreshPortfolio: async () => {
      const { fetchInvestments, fetchPortfolioSummary, fetchNetWorth } = get();
      set({ isRefreshing: true, error: null, errorType: null });
      try {
        await Promise.all([
          fetchInvestments(),
          fetchPortfolioSummary(),
          fetchNetWorth(),
        ]);
        set({ isRefreshing: false });
      } catch (error) {
        set({ isRefreshing: false });
        throw error;
      }
    },

    // ── Create ─────────────────────────────────────────────────────────────
    createInvestment: async (payload: CreateInvestmentPayload) => {
      set({ isSubmitting: true, error: null, errorType: null });
      try {
        const response = await investmentService.createInvestment(payload);
        const newInvestment = response.data as Investment;
        set(state => ({
          investments: [newInvestment, ...state.investments],
          cachedInvestments: [newInvestment, ...(state.cachedInvestments || [])],
          isSubmitting: false,
          lastUpdated: new Date(),
        }));
        // Refresh portfolio after creating investment
        await get().fetchPortfolioSummary();
        return newInvestment;
      } catch (error) {
        const errorMsg = formatApiError(error as any);
        set({ error: errorMsg, errorType: 'validation', isSubmitting: false });
        throw error;
      }
    },

    // ── Update ─────────────────────────────────────────────────────────────
    updateInvestment: async (id: string, payload: Partial<CreateInvestmentPayload>) => {
      set({ isSubmitting: true, error: null, errorType: null });
      try {
        await investmentService.updateInvestment(id, payload);
        await get().fetchInvestments();
        await get().fetchPortfolioSummary();
      } catch (error) {
        const errorMsg = formatApiError(error as any);
        set({ error: errorMsg, errorType: 'validation', isSubmitting: false });
        throw error;
      }
    },

    // ── Delete ─────────────────────────────────────────────────────────────
    deleteInvestment: async (id: string) => {
      set({ isSubmitting: true, error: null, errorType: null });
      try {
        await investmentService.deleteInvestment(id);
        set(state => ({
          investments: state.investments.filter(inv => inv.id !== id),
          cachedInvestments: state.cachedInvestments ? 
            state.cachedInvestments.filter(inv => inv.id !== id) : null,
          isSubmitting: false,
          lastUpdated: new Date(),
        }));
        await get().fetchPortfolioSummary();
      } catch (error) {
        const errorMsg = formatApiError(error as any);
        set({ error: errorMsg, errorType: 'validation', isSubmitting: false });
        throw error;
      }
    },

    // ── Net Worth ──────────────────────────────────────────────────────────
    fetchNetWorth: async () => {
      set({ isNetWorthLoading: true, netWorthError: null });
      try {
        const response = await investmentService.getNetWorth();
        set({
          netWorth: response.data as NetWorthData,
          isNetWorthLoading: false,
        });
      } catch (error) {
        set({ netWorthError: formatApiError(error as any), isNetWorthLoading: false });
      }
    },

    fetchNetWorthTrend: async () => {
      set({ isNetWorthLoading: true });
      try {
        const response = await investmentService.getNetWorthTrend();
        set({
          netWorthTrend: Array.isArray(response.data)
            ? (response.data as NetWorthTrendPoint[])
            : [],
          isNetWorthLoading: false,
        });
      } catch (error) {
        set({ isNetWorthLoading: false });
      }
    },

    setError: (error, type = 'validation') => set({ error, errorType: type }),
    clearError: () => set({ error: null, errorType: null }),

    // ── Optimistic Updates ─────────────────────────────────────────────────
    addInvestmentOptimistic: (payload: CreateInvestmentPayload, tempId: string) => {
      const tempInvestment: Investment = {
        id: tempId,
        assetName: payload.assetName,
        assetSymbol: payload.assetSymbol,
        type: payload.type as any,
        quantity: payload.quantity,
        buyPrice: payload.buyPrice,
        currentPrice: payload.buyPrice, // Initial estimate
        totalCurrentValue: payload.quantity * payload.buyPrice,
        profitLoss: 0,
        profitLossPercent: 0,
        currency: payload.currency || 'INR',
        purchaseDate: payload.purchaseDate,
        change24h: 0,
        usingCachedPrice: false,
        lastPriceUpdate: new Date(),
      };
      
      set(state => ({
        investments: [tempInvestment, ...state.investments],
      }));
    },

    revertOptimisticAdd: (tempId: string) => {
      set(state => ({
        investments: state.investments.filter(inv => inv.id !== tempId),
      }));
    },

    recalculatePortfolioLocal: (investments: Investment[]) => {
      if (!investments || investments.length === 0) {
        set({ 
          portfolioSummary: {
            totalInvested: 0,
            totalCurrentValue: 0,
            totalProfitLoss: 0,
            totalProfitLossPercent: 0,
            topPerformer: null,
            worstPerformer: null,
            byType: {},
          }
        });
        return;
      }

      const totalInvested = investments.reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);
      const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.totalCurrentValue, 0);
      const totalProfitLoss = totalCurrentValue - totalInvested;
      const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

      const sortedByProfit = [...investments].sort((a, b) => b.profitLossPercent - a.profitLossPercent);
      
      set({
        portfolioSummary: {
          totalInvested,
          totalCurrentValue,
          totalProfitLoss,
          totalProfitLossPercent,
          topPerformer: sortedByProfit[0] || null,
          worstPerformer: sortedByProfit[sortedByProfit.length - 1] || null,
          byType: {}, // Can enhance this if needed
        }
      });
    },

    // ── Price History ──────────────────────────────────────────────────────
    updatePriceHistory: (investmentId: string, price: number) => {
      set((state) => ({
        priceHistory: {
          ...state.priceHistory,
          [investmentId]: [
            ...(state.priceHistory[investmentId] || []),
            price,
          ].slice(-7), // Keep last 7 prices
        },
      }));
    },

    getPriceHistory: (investmentId: string) => {
      return get().priceHistory[investmentId] || [];
    },
  })),
);
