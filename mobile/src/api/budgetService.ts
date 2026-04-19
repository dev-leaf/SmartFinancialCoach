import { httpClient } from '../services/api/httpClient';
import { BudgetResponse, SetBudgetPayload, SummaryResponse } from '../types/budget';

/**
 * Budget API service
 * Handles all budget-related API calls
 */

export const budgetService = {
  /**
   * Get current month budget
   */
  async getCurrentBudget(): Promise<BudgetResponse> {
    return httpClient.get<BudgetResponse>('/budgets');
  },

  /**
   * Set monthly budget for current month
   */
  async setMonthlyBudget(payload: SetBudgetPayload): Promise<BudgetResponse> {
    return httpClient.post<BudgetResponse>('/budgets', payload);
  },

  /**
   * Get budget summary with all calculations
   * This includes total spending, remaining budget, alert level, etc.
   */
  async getBudgetSummary(): Promise<SummaryResponse> {
    return httpClient.get<SummaryResponse>('/expenses/summary');
  },

  /**
   * Update budget amount.
   * The backend POST /budgets endpoint upserts — it creates or replaces
   * the current month's budget — so we reuse it here.
   * (There is no PUT /budgets route on the server.)
   */
  async updateBudget(payload: SetBudgetPayload): Promise<BudgetResponse> {
    return httpClient.post<BudgetResponse>('/budgets', payload);
  },
};
