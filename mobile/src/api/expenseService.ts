import { httpClient } from '../services/api/httpClient';
import { ExpenseResponse, CreateExpensePayload, UpdateExpensePayload } from '../types/expense';

/**
 * Expense API service
 * Handles all expense-related API calls
 */

export const expenseService = {
  /**
   * Get all expenses for current user
   */
  async getAllExpenses(): Promise<ExpenseResponse> {
    return httpClient.get<ExpenseResponse>('/expenses');
  },

  /**
   * Get single expense by ID
   */
  async getExpenseById(id: string): Promise<ExpenseResponse> {
    return httpClient.get<ExpenseResponse>(`/expenses/${id}`);
  },

  /**
   * Create new expense
   */
  async createExpense(payload: CreateExpensePayload): Promise<ExpenseResponse> {
    return httpClient.post<ExpenseResponse>('/expenses', payload);
  },

  /**
   * Update expense
   */
  async updateExpense(id: string, payload: UpdateExpensePayload): Promise<ExpenseResponse> {
    return httpClient.put<ExpenseResponse>(`/expenses/${id}`, payload);
  },

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<ExpenseResponse> {
    return httpClient.delete<ExpenseResponse>(`/expenses/${id}`);
  },

  /**
   * Get expense budget summary with alerts
   */
  async getBudgetSummary(): Promise<any> {
    return httpClient.get('/expenses/summary');
  },
};
