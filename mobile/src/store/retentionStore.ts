import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DailyReminder {
  id: string;
  date: string;
  spent: number;
  budget: number;
  message: string;
  isRead: boolean;
}

export interface WeeklySummary {
  id: string;
  week: string;
  totalSpent: number;
  prevWeekSpent: number;
  topCategory: string;
  savings: number;
  onBudget: boolean;
}

export interface Nudge {
  id: string;
  type: 'budget_warning' | 'saving_celebration' | 'milestone' | 'anomaly';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  actionUrl?: string;
  createdAt: string;
  isRead: boolean;
}

interface RetentionStoreState {
  dailyReminders: DailyReminder[];
  weeklySummary: WeeklySummary | null;
  nudges: Nudge[];
  lastReminderDate: string | null;
  isLoading: boolean;
  error: string | null;

  // Fetch data
  fetchDailyReminders: () => Promise<void>;
  fetchWeeklySummary: () => Promise<void>;
  fetchNudges: () => Promise<void>;

  // Generate reminders
  generateDailyReminder: () => Promise<void>;
  generateWeeklySummary: () => Promise<void>;

  // Mark as read
  markReminderAsRead: (id: string) => void;
  markNudgeAsRead: (id: string) => void;

  // Utilities
  getTodayReminder: () => DailyReminder | undefined;
  getActiveNudges: () => Nudge[];
}

export const useRetentionStore = create<RetentionStoreState>()(
  devtools((set, get) => ({
    dailyReminders: [],
    weeklySummary: null,
    nudges: [],
    lastReminderDate: null,
    isLoading: false,
    error: null,

    fetchDailyReminders: async () => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Replace with actual API call
        // const response = await retentionService.getDailyReminders();
        // set({ dailyReminders: response.data, isLoading: false });
        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch reminders',
          isLoading: false,
        });
      }
    },

    fetchWeeklySummary: async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await retentionService.getWeeklySummary();
        // set({ weeklySummary: response.data });
      } catch (error) {
        console.error('Failed to fetch weekly summary:', error);
      }
    },

    fetchNudges: async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await retentionService.getNudges();
        // set({ nudges: response.data });
      } catch (error) {
        console.error('Failed to fetch nudges:', error);
      }
    },

    generateDailyReminder: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { lastReminderDate } = get();

        // Only generate if not already generated today
        if (lastReminderDate === today) return;

        // Use lazy imports to avoid circular dependencies
        const { useBudgetStore } = await import('./budgetStore');
        const { useExpenseStore } = await import('./expenseStore');

        const summary = useBudgetStore.getState().summary;
        const expenses = useExpenseStore.getState().expenses;

        if (!summary) return;

        const todayExpenses = expenses.filter((exp: any) =>
          exp.date.startsWith(today)
        );
        const todaySpent = todayExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        let message = '';
        let icon = '💰';

        if (todaySpent > summary.monthlyBudget) {
          message = `⚠️ You've spent ₹${todaySpent} today. Budget exceeded!`;
          icon = '⚠️';
        } else if (todaySpent > summary.monthlyBudget * 0.8) {
          message = `⚠️ You're at 80% of your daily budget. ₹${summary.monthlyBudget - todaySpent} left.`;
          icon = '🔔';
        } else if (todaySpent === 0) {
          message = '✨ No expenses today! Keep it up!';
          icon = '✨';
        } else {
          message = `💰 You spent ₹${todaySpent} today. ₹${summary.monthlyBudget - todaySpent} remaining.`;
        }

        const reminder: DailyReminder = {
          id: `reminder-${today}`,
          date: today,
          spent: todaySpent,
          budget: summary.monthlyBudget,
          message,
          isRead: false,
        };

        // TODO: Send push notification here
        // pushNotificationService.send({
        //   title: 'Daily Spending Update',
        //   body: message,
        //   data: { screen: 'Dashboard' },
        // });

        set((state) => ({
          dailyReminders: [reminder, ...state.dailyReminders],
          lastReminderDate: today,
        }));
      } catch (error) {
        console.error('Failed to generate daily reminder:', error);
      }
    },

    generateWeeklySummary: async () => {
      try {
        // Use lazy imports to avoid circular dependencies
        const { useBudgetStore } = await import('./budgetStore');
        const { useExpenseStore } = await import('./expenseStore');

        const expenses = useExpenseStore.getState().expenses;
        const summary = useBudgetStore.getState().summary;

        // Get this week's expenses
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const thisWeekExpenses = expenses.filter((exp: any) => {
          const expDate = new Date(exp.date);
          return expDate >= startOfWeek && expDate <= today;
        });

        const thisWeekSpent = thisWeekExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        // Get last week's expenses
        const lastWeekStart = new Date(startOfWeek);
        lastWeekStart.setDate(startOfWeek.getDate() - 7);

        const lastWeekExpenses = expenses.filter((exp: any) => {
          const expDate = new Date(exp.date);
          return expDate >= lastWeekStart && expDate < startOfWeek;
        });

        const lastWeekSpent = lastWeekExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        // Calculate top category
        const categoryTotals: Record<string, number> = {};
        thisWeekExpenses.forEach((exp: any) => {
          categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

        const weeklySummary: WeeklySummary = {
          id: `weekly-${startOfWeek.toISOString().split('T')[0]}`,
          week: startOfWeek.toISOString().split('T')[0],
          totalSpent: thisWeekSpent,
          prevWeekSpent: lastWeekSpent,
          topCategory,
          savings: Math.max(0, summary?.monthlyBudget || 0 - thisWeekSpent),
          onBudget: thisWeekSpent <= (summary?.monthlyBudget || 0),
        };

        set({ weeklySummary });

        // TODO: Send push notification
        // pushNotificationService.send({
        //   title: 'Weekly Summary',
        //   body: `You spent ₹${thisWeekSpent} this week. ${weeklySummary.onBudget ? '✅ On budget!' : '⚠️ Over budget!'}`,
        // });
      } catch (error) {
        console.error('Failed to generate weekly summary:', error);
      }
    },

    markReminderAsRead: (id) => {
      set((state) => ({
        dailyReminders: state.dailyReminders.map((r) =>
          r.id === id ? { ...r, isRead: true } : r
        ),
      }));
    },

    markNudgeAsRead: (id) => {
      set((state) => ({
        nudges: state.nudges.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
    },

    getTodayReminder: () => {
      const today = new Date().toISOString().split('T')[0];
      return get().dailyReminders.find((r) => r.date === today);
    },

    getActiveNudges: () => {
      return get().nudges.filter((n) => !n.isRead);
    },
  }))
);

export default useRetentionStore;
