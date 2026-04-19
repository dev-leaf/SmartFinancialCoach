import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { BudgetsService } from '../budgets/budgets.service';
import { DeterministicEnricher } from './enrichers/deterministic.enricher';
import { OpenAIEnricher } from './enrichers/openai.enricher';

export interface AIInsight {
  id?: string;
  title: string;
  description: string;
  category: 'spending' | 'savings' | 'investment' | 'subscription' | 'goal' | 'warning';
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'info' | 'warning' | 'critical';
  savingsPotential?: number;
  actionable: boolean;
  actionTitle?: string;
  predictedOutcome?: string;
  timestamp?: Date;
}

@Injectable()
export class InsightsService {
  constructor(
    private prisma: PrismaService,
    private expensesService: ExpensesService,
    private budgetsService: BudgetsService,
    private deterministicEnricher: DeterministicEnricher,
    private openAIEnricher: OpenAIEnricher,
  ) {}

  async generateInsights(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });

    // Get expenses and budget data
    const allExpenses = await this.expensesService.findAll(userId);
    const currentMonthExpenses = await this.expensesService.getCurrentMonthExpenses(userId);
    const currentBudget = await this.budgetsService.getCurrentMonthBudgetAmount(userId);

    // Get investment data for diversification analysis
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    // 1. Spending trends and predictions
    const trendInsight = this.analyzeSpendingTrends(currentMonthExpenses, allExpenses);
    if (trendInsight) insights.push(trendInsight);

    // 2. Category-wise analysis
    const categoryInsights = this.analyzeCategoryPatterns(allExpenses, currentMonthExpenses);
    insights.push(...categoryInsights);

    // 3. Anomaly detection (unusual spending)
    const anomalyInsights = this.detectAnomalies(allExpenses, currentMonthExpenses);
    insights.push(...anomalyInsights);

    // 4. Subscription intelligence
    const subscriptionInsight = this.analyzeSubscriptions(allExpenses);
    if (subscriptionInsight) insights.push(subscriptionInsight);

    // 5. Budget health
    const budgetInsight = this.analyzeBudgetHealth(currentMonthExpenses, currentBudget);
    if (budgetInsight) insights.push(budgetInsight);

    // 6. Savings potential
    const savingsInsights = this.identifySavingsOpportunities(allExpenses, currentMonthExpenses);
    insights.push(...savingsInsights);

    // 7. Investment diversification
    const diversificationInsight = this.analyzeInvestmentDiversification(investments);
    if (diversificationInsight) insights.push(diversificationInsight);

    // 8. Income vs Spending Forecast
    const forecastInsight = this.generateForecast(allExpenses);
    if (forecastInsight) insights.push(forecastInsight);

    // Sort by severity and save top insights
    const sortedInsights = insights.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Save to database for historical tracking
    const enriched = await this.enrichInsights(sortedInsights, {
      userId,
      baseCurrency: user?.baseCurrency ?? 'INR',
      generatedAt: new Date().toISOString(),
    });

    await this.logTopInsights(userId, enriched);

    return enriched.slice(0, 8); // Return top 8 insights
  }

  private async enrichInsights(
    insights: AIInsight[],
    context: { userId: string; baseCurrency: string; generatedAt: string },
  ): Promise<AIInsight[]> {
    // Deterministic enricher is a no-op today, but keeps the boundary clean.
    const base = await this.deterministicEnricher.enrich(insights, context);
    return this.openAIEnricher.enrich(base, context);
  }

  private analyzeSpendingTrends(
    currentMonth: any[],
    allExpenses: any[],
  ): AIInsight | null {
    if (allExpenses.length < 30) return null;

    const currentSpend = currentMonth.reduce((sum, e) => sum + e.amount, 0);
    const last30 = this.getExpensesInDays(allExpenses, 30);
    const prev30 = this.getExpensesInDays(allExpenses, 60, 30);

    const last30Total = last30.reduce((sum, e) => sum + e.amount, 0);
    const prev30Total = prev30.reduce((sum, e) => sum + e.amount, 0);

    if (prev30Total === 0) return null;

    const percentChange = ((last30Total - prev30Total) / prev30Total) * 100;
    const dailyAverage = last30Total / 30;
    const daysRemainingInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    const projectedMonthly = currentSpend + (dailyAverage * daysRemainingInMonth);

    if (percentChange > 20) {
      return {
        title: '📈 Spending Accelerating',
        description: `You're spending ${Math.round(percentChange)}% more than last month. Projected: ₹${Math.round(projectedMonthly)} by month-end.`,
        category: 'spending',
        impact: 'negative',
        severity: percentChange > 40 ? 'critical' : 'warning',
        savingsPotential: projectedMonthly - prev30Total,
        actionable: true,
        predictedOutcome: `At current pace, you'll spend ₹${Math.round(projectedMonthly)} this month`,
        actionTitle: 'Review and adjust spending',
      };
    }

    if (percentChange < -15) {
      return {
        title: '✅ Excellent Savings Progress',
        description: `You've reduced spending by ${Math.round(-percentChange)}% compared to last month.`,
        category: 'savings',
        impact: 'positive',
        severity: 'info',
        actionable: false,
      };
    }

    return null;
  }

  private analyzeCategoryPatterns(allExpenses: any[], currentMonth: any[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const currentByCategory = this.groupByCategory(currentMonth);
    const last3MonthsByCategory = this.groupByCategory(allExpenses);

    Object.entries(currentByCategory).forEach(([category, currentAmount]) => {
      const last3MonthsAvg = (last3MonthsByCategory[category] || currentAmount) / 3;
      const spike = ((currentAmount as number) - last3MonthsAvg) / last3MonthsAvg * 100;

      if (spike > 40) {
        insights.push({
          title: `⚠️ High ${category} Spending`,
          description: `Your ${category} spending is ${Math.round(spike)}% above average (₹${Math.round(currentAmount as number)} vs ₹${Math.round(last3MonthsAvg)}).`,
          category: 'spending',
          impact: 'negative',
          severity: spike > 80 ? 'critical' : 'warning',
          savingsPotential: (currentAmount as number) - last3MonthsAvg,
          actionable: true,
          actionTitle: `Reduce ${category} spending`,
        });
      } else if (spike < -30) {
        insights.push({
          title: `💚 Great ${category} Control`,
          description: `You've cut ${category} spending by ${Math.round(-spike)}% this month.`,
          category: 'savings',
          impact: 'positive',
          severity: 'info',
          actionable: false,
        });
      }
    });

    return insights.slice(0, 3);
  }

  private detectAnomalies(allExpenses: any[], currentMonth: any[]): AIInsight[] {
    const insights: AIInsight[] = [];

    if (allExpenses.length < 20) return insights;

    // Calculate statistical anomalies (3 standard deviations)
    const amounts = allExpenses.map(e => e.amount);
    const mean = amounts.reduce((a, b) => a + b) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2)) / amounts.length);

    const anomalies = currentMonth.filter(exp => Math.abs((exp.amount - mean) / stdDev) > 2);

    if (anomalies.length > 0) {
      const totalAnomaly = anomalies.reduce((sum, e) => sum + e.amount, 0);
      insights.push({
        title: '🚨 Unusual Spending Detected',
        description: `Found ${anomalies.length} unusually large transaction(s) totaling ₹${Math.round(totalAnomaly)}.`,
        category: 'warning',
        impact: 'negative',
        severity: 'warning',
        actionable: true,
        actionTitle: 'Review transactions',
      });
    }

    return insights;
  }

  private analyzeSubscriptions(allExpenses: any[]): AIInsight | null {
    // Detect recurring charges using pattern matching
    const frequencyMap: Record<string, any[]> = {};

    allExpenses.forEach(exp => {
      const rounded = Math.round(exp.amount / 10) * 10; // Round to nearest 10
      if (!frequencyMap[rounded]) frequencyMap[rounded] = [];
      frequencyMap[rounded].push(exp);
    });

    let totalRecurring = 0;
    const recurringItems = [];

    Object.entries(frequencyMap).forEach(([amount, expenses]) => {
      if (expenses.length >= 2) {
        const dates = expenses.map(e => new Date(e.date).getTime()).sort((a, b) => a - b);
        const gaps = [];
        for (let i = 1; i < dates.length; i++) {
          gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)); // days
        }

        const avgGap = gaps.reduce((a, b) => a + b) / gaps.length;
        const gapStdDev = Math.sqrt(gaps.reduce((sq, n) => sq + Math.pow(n - avgGap, 2)) / gaps.length);

        // If consistently recurring (low variance)
        if (gapStdDev < avgGap * 0.3) {
          const monthlyRecurring = (Number(amount) / avgGap) * 30;
          totalRecurring += monthlyRecurring;
          recurringItems.push({ amount, frequency: this.frequencyLabel(avgGap) });
        }
      }
    });

    if (totalRecurring > 300) {
      return {
        title: '🔄 Subscription Expenses Found',
        description: `You have ₹${Math.round(totalRecurring)}/month in recurring subscriptions. Cancel unused ones to save.`,
        category: 'subscription',
        impact: 'negative',
        severity: totalRecurring > 2000 ? 'warning' : 'info',
        savingsPotential: totalRecurring * 0.2, // 20% cancellation potential
        actionable: true,
        actionTitle: 'Audit subscriptions',
      };
    }

    return null;
  }

  private analyzeBudgetHealth(currentMonth: any[], budgetAmount: number): AIInsight | null {
    if (budgetAmount === 0) return null;

    const spent = currentMonth.reduce((sum, e) => sum + e.amount, 0);
    const percentUsed = (spent / budgetAmount) * 100;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysElapsed = new Date().getDate();
    const dailyBudget = budgetAmount / daysInMonth;
    const expectedSpent = dailyBudget * daysElapsed;
    const isOnTrack = spent <= expectedSpent;

    if (!isOnTrack) {
      const overage = spent - expectedSpent;
      return {
        title: '⚠️ Budget Pace Alert',
        description: `You're ₹${Math.round(overage)} behind budget pace. At this rate, you'll exceed by ₹${Math.round((budgetAmount - spent) * -1)}.`,
        category: 'spending',
        impact: 'negative',
        severity: percentUsed > 100 ? 'critical' : 'warning',
        actionable: true,
        actionTitle: 'Slow spending to stay on budget',
      };
    }

    if (percentUsed < 50 && daysElapsed > daysInMonth * 0.6) {
      return {
        title: '💰 On Track for Savings',
        description: `You've only used ${Math.round(percentUsed)}% of your budget with ${daysInMonth - daysElapsed} days left.`,
        category: 'savings',
        impact: 'positive',
        severity: 'info',
        actionable: false,
      };
    }

    return null;
  }

  private identifySavingsOpportunities(allExpenses: any[], currentMonth: any[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const byCategory = this.groupByCategory(allExpenses);

    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 4);

    topCategories.forEach(([category, total]) => {
      const monthlyAvg = (total as number) / 3;
      const savingsPotential = monthlyAvg * 0.15; // 15% reduction goal

      // Only show if over ₹1000/month
      if (monthlyAvg > 1000) {
        insights.push({
          title: `💡 Save ${Math.round(savingsPotential)} on ${category}`,
          description: `Reducing ${category} by just 15% could save ₹${Math.round(savingsPotential)}/month (₹${Math.round(savingsPotential * 12)}/year).`,
          category: 'savings',
          impact: 'positive',
          severity: 'info',
          savingsPotential,
          actionable: true,
          actionTitle: `Optimize ${category}`,
        });
      }
    });

    return insights.slice(0, 2);
  }

  private analyzeInvestmentDiversification(investments: any[]): AIInsight | null {
    if (investments.length < 2) return null;

    const byType: Record<string, number> = {};
    let total = 0;

    investments.forEach(inv => {
      byType[inv.type] = (byType[inv.type] || 0) + inv.totalCurrentValue;
      total += inv.totalCurrentValue;
    });

    // Check for concentration risk
    const concentrations = Object.entries(byType).map(([type, value]) => ({
      type,
      percentage: (value / total) * 100,
    }));

    const maxConcentration = Math.max(...concentrations.map(c => c.percentage));

    if (maxConcentration > 70) {
      return {
        title: '⚠️ Concentration Risk in Portfolio',
        description: `${Math.round(maxConcentration)}% of your portfolio is in one type. Diversify to reduce risk.`,
        category: 'investment',
        impact: 'negative',
        severity: 'warning',
        actionable: true,
        actionTitle: 'Diversify investments',
      };
    }

    if (investments.length > 3 && maxConcentration < 50) {
      return {
        title: '✅ Well-Diversified Portfolio',
        description: `Your portfolio spans ${investments.length} assets with balanced distribution.`,
        category: 'investment',
        impact: 'positive',
        severity: 'info',
        actionable: false,
      };
    }

    return null;
  }

  private generateForecast(allExpenses: any[]): AIInsight | null {
    if (allExpenses.length < 60) return null; // Need 2 months of data

    const last30 = this.getExpensesInDays(allExpenses, 30);
    const prev30 = this.getExpensesInDays(allExpenses, 60, 30);

    const last30Total = last30.reduce((sum, e) => sum + e.amount, 0);
    const prev30Total = prev30.reduce((sum, e) => sum + e.amount, 0);
    const monthlyGrowth = prev30Total > 0 ? ((last30Total - prev30Total) / prev30Total) * 100 : 0;

    // Project 3 months ahead
    let projected = last30Total;
    for (let i = 0; i < 3; i++) {
      projected = projected * (1 + monthlyGrowth / 100);
    }

    if (monthlyGrowth > 5) {
      return {
        title: '📊 Spending Forecast',
        description: `If spending continues growing ${Math.round(monthlyGrowth)}%/month, you'll spend ₹${Math.round(projected)}/month in 3 months.`,
        category: 'goal',
        impact: 'neutral',
        severity: 'info',
        predictedOutcome: `Projected monthly spending: ₹${Math.round(projected)}`,
        actionable: true,
        actionTitle: 'Review spending trends',
      };
    }

    return null;
  }

  private getExpensesInDays(expenses: any[], days: number, offset: number = 0): any[] {
    const now = Date.now();
    return expenses.filter(e => {
      const expDate = new Date(e.date).getTime();
      const daysDiff = (now - expDate) / (1000 * 60 * 60 * 24);
      return daysDiff >= offset && daysDiff < offset + days;
    });
  }

  private frequencyLabel(dayGap: number): string {
    if (dayGap < 2) return 'Daily';
    if (dayGap < 8) return 'Weekly';
    if (dayGap < 35) return 'Monthly';
    return 'Yearly';
  }

  private groupByCategory(expenses: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    expenses.forEach(exp => {
      grouped[exp.category] = (grouped[exp.category] || 0) + exp.amount;
    });
    return grouped;
  }

  private async logTopInsights(userId: string, insights: AIInsight[]): Promise<void> {
    for (const insight of insights.slice(0, 5)) {
      try {
        await this.prisma.insightLog.create({
          data: {
            userId,
            insight: JSON.stringify(insight),
            category: insight.category,
          },
        });
      } catch (error) {
        // Silently fail to not block insights generation
        console.error('Failed to log insight:', error);
      }
    }
  }
}
