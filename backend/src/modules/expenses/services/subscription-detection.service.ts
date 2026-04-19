import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface RecurringExpense {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface SubscriptionInsight {
  totalMonthlySpend: number;
  subscriptions: RecurringExpense[];
  savingOpportunities: Array<{
    name: string;
    amount: number;
    reason: string;
  }>;
}

@Injectable()
export class SubscriptionDetectionService {
  private readonly logger = new Logger(SubscriptionDetectionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Detect recurring expenses from transaction history
   * Looks for:
   * - Same amount multiple times in intervals (weekly, monthly, yearly)
   * - Same merchant/category with patterns
   */
  async detectSubscriptions(userId: string): Promise<SubscriptionInsight> {
    const expenses = await this.prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 180, // Last 6 months
    });

    if (expenses.length < 3) {
      return {
        totalMonthlySpend: 0,
        subscriptions: [],
        savingOpportunities: [],
      };
    }

    // Group by amount to find recurring charges
    const amountGroups: { [key: number]: any[] } = {};
    expenses.forEach(expense => {
      const roundedAmount = Math.round((expense.amount as number) * 100) / 100;
      if (!amountGroups[roundedAmount]) {
        amountGroups[roundedAmount] = [];
      }
      amountGroups[roundedAmount].push(expense);
    });

    const detectedRecurring: RecurringExpense[] = [];

    // Analyze each amount group for patterns
    for (const [amount, expensesWithSameAmount] of Object.entries(amountGroups)) {
      if (expensesWithSameAmount.length < 2) continue; // Need at least 2 occurrences

      const frequency = this.detectFrequency(
        expensesWithSameAmount.map(e => e.date as Date)
      );

      if (frequency) {
        // Found a recurring pattern
        const mostCommonCategory = this.getMostCommonCategory(
          expensesWithSameAmount.map(e => e.category)
        );

        detectedRecurring.push({
          id: crypto.randomUUID(), // Temporary ID
          userId,
          name: `${mostCommonCategory} Subscription`,
          category: mostCommonCategory,
          amount: parseFloat(amount),
          currency: expensesWithSameAmount[0].currency,
          frequency,
          nextDueDate: this.calculateNextDueDate(
            expensesWithSameAmount[0].date as Date,
            frequency
          ),
          isActive: true,
          createdAt: new Date(),
        });
      }
    }

    // Calculate monthly spending and savings opportunities
    const totalMonthlySpend = detectedRecurring
      .filter(s => this.frequencyToMonths(s.frequency) <= 1)
      .reduce((sum, s) => sum + s.amount * this.frequencyMultiplier(s.frequency), 0);

    // Identify saving opportunities (subscriptions over ₹500/month)
    const savingOpportunities = detectedRecurring
      .map(s => ({
        name: s.name,
        amount: s.amount * this.frequencyMultiplier(s.frequency),
        reason: `Recurring ${s.frequency} charge of ₹${s.amount}`,
      }))
      .filter(s => s.amount >= 500)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalMonthlySpend,
      subscriptions: detectedRecurring.sort((a, b) => b.amount - a.amount),
      savingOpportunities,
    };
  }

  /**
   * Detect frequency of recurring charges
   */
  private detectFrequency(
    dates: Date[]
  ): 'daily' | 'weekly' | 'monthly' | 'yearly' | null {
    if (dates.length < 2) return null;

    const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime());
    const intervals: number[] = [];

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diff = Math.abs(
        sortedDates[i].getTime() - sortedDates[i + 1].getTime()
      );
      intervals.push(diff / (1000 * 60 * 60 * 24)); // Days
    }

    // Calculate average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, x) => sum + Math.pow(x - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // If std dev is low relative to mean, it's a consistent pattern
    if (stdDev < avgInterval * 0.3) {
      // Consistent pattern
      if (avgInterval <= 1.5) return 'daily';
      if (avgInterval <= 9) return 'weekly';
      if (avgInterval <= 35) return 'monthly';
      if (avgInterval <= 400) return 'yearly';
    }

    return null;
  }

  /**
   * Calculate next due date
   */
  private calculateNextDueDate(lastDate: Date, frequency: string): Date {
    const next = new Date(lastDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  /**
   * Get most common category
   */
  private getMostCommonCategory(categories: string[]): string {
    if (categories.length === 0) return 'Other';

    const counts: { [key: string]: number } = {};
    categories.forEach(cat => {
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }

  /**
   * Convert frequency to months
   */
  private frequencyToMonths(frequency: string): number {
    switch (frequency) {
      case 'daily':
        return 1 / 30;
      case 'weekly':
        return 1 / 4;
      case 'monthly':
        return 1;
      case 'yearly':
        return 12;
      default:
        return 1;
    }
  }

  /**
   * Get monthly multiplier for frequency
   */
  private frequencyMultiplier(frequency: string): number {
    switch (frequency) {
      case 'daily':
        return 30;
      case 'weekly':
        return 4;
      case 'monthly':
        return 1;
      case 'yearly':
        return 1 / 12;
      default:
        return 1;
    }
  }
}
