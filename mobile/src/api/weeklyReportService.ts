import { httpClient } from '../services/api/httpClient';
import { WeeklyReportResponse } from '../types/weekly-report';

/**
 * Weekly Report API Service
 * Handles all weekly report API calls
 */
export const weeklyReportService = {
  /**
   * Get weekly financial report with spending analysis
   */
  async getWeeklyReport(): Promise<WeeklyReportResponse> {
    return httpClient.get<WeeklyReportResponse>('/reports/weekly');
  },
};
