import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  isAutoTrackEnabled: boolean;
  lastSyncTimestamp: number | null;
  processedSmsIds: string[];
  isLoaded: boolean;
  
  // Actions
  toggleAutoTrack: (enabled: boolean) => Promise<void>;
  updateLastSync: (timestamp: number) => Promise<void>;
  addProcessedSmsId: (id: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEYS = {
  AUTO_TRACK: 'sfcoach_auto_track',
  LAST_SYNC: 'sfcoach_last_sync',
  PROCESSED_IDS: 'sfcoach_processed_ids'
};

export const useSettingsStore = create<SettingsState>()(
  devtools((set, get) => ({
    isAutoTrackEnabled: false,
    lastSyncTimestamp: null,
    processedSmsIds: [],
    isLoaded: false,

    toggleAutoTrack: async (enabled: boolean) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTO_TRACK, JSON.stringify(enabled));
        set({ isAutoTrackEnabled: enabled });
      } catch (e) {
        console.error('Failed to save auto track setting', e);
      }
    },

    updateLastSync: async (timestamp: number) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
        set({ lastSyncTimestamp: timestamp });
      } catch (e) {
        console.error('Failed to save last sync', e);
      }
    },

    addProcessedSmsId: async (id: string) => {
      try {
        const currentIds = get().processedSmsIds;
        // Keep only last 500 to prevent ballooning storage
        const newIds = [...currentIds, id].slice(-500);
        
        await AsyncStorage.setItem(STORAGE_KEYS.PROCESSED_IDS, JSON.stringify(newIds));
        set({ processedSmsIds: newIds });
      } catch (e) {
        console.error('Failed to save processed ID', e);
      }
    },

    loadSettings: async () => {
      try {
        const autoTrackRaw = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_TRACK);
        const lastSyncRaw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        const idsRaw = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSED_IDS);

        set({
          isAutoTrackEnabled: autoTrackRaw ? JSON.parse(autoTrackRaw) : false,
          lastSyncTimestamp: lastSyncRaw ? parseInt(lastSyncRaw, 10) : null,
          processedSmsIds: idsRaw ? JSON.parse(idsRaw) : [],
          isLoaded: true,
        });
      } catch (e) {
        console.error('Failed to load settings', e);
        set({ isLoaded: true });
      }
    }
  }))
);
