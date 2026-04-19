import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface WeeklyReportDto {
  totalSpent: number;
  change: string; // "+12%" or "-8%"
  topCategory: string | null;
  biggestExpense: number | null;
  savingsRate: number;
  insight: string;
}

@Injectable()
export class WeeklyReportService {
  constructor(private prisma: PrismaService) {}

  async getWeeklyReport(userId: string): Promise<WeeklyReportDto> {
    const now = new Date();

    // Last 7 days (today inclusive)
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(now);
    lastWeekEnd.setHours(23, 59, 59, 999);

    // Previous 7 days (7-14 days ago)
    const prevWeekStart = new Date(lastWeekStart);
    prevWeekStart.setDate(lastWeekStart.getDate() - 7);

    const prevWeekEnd = new Date(lastWeekStart);
    prevWeekEnd.setHours(23, 59, 59, 999);

    // Fetch expenses for both weeks
    const [currentWeekExpenses, previousWeekExpenses] = await Promise.all([
      this.prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: lastWeekStart,
            lte: lastWeekEnd,
          },
        },
      }),
      this.prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: prevWeekStart,
            lt: prevWeekEnd,
          },
        },
      }),
    ]);

    // Calculate totals
    const totalSpent = currentWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const previousWeekSpent = previousWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate percentage change
    let percentageChange = 0;
    if (previousWeekSpent > 0) {
      percentageChange = ((totalSpent - previousWeekSpent) / previousWeekSpent) * 100;
    } else if (totalSpent > 0) {
      percentageChange = 100; // Went from 0 to something
    }

    // Format change string
    const changeFormatted = percentageChange >= 0
      ? `+${Math.round(percentageChange)}%`
      : `${Math.round(percentageChange)}%`;

    // Get top category
    const categoryGroups: Record<string, number> = {};
    currentWeekExpenses.forEach((exp) => {
      categoryGroups[exp.category] = (categoryGroups[exp.category] || 0) + exp.amount;
    });

    const topCategory = Object.keys(categoryGroups).length > 0
      ? Object.entries(categoryGroups).sort(([, a], [, b]) => b - a)[0][0]
      : null;

    // Get biggest expense
    const biggestExpense = currentWeekExpenses.length > 0
      ? Math.max(...currentWeekExpenses.map((exp) => exp.amount))
      : null;

    // Get user's monthly budget for savings rate calculation
    const now_date = new Date();
    const budget = await this.prisma.budget.findFirst({
      where: {
        userId,
        month: now_date.getMonth() + 1,
        year: now_date.getFullYear(),
      },
    });

    // Calculate savings rate (daily average savings vs budget)
    let savingsRate = 0;
    if (budget) {
      const dailyBudget = budget.amount / 30;
      const dailySpent = totalSpent / 7;
      savingsRate = Math.max(0, (dailyBudget - dailySpent) / dailyBudget * 100);
    }

    // Generate human-readable insight
    const insight = this.generateInsight(
      totalSpent,
      previousWeekSpent,
      percentageChange,
      topCategory,
      savingsRate,
    );

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      change: changeFormatted,
      topCategory,
      biggestExpense: biggestExpense ? Math.round(biggestExpense * 100) / 100 : null,
      savingsRate: Math.round(savingsRate),
      insight,
    };
  }

  private generateInsight(
    totalSpent: number,
    previousWeekSpent: number,
    percentageChange: number,
    topCategory: string | null,
    savingsRate: number,
  ): string {
    // Rule 1: Significant increase in spending
    if (percentageChange > 20) {
      return `You spent ${Math.abs(Math.round(percentageChange))}% more this week${topCategory ? `, mainly on ${topCategory.toLowerCase()}` : ''}. Consider cutting back! 🎯`;
    }

    // Rule 2: Significant decrease in spending
    if (percentageChange < -20) {
      return `Great job! You spent ${Math.abs(Math.round(percentageChange))}% less than last week. Keep it up! 💪`;
    }

    // Rule 3: High savings rate
    if (savingsRate > 50) {
      return `Excellent savings discipline this week! You're saving ${Math.round(savingsRate)}% of your daily budget. 🌟`;
    }

    // Rule 4: Low savings rate
    if (savingsRate < 10) {
      return `Your spending is tracking close to budget. Watch for big ${topCategory ? topCategory.toLowerCase() : 'expense'} purchases to avoid overspending. ⚠️`;
    }

    // Rule 5: Similar to last week
    if (Math.abs(percentageChange) <= 5) {
      return `Your spending is consistent with last week. You're on a predictable financial path. 📊`;
    }

    // Default: Moderate change
    const direction = percentageChange > 0 ? 'up' : 'down';
    return `Your spending is trending ${direction} by ${Math.abs(Math.round(percentageChange))}% compared to last week.`;
  }
}
