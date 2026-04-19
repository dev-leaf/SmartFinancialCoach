import { ExpenseMetrics } from './insights';
import { BudgetSummary } from '../types/budget';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CoachContext {
  expenseMetrics: ExpenseMetrics;
  budgetSummary: BudgetSummary | null;
  userName?: string;
}

/**
 * Builds a prompt payload that would theoretically be sent to OpenAI.
 * Strips raw user data, providing only metrics and category totals to maintain privacy.
 */
export const buildPromptContext = (context: CoachContext, userQuery: string): string => {
  const { expenseMetrics, budgetSummary } = context;
  
  return `
SYSTEM: You are a smart financial advisor helping users reduce expenses and save money.
USER BUDGET: ${budgetSummary ? `Rs. ${budgetSummary.monthlyBudget}` : 'Not set'}
USER TOTAL SPENDING (This Month): Rs. ${expenseMetrics.thisMonthTotal}
HIGHEST SPENDING CATEGORY: ${expenseMetrics.highestCategory} (Rs. ${expenseMetrics.highestCategoryAmount})
DAILY AVERAGE: Rs. ${expenseMetrics.dailyAverage.toFixed(2)}

User Question: ${userQuery}
  `.trim();
};

/**
 * SMART MOCK ENGINE
 * Simulates a highly intelligent AI response by parsing keywords in the query and
 * computing accurate stats from the user's live context.
 */
export const fetchCoachResponse = async (context: CoachContext, userQuery: string): Promise<string> => {
  // Simulate network latency (0.5s to 1.5s)
  const delay = Math.floor(Math.random() * 1000) + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  const lowerQuery = userQuery.toLowerCase();
  const { expenseMetrics, budgetSummary } = context;

  // Pattern Matching for Mock AI replies
  if (lowerQuery.includes('save') || lowerQuery.includes('saving') || lowerQuery.includes('tips')) {
    if (expenseMetrics.highestCategory) {
      return `Based on your data, your biggest expense right now is **${expenseMetrics.highestCategory}** (Rs. ${expenseMetrics.highestCategoryAmount}). Setting a strict weekly limit for that category alone could increase your savings quickly.`;
    }
    return "The easiest way to start saving is to implement the 50/30/20 rule. Allocate 50% to needs, 30% to wants, and instantly auto-transfer 20% to savings the day you get paid.";
  }

  if (lowerQuery.includes('overspending') || lowerQuery.includes('most') || lowerQuery.includes('highest')) {
    if (!expenseMetrics.highestCategory) {
      return "You haven't logged enough expenses this month to determine that yet.";
    }
    
    let advice = `You've spent the most on **${expenseMetrics.highestCategory}** (Rs. ${expenseMetrics.highestCategoryAmount}). `;
    
    if (expenseMetrics.thisMonthTotal > expenseMetrics.lastMonthTotal && expenseMetrics.lastMonthTotal > 0) {
      advice += `This is contributing to you being up Rs. ${(expenseMetrics.thisMonthTotal - expenseMetrics.lastMonthTotal).toFixed(0)} overall compared to last month.`;
    }
    return advice;
  }

  if (lowerQuery.includes('budget') || lowerQuery.includes('status') || lowerQuery.includes('track') || lowerQuery.includes('analyze')) {
    if (!budgetSummary) return "You haven't set a budget yet! Head to the Budgets tab to create one.";
    if (budgetSummary.remainingBudget < 0) {
      return `Alert: you have exceeded your budget by Rs. ${Math.abs(budgetSummary.remainingBudget)}. Consider pausing any non-essential spending for the rest of the month.`;
    }
    
    if (budgetSummary.remainingBudget < 0) {
      return `⚠️ **Alert:** You have exceeded your budget by $${Math.abs(budgetSummary.remainingBudget)}. Consider pausing any non-essential spending for the rest of the month!`;
    } else if (budgetSummary.spendingPercentage > 80) {
      return `You are walking a tightrope. You've used **${budgetSummary.spendingPercentage.toFixed(0)}%** of your budget. You only have Rs. ${budgetSummary.remainingBudget} left.`;
    } else {
      return `You are doing great. You've spent Rs. ${expenseMetrics.thisMonthTotal} and still have **Rs. ${budgetSummary.remainingBudget} remaining**. Keep it up.`;
    }
  }

  // Fallback Catch-all
  return "That's an interesting question. Remember, tracking daily expenses consistently is the #1 habit of financially independent people. What else can I help you analyze?";
};
