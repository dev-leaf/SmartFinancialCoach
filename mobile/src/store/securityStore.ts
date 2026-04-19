import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface SecurityStore {
  isSecurityEnabled: boolean;
  pin: string | null;
  isLocked: boolean;
  isSupported: boolean;
  isReady: boolean;
  
  initializeSecurity: () => Promise<void>;
  toggleSecurity: (enabled: boolean, pin?: string) => Promise<void>;
  lockApp: () => void;
  unlockApp: () => void;
}

export const useSecurityStore = create<SecurityStore>((set, get) => ({
  isSecurityEnabled: false,
  pin: null,
  isLocked: false,
  isSupported: true,
  isReady: false,

  initializeSecurity: async () => {
    try {
      const isEnabled = await SecureStore.getItemAsync('SECURITY_ENABLED');
      const pin = await SecureStore.getItemAsync('SECURITY_PIN');
      
      set({ 
        isSecurityEnabled: isEnabled === 'true',
        pin: pin || null,
        isLocked: isEnabled === 'true',
        isReady: true,
      });
    } catch (e) {
      console.warn('Failed to load security state', e);
      set({ isReady: true });
    }
  },

  toggleSecurity: async (enabled: boolean, pin?: string) => {
    try {
      await SecureStore.setItemAsync('SECURITY_ENABLED', enabled ? 'true' : 'false');
      if (pin) {
        await SecureStore.setItemAsync('SECURITY_PIN', pin);
      } else if (!enabled) {
        await SecureStore.deleteItemAsync('SECURITY_PIN');
      }

      set({
        isSecurityEnabled: enabled,
        pin: enabled && pin ? pin : null,
        isLocked: false 
      });
    } catch (e) {
      console.warn('Failed to save security state', e);
    }
  },

  lockApp: () => {
    if (get().isSecurityEnabled) {
      set({ isLocked: true });
    }
  },

  unlockApp: () => set({ isLocked: false })
}));
