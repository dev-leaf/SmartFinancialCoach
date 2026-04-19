import { Expense } from '../types/expense';
import { BudgetSummary } from '../types/budget';

export interface CategoryTotal {
  name: string;
  total: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface DailySpending {
  date: string;
  total: number;
}

// Helper to generate consistent colors for categories
const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#FF6384',
  'Transport': '#36A2EB',
  'Entertainment': '#FFCE56',
  'Shopping': '#4BC0C0',
  'Housing': '#9966FF',
  'Utilities': '#FF9F40',
  'Health': '#FFCD56',
  'Education': '#C9CBFF',
  'Other': '#C0C0C0'
};

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const calculateCategoryTotals = (expenses: Expense[]): CategoryTotal[] => {
  const totals: Record<string, number> = {};

  expenses.forEach(expense => {
    if (!totals[expense.category]) {
      totals[expense.category] = 0;
    }
    totals[expense.category] += expense.amount;
  });

  return Object.keys(totals).map(category => ({
    name: category,
    total: totals[category],
    color: CATEGORY_COLORS[category] || getRandomColor(),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  })).sort((a, b) => b.total - a.total); // Sort highest first
};

export const calculateDailySpending = (expenses: Expense[], days: number = 7): DailySpending[] => {
  const totals: Record<string, number> = {};
  
  // Initialize last N days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    totals[dateStr] = 0;
  }

  // Aggregate expenses
  expenses.forEach(expense => {
    // Handling date formats, assuming expense.date is an ISO string or similar
    const expenseDate = new Date(expense.date);
    const dateStr = expenseDate.toISOString().split('T')[0];
    if (totals[dateStr] !== undefined) {
      totals[dateStr] += expense.amount;
    }
  });

  return Object.keys(totals).map(dateStr => ({
    date: dateStr,
    total: totals[dateStr]
  })).sort((a, b) => a.date.localeCompare(b.date));
};

export const generateSmartInsights = (expenses: Expense[], budgetSummary: BudgetSummary | null): string[] => {
  const insights: string[] = [];

  if (expenses.length === 0) {
    return ['No expenses yet. Start tracking to get insights!'];
  }

  const categoryTotals = calculateCategoryTotals(expenses);
  
  // 1. Highest Spending Category
  if (categoryTotals.length > 0) {
    const highest = categoryTotals[0];
    insights.push(`Your highest spending category is ${highest.name} (${highest.total})`);
  }

  // 2. Budget usages
  if (budgetSummary && budgetSummary.monthlyBudget > 0) {
    const percentage = budgetSummary.spendingPercentage;
    
    if (percentage >= 100) {
       insights.push(`You have exceeded your monthly budget by ${budgetSummary.totalSpending - budgetSummary.monthlyBudget}`);
    } else if (percentage >= 80) {
       insights.push(`You have used ${percentage.toFixed(0)}% of your budget. Slow down!`);
    } else {
       insights.push(`You have used ${percentage.toFixed(0)}% of your monthly budget.`);
    }

    // 3. Quick burn rate projection (simplified)
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    
    if (currentDay > 5 && percentage > 0 && percentage < 100) {
      const projectedTotal = (budgetSummary.totalSpending / currentDay) * daysInMonth;
      if (projectedTotal > budgetSummary.monthlyBudget) {
        insights.push(`Projected to exceed your budget by ${Math.round(projectedTotal - budgetSummary.monthlyBudget)} end of month.`);
      } else {
        insights.push(`On track to save ${Math.round(budgetSummary.monthlyBudget - projectedTotal)} this month!`);
      }
    }
  }

  return insights;
};
