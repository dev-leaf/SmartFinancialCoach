import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { smartAlertsService, SmartAlert, AlertConfiguration } from '../api/smartAlertsService';
import { formatApiError } from '../services/api/httpClient';

interface SmartAlertsStoreState {
  alerts: SmartAlert[];
  activeAlerts: SmartAlert[];
  configuration: AlertConfiguration | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  fetchActiveAlerts: () => Promise<void>;
  fetchAllAlerts: (limit?: number) => Promise<void>;
  generateAlerts: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  fetchConfiguration: () => Promise<void>;
  updateConfiguration: (updates: Partial<AlertConfiguration>) => Promise<void>;

  // Selectors
  getAlertsByType: (type: string) => SmartAlert[];
  getAlertsBySeverity: (severity: string) => SmartAlert[];
  getCriticalAlerts: () => SmartAlert[];
  getWarningAlerts: () => SmartAlert[];

  // Utilities
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSmartAlertsStore = create<SmartAlertsStoreState>()(
  devtools((set, get) => ({
    alerts: [],
    activeAlerts: [],
    configuration: null,
    isLoading: false,
    error: null,
    lastUpdated: null,

    fetchActiveAlerts: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await smartAlertsService.getActiveAlerts();
        const alerts = Array.isArray(response.data) ? response.data : [];
        set({ activeAlerts: alerts, isLoading: false, lastUpdated: new Date() });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
      }
    },

    fetchAllAlerts: async (limit?: number) => {
      set({ isLoading: true, error: null });
      try {
        const response = await smartAlertsService.getAllAlerts(limit);
        const alerts = Array.isArray(response.data) ? response.data : [];
        set({ alerts, isLoading: false, lastUpdated: new Date() });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
      }
    },

    generateAlerts: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await smartAlertsService.generateAlerts();
        const alerts = Array.isArray(response.data) ? response.data : [];
        set({ activeAlerts: alerts, isLoading: false, lastUpdated: new Date() });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
      }
    },

    dismissAlert: async (alertId: string) => {
      try {
        await smartAlertsService.dismissAlert(alertId);
        // Remove from active alerts
        const updated = get().activeAlerts.filter(a => a.id !== alertId);
        set({ activeAlerts: updated });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage });
      }
    },

    fetchConfiguration: async () => {
      try {
        const response = await smartAlertsService.getConfiguration();
        set({ configuration: response.data });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage });
      }
    },

    updateConfiguration: async (updates: Partial<AlertConfiguration>) => {
      try {
        const response = await smartAlertsService.updateConfiguration(updates);
        set({ configuration: response.data });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage });
      }
    },

    getAlertsByType: (type: string) => {
      return get().activeAlerts.filter(a => a.alertType === type);
    },

    getAlertsBySeverity: (severity: string) => {
      return get().activeAlerts.filter(a => a.severity === severity);
    },

    getCriticalAlerts: () => {
      return get().activeAlerts.filter(a => a.severity === 'critical');
    },

    getWarningAlerts: () => {
      return get().activeAlerts.filter(a => a.severity === 'warning');
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  })),
);
