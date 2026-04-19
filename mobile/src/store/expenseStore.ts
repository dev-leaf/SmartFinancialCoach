import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { expenseService } from '../api/expenseService';
import { formatApiError } from '../services/api/httpClient';
import { CreateExpensePayload, Expense, ExpenseState, UpdateExpensePayload } from '../types/expense';
import { calculateCategoryTotals, calculateDailySpending, CategoryTotal, DailySpending } from '../utils/analytics';
import { computeExpenseMetrics, ExpenseMetrics } from '../utils/insights';

export interface ExpenseStoreState extends ExpenseState {
  categoryTotals: CategoryTotal[];
  dailySpending: DailySpending[];
  expenseMetrics: ExpenseMetrics;
  fetchExpenses: () => Promise<void>;
  createExpense: (payload: CreateExpensePayload) => Promise<Expense>;
  updateExpense: (id: string, payload: UpdateExpensePayload) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  setCurrentExpense: (expense: Expense | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

const initialMetrics: ExpenseMetrics = {
  thisMonthTotal: 0,
  lastMonthTotal: 0,
  thisWeekTotal: 0,
  lastWeekTotal: 0,
  highestCategory: '',
  highestCategoryAmount: 0,
  lastMonthHighestCategoryAmount: 0,
  dailyAverage: 0,
  isEmpty: true,
};

const sortExpenses = (expenses: Expense[]) =>
  [...expenses].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

export const useExpenseStore = create<ExpenseStoreState>()(
  devtools((set, get) => ({
    expenses: [],
    currentExpense: null,
    categoryTotals: [],
    dailySpending: [],
    expenseMetrics: initialMetrics,
    isLoading: false,
    error: null,

    fetchExpenses: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await expenseService.getAllExpenses();
        
        const expenses = Array.isArray(response.data)
          ? sortExpenses(response.data)
          : response.data && typeof response.data === 'object'
          ? [response.data]
          : [];

        set({ 
          expenses, 
          categoryTotals: calculateCategoryTotals(expenses),
          dailySpending: calculateDailySpending(expenses, 7),
          expenseMetrics: computeExpenseMetrics(expenses),
          isLoading: false 
        });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    createExpense: async (payload: CreateExpensePayload) => {
      set({ isLoading: true, error: null });
      try {
        const response = await expenseService.createExpense(payload);
        
        const newExpense = response.data as Expense;
        const newExpenses = sortExpenses([...get().expenses, newExpense]);
        
        set({
          expenses: newExpenses,
          categoryTotals: calculateCategoryTotals(newExpenses),
          dailySpending: calculateDailySpending(newExpenses, 7),
          expenseMetrics: computeExpenseMetrics(newExpenses),
          isLoading: false,
        });
        
        return newExpense;
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    updateExpense: async (id: string, payload: UpdateExpensePayload) => {
      set({ isLoading: true, error: null });
      try {
        const response = await expenseService.updateExpense(id, payload);
        
        const updatedExpense = response.data as Expense;
        const newExpenses = sortExpenses(
          get().expenses.map((exp) => (exp.id === id ? updatedExpense : exp)),
        );

        set({
          expenses: newExpenses,
          categoryTotals: calculateCategoryTotals(newExpenses),
          dailySpending: calculateDailySpending(newExpenses, 7),
          expenseMetrics: computeExpenseMetrics(newExpenses),
          currentExpense: updatedExpense,
          isLoading: false,
        });
        
        return updatedExpense;
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    deleteExpense: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await expenseService.deleteExpense(id);
        
        const newExpenses = get().expenses.filter((exp) => exp.id !== id);
        
        set({
          expenses: newExpenses,
          categoryTotals: calculateCategoryTotals(newExpenses),
          dailySpending: calculateDailySpending(newExpenses, 7),
          expenseMetrics: computeExpenseMetrics(newExpenses),
          currentExpense: null,
          isLoading: false,
        });
      } catch (error) {
        const errorMessage = formatApiError(error as any);
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    setCurrentExpense: (expense: Expense | null) => {
      set({ currentExpense: expense });
    },

    setError: (error: string | null) => set({ error }),

    clearError: () => set({ error: null }),

    resetStore: () => {
      set({
        expenses: [],
        currentExpense: null,
        categoryTotals: [],
        dailySpending: [],
        expenseMetrics: initialMetrics,
        isLoading: false,
        error: null,
      });
    },
  }))
);
