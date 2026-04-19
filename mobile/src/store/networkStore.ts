import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetworkStore {
  isOnline: boolean;
  lastUpdatedAt: number | null;
  initialize: () => () => void;
  setConnection: (isOnline: boolean) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: true,
  lastUpdatedAt: null,

  initialize: () =>
    NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && (state.isInternetReachable ?? true));

      set({
        isOnline,
        lastUpdatedAt: Date.now(),
      });
    }),

  setConnection: (isOnline) =>
    set({
      isOnline,
      lastUpdatedAt: Date.now(),
    }),
}));
