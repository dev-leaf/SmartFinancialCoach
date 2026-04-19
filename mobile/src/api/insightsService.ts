import { httpClient } from '../services/api/httpClient';
import { InsightsResponse } from '../types/insights';

export const insightsService = {
  async getInsights(): Promise<InsightsResponse> {
    return httpClient.get<InsightsResponse>('/insights');
  },

  async generateInsights(): Promise<InsightsResponse> {
    return httpClient.post<InsightsResponse>('/insights/generate', {});
  },
};
