import { httpClient } from '../services/api/httpClient';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

export interface SmartAlert {
  id: string;
  alertType: 'budget_threshold' | 'unusual_spending' | 'subscription_reminder' | 'health_score';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  dismissed: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AlertConfiguration {
  budgetThresholdPercent: number;
  unusualSpendingEnabled: boolean;
  subscriptionRemindersEnabled: boolean;
  dailyDigestEnabled: boolean;
}

export const smartAlertsService = {
  async getActiveAlerts(): Promise<ApiResponse<SmartAlert[]>> {
    return httpClient.get<ApiResponse<SmartAlert[]>>('/alerts/active');
  },

  async getAllAlerts(limit?: number): Promise<ApiResponse<SmartAlert[]>> {
    // Backend currently reads limit from body; we keep default here.
    return httpClient.get<ApiResponse<SmartAlert[]>>('/alerts');
  },

  async generateAlerts(): Promise<ApiResponse<SmartAlert[]>> {
    return httpClient.post<ApiResponse<SmartAlert[]>>('/alerts/generate', {});
  },

  async dismissAlert(alertId: string): Promise<ApiResponse<SmartAlert>> {
    return httpClient.put<ApiResponse<SmartAlert>>(`/alerts/${alertId}/dismiss`, {});
  },

  async getConfiguration(): Promise<ApiResponse<AlertConfiguration>> {
    return httpClient.get<ApiResponse<AlertConfiguration>>('/alerts/config');
  },

  async updateConfiguration(updates: Partial<AlertConfiguration>): Promise<ApiResponse<AlertConfiguration>> {
    return httpClient.put<ApiResponse<AlertConfiguration>>('/alerts/config', updates);
  },
};
