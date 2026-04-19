import { httpClient } from '../services/api/httpClient';
import { HealthScoreResponse } from '../types/health-score';

export const healthScoreService = {
  async getScore(): Promise<HealthScoreResponse> {
    return httpClient.get<HealthScoreResponse>('/health-score');
  },
};
