import { create } from 'zustand';

import { walletService, Wallet } from '../api/walletService';
import { formatApiError } from '../services/api/httpClient';
import { logger } from '../services/logging/logger';

interface WalletStore {
  wallets: Wallet[];
  activeWalletId: string | null;
  isLoading: boolean;
  error: string | null;
  rates: Record<string, number> | null;
  fetchWallets: () => Promise<void>;
  setActiveWallet: (id: string) => void;
  createWallet: (data: Partial<Wallet>) => Promise<void>;
  fetchRates: (base?: string) => Promise<void>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  activeWalletId: null,
  isLoading: false,
  error: null,
  rates: null,

  fetchWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletService.getWallets();
      const walletData = response.data;
      const typedWallets: Wallet[] = Array.isArray(walletData) ? walletData : [];
      
      const defaultWallet = typedWallets.find((w: Wallet) => w.isDefault) || typedWallets[0];
      
      set({
        wallets: typedWallets,
        activeWalletId: get().activeWalletId || (defaultWallet ? defaultWallet.id : null),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: formatApiError(error as any) });
    }
  },

  setActiveWallet: (id: string) => set({ activeWalletId: id }),

  createWallet: async (data: Partial<Wallet>) => {
    try {
      await walletService.createWallet(data);
      await get().fetchWallets();
    } catch (error) {
      set({ error: formatApiError(error as any) });
      throw error;
    }
  },

  fetchRates: async (base = 'INR') => {
    try {
      const response = await walletService.getRates(base);
      const ratesData = response.rates || response.data;
      set({ rates: ratesData as any });
    } catch (error) {
      logger.captureException(error, { scope: 'walletStore.fetchRates', base });
    }
  }
}));

