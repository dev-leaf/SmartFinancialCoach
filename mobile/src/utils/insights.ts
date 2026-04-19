import { Expense } from '../types/expense';
import { BudgetSummary } from '../types/budget';

export interface SmartInsightsResult {
  insights: string[];
  warnings: string[];
  predictions: string[];
}

export interface ExpenseMetrics {
  thisMonthTotal: number;
  lastMonthTotal: number;
  thisWeekTotal: number;
  lastWeekTotal: number;
  highestCategory: string;
  highestCategoryAmount: number;
  lastMonthHighestCategoryAmount: number;
  dailyAverage: number;
  isEmpty: boolean;
}

export const computeExpenseMetrics = (expenses: Expense[]): ExpenseMetrics => {
  if (!expenses || expenses.length === 0) {
    return {
      thisMonthTotal: 0, lastMonthTotal: 0, thisWeekTotal: 0, lastWeekTotal: 0, highestCategory: '',
      highestCategoryAmount: 0, lastMonthHighestCategoryAmount: 0, dailyAverage: 0, isEmpty: true
    };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(now.getDate() - 14);

  let thisMonthTotal = 0;
  let lastMonthTotal = 0;
  let thisWeekTotal = 0;
  let lastWeekTotal = 0;
  
  const categorySpendingThisMonth: Record<string, number> = {};
  const categorySpendingLastMonth: Record<string, number> = {};

  expenses.forEach((expense) => {
    const d = new Date(expense.date);
    const m = d.getMonth();
    const y = d.getFullYear();
    
    // Month calculations
    const isThisMonth = m === currentMonth && y === currentYear;
    const isLastMonth =
      (m === currentMonth - 1 && y === currentYear) ||
      (currentMonth === 0 && m === 11 && y === currentYear - 1);

    if (isThisMonth) {
      thisMonthTotal += expense.amount;
      categorySpendingThisMonth[expense.category] = (categorySpendingThisMonth[expense.category] || 0) + expense.amount;
    } else if (isLastMonth) {
      lastMonthTotal += expense.amount;
      categorySpendingLastMonth[expense.category] = (categorySpendingLastMonth[expense.category] || 0) + expense.amount;
    }

    // Week calculations
    if (d.getTime() >= oneWeekAgo.getTime()) {
      thisWeekTotal += expense.amount;
    } else if (d.getTime() >= twoWeeksAgo.getTime() && d.getTime() < oneWeekAgo.getTime()) {
      lastWeekTotal += expense.amount;
    }
  });

  const categories = Object.keys(categorySpendingThisMonth);
  let highestCategory = '';
  let highestCategoryAmount = 0;

  if (categories.length > 0) {
    highestCategory = categories[0];
    highestCategoryAmount = categorySpendingThisMonth[highestCategory];

    categories.forEach((cat) => {
      if (categorySpendingThisMonth[cat] > highestCategoryAmount) {
        highestCategoryAmount = categorySpendingThisMonth[cat];
        highestCategory = cat;
      }
    });
  }

  const lastMonthHighestCategoryAmount = highestCategory ? (categorySpendingLastMonth[highestCategory] || 0) : 0;
  const currentDay = now.getDate();
  const dailyAverage = thisMonthTotal / currentDay;

  return {
    thisMonthTotal,
    lastMonthTotal,
    thisWeekTotal,
    lastWeekTotal,
    highestCategory,
    highestCategoryAmount,
    lastMonthHighestCategoryAmount,
    dailyAverage,
    isEmpty: false
  };
};

export const generateInsightsFromMetrics = (
  metrics: ExpenseMetrics,
  budget: BudgetSummary | null
): SmartInsightsResult => {
  const result: SmartInsightsResult = {
    insights: [],
    warnings: [],
    predictions: [],
  };

  if (metrics.isEmpty) {
    result.insights.push('Welcome! Start logging your daily expenses and I&apos;ll generate personalized coaching insights for you.');
    return result;
  }

  // 1. Highest spending category
  if (metrics.highestCategory) {
    if (metrics.lastMonthHighestCategoryAmount > 0 && metrics.highestCategoryAmount > metrics.lastMonthHighestCategoryAmount * 1.2) {
      const percentIncrease = (((metrics.highestCategoryAmount - metrics.lastMonthHighestCategoryAmount) / metrics.lastMonthHighestCategoryAmount) * 100).toFixed(0);
      result.warnings.push(`You’re spending ${percentIncrease}% more on ${metrics.highestCategory} this month — consider cutting back on takeout and subscriptions.`);
    } else {
      result.insights.push(`Your biggest spend this month is ${metrics.highestCategory} at ₹${metrics.highestCategoryAmount.toFixed(0)}.`);
    }
  }

  // 2. Week over week comparison (New Apple Pay/Wise smart insights logic)
  if (metrics.lastWeekTotal > 0) {
    const diff = Math.round(((metrics.thisWeekTotal - metrics.lastWeekTotal) / metrics.lastWeekTotal) * 100);
    if (metrics.thisWeekTotal > metrics.lastWeekTotal * 1.15) {
      result.warnings.push(`You’re spending ${diff}% more this week — try trimming one extra coffee, snack, or ride-share.`);
    } else if (metrics.thisWeekTotal < metrics.lastWeekTotal) {
      result.insights.push('Nice work — your weekly spending is down compared to last week. Keep the momentum going.');
    }
  }

  // 3. Month over month comparison fallback
  if (metrics.lastMonthTotal > 0 && result.warnings.length === 0) {
    if (metrics.thisMonthTotal > metrics.lastMonthTotal * 1.25) {
      result.warnings.push(`Just a heads up, your overall spending has climbed ${(((metrics.thisMonthTotal - metrics.lastMonthTotal) / metrics.lastMonthTotal) * 100).toFixed(0)}% compared to last month.`);
    }
  }

  // 4. Budget Analytics
  if (budget && budget.monthlyBudget > 0) {
    const percentage = budget.spendingPercentage;

    if (percentage >= 100) {
      result.warnings.push('Whoops, you&apos;ve crossed your monthly budget boundary. Let&apos;s try to pull back.');
    } else if (percentage >= 80) {
      result.warnings.push(`Be careful, you are nearing your budget limit (${percentage.toFixed(0)}% used).`);
    }

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();

    if (currentDay > 5 && percentage < 100 && metrics.thisMonthTotal > 0) {
      const projectedTotal = metrics.dailyAverage * daysInMonth;

      if (projectedTotal > budget.monthlyBudget) {
        result.predictions.push(`Based on your daily average, you might overshoot your budget by ₹${(projectedTotal - budget.monthlyBudget).toFixed(0)} this month.`);
      } else if (projectedTotal < budget.monthlyBudget * 0.9) {
        result.predictions.push(`Keep it up! You&apos;re on track to end the month with ₹${(budget.monthlyBudget - projectedTotal).toFixed(0)} to spare.`);
      }
    }
  }

  return result;
};
