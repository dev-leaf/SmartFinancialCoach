import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { BudgetsService } from '../budgets/budgets.service';

export interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
}

export interface HealthScore {
  overallScore: number; // 0-100
  trend?: 'improving' | 'declining' | 'stable';
  incomeMissing?: boolean;
  pillars?: {
    savingsRate: ScoreComponent;
    spendingDiscipline: ScoreComponent;
    diversification: ScoreComponent;
  };
  scoreBreakdown: {
    budgetHealth: ScoreComponent;
    savingsRate: ScoreComponent;
    investmentScore: ScoreComponent;
    diversificationScore: ScoreComponent;
    consistencyScore: ScoreComponent;
    debtHealth: ScoreComponent;
  };
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  recommendations: string[];
  improvements: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    potentialImpact: number; // 0-20 points
  }[];
}

@Injectable()
export class HealthScoreService {
  constructor(
    private prisma: PrismaService,
    private expensesService: ExpensesService,
    private budgetsService: BudgetsService,
  ) {}

  async calculateScore(userId: string): Promise<HealthScore> {
    const incomeProfile = await this.prisma.incomeProfile.findUnique({
      where: { userId },
      select: { monthlyIncome: true, currency: true },
    });

    // Get spending data
    const monthlySpending = await this.expensesService.getCurrentMonthTotal(userId);
    const lastMonthSpending = await this.getLastMonthTotal(userId);
    const monthlyBudget = await this.budgetsService.getCurrentMonthBudgetAmount(userId);

    // Get all expenses for detailed analysis
    const allExpenses = await this.expensesService.findAll(userId);

    // Get investment data
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      select: {
        totalBuyValue: true,
        totalCurrentValue: true,
        type: true,
      },
    });

    // Calculate individual score components
    const budgetHealth = this.calculateBudgetHealth(monthlySpending, monthlyBudget, lastMonthSpending);
    const savingsRate = this.calculateSavingsRate(monthlySpending, incomeProfile?.monthlyIncome ?? null);
    const investmentScore = this.calculateInvestmentScore(investments);
    const diversificationScore = this.calculateDiversificationScore(investments);
    const consistencyScore = this.calculateConsistencyScore(allExpenses);
    const debtHealth = this.calculateDebtHealth(monthlySpending, monthlyBudget);

    // ── Your 3 required pillars ────────────────────────────────────────────
    const spendingDiscipline = this.combineSpendingDiscipline(budgetHealth, consistencyScore);
    const diversification = this.combineDiversification(diversificationScore, investmentScore);

    const pillarWeights = {
      savingsRate: 0.4,
      spendingDiscipline: 0.35,
      diversification: 0.25,
    };

    // If income is missing, we can’t compute savings rate; penalize and surface a clear improvement.
    const incomeMissing = !incomeProfile?.monthlyIncome;
    const savingsScoreForOverall = incomeMissing ? 25 : savingsRate.score;

    const overallScore = Math.round(
      savingsScoreForOverall * pillarWeights.savingsRate +
        spendingDiscipline.score * pillarWeights.spendingDiscipline +
        diversification.score * pillarWeights.diversification,
    );

    const grade = this.getGrade(overallScore);
    const trend = this.calculateTrend(overallScore, lastMonthSpending);

    const components = [budgetHealth, savingsRate, investmentScore, diversificationScore, consistencyScore, debtHealth];
    const recommendations = this.generateRecommendations(components, monthlySpending, monthlyBudget, investments);

    const improvements = this.generateImprovements(components, monthlySpending, investments);

    if (incomeMissing) {
      improvements.unshift({
        priority: 'high',
        action: 'Add your monthly income to unlock accurate savings rate scoring',
        potentialImpact: 20,
      });
    }

    return {
      overallScore,
      trend,
      incomeMissing,
      pillars: {
        savingsRate: incomeMissing
          ? { ...savingsRate, score: savingsScoreForOverall }
          : savingsRate,
        spendingDiscipline,
        diversification,
      },
      scoreBreakdown: {
        budgetHealth,
        savingsRate,
        investmentScore,
        diversificationScore,
        consistencyScore,
        debtHealth,
      },
      grade,
      recommendations,
      improvements,
    };
  }

  private async getLastMonthTotal(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const lastMonth = await this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    return lastMonth.reduce((sum, e) => sum + e.amount, 0);
  }

  private calculateBudgetHealth(
    current: number,
    budget: number,
    lastMonth: number,
  ): ScoreComponent {
    if (budget === 0) return { name: 'Budget Health', score: 50, weight: 0.25, trend: 'stable' };

    const ratio = current / budget;
    let score = 0;

    if (ratio <= 0.5) score = 100;
    else if (ratio <= 0.7) score = 90;
    else if (ratio <= 0.85) score = 80;
    else if (ratio <= 1.0) score = 60;
    else if (ratio <= 1.2) score = 30;
    else score = 10;

    const trend = lastMonth === 0 ? 'stable' : current < lastMonth ? 'down' : current > lastMonth ? 'up' : 'stable';
    const trendPercent = lastMonth === 0 ? 0 : ((current - lastMonth) / lastMonth) * 100;

    return {
      name: 'Budget Health',
      score: Math.round(score),
      weight: 0.25,
      trend,
      trendPercent: Math.round(trendPercent),
    };
  }

  private calculateSavingsRate(spending: number, monthlyIncome: number | null): ScoreComponent {
    if (!monthlyIncome || monthlyIncome <= 0) {
      return {
        name: 'Savings Rate',
        score: 25,
        weight: 0.25,
        trend: 'stable',
      };
    }

    const savings = Math.max(0, monthlyIncome - spending);
    const savingsRate = (savings / monthlyIncome) * 100;

    let score = 0;
    if (savingsRate >= 40) score = 100;
    else if (savingsRate >= 30) score = 90;
    else if (savingsRate >= 20) score = 80;
    else if (savingsRate >= 10) score = 60;
    else score = Math.max(30, savingsRate * 3);

    return {
      name: 'Savings Rate',
      score: Math.round(score),
      weight: 0.25,
      trend: 'stable',
    };
  }

  private calculateInvestmentScore(investments: any[]): ScoreComponent {
    if (investments.length === 0) {
      return {
        name: 'Investment Score',
        score: 30,
        weight: 0.15,
        trend: 'stable',
        trendPercent: 0,
      };
    }

    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalBuyValue, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.totalCurrentValue, 0);
    const gainLoss = totalValue - totalInvested;
    const gainLossPercent = (gainLoss / totalInvested) * 100;

    let score = 60;
    if (gainLossPercent >= 15) score = 95;
    else if (gainLossPercent >= 10) score = 85;
    else if (gainLossPercent >= 5) score = 75;
    else if (gainLossPercent >= 0) score = 70;
    else if (gainLossPercent >= -10) score = 60;
    else if (gainLossPercent >= -20) score = 40;
    else score = 20;

    const trend = gainLossPercent > 0 ? 'up' : gainLossPercent < 0 ? 'down' : 'stable';

    return {
      name: 'Investment Score',
      score: Math.round(score),
      weight: 0.15,
      trend,
      trendPercent: Math.round(gainLossPercent),
    };
  }

  private calculateDiversificationScore(investments: any[]): ScoreComponent {
    if (investments.length < 2) {
      return {
        name: 'Diversification',
        score: 20,
        weight: 0.1,
        trend: 'stable',
      };
    }

    const byType: Record<string, number> = {};
    let total = 0;

    investments.forEach(inv => {
      byType[inv.type] = (byType[inv.type] || 0) + inv.totalCurrentValue;
      total += inv.totalCurrentValue;
    });

    const maxConcentration = Math.max(...Object.values(byType).map(v => (v / total) * 100));
    const typeCount = Object.keys(byType).length;

    let score = 0;
    if (typeCount >= 4 && maxConcentration <= 40) score = 95;
    else if (typeCount >= 3 && maxConcentration <= 50) score = 80;
    else if (typeCount === 2 && maxConcentration <= 60) score = 70;
    else if (maxConcentration <= 70) score = 50;
    else score = 30;

    return {
      name: 'Diversification',
      score: Math.round(score),
      weight: 0.1,
      trend: 'stable',
    };
  }

  private calculateConsistencyScore(expenses: any[]): ScoreComponent {
    if (expenses.length < 7) {
      return { name: 'Spending Consistency', score: 50, weight: 0.1, trend: 'stable' };
    }

    const dailyExpenses = this.groupExpensesByDay(expenses);
    const amounts = Object.values(dailyExpenses) as number[];
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coeffVar = stdDev / (avg || 1);

    let score = 0;
    if (coeffVar < 0.2) score = 95;
    else if (coeffVar < 0.35) score = 85;
    else if (coeffVar < 0.6) score = 70;
    else if (coeffVar < 1.0) score = 50;
    else if (coeffVar < 1.5) score = 30;
    else score = 15;

    return {
      name: 'Spending Consistency',
      score: Math.round(score),
      weight: 0.1,
      trend: 'stable',
    };
  }

  private calculateDebtHealth(spending: number, budget: number): ScoreComponent {
    // In Indian context, assess emergency fund needs
    const sixMonthsExpenses = spending * 6;
    const score = budget > spending ? 90 : spending <= budget * 1.2 ? 70 : 50;

    return {
      name: 'Debt & Emergency',
      score: Math.round(score),
      weight: 0.05,
      trend: 'stable',
    };
  }

  private calculateTrend(currentScore: number, lastMonthSpending: number): 'improving' | 'declining' | 'stable' {
    // Simplified: if spending decreased, trend is improving
    if (lastMonthSpending > 0 && lastMonthSpending > currentScore * 20) {
      return 'improving';
    }
    if (lastMonthSpending > 0 && lastMonthSpending < currentScore * 15) {
      return 'declining';
    }
    return 'stable';
  }

  private groupExpensesByDay(expenses: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    expenses.forEach(exp => {
      const date = new Date(exp.date).toDateString();
      groups[date] = (groups[date] || 0) + exp.amount;
    });
    return groups;
  }

  private getGrade(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  private combineSpendingDiscipline(budgetHealth: ScoreComponent, consistency: ScoreComponent): ScoreComponent {
    const score = Math.round(budgetHealth.score * 0.7 + consistency.score * 0.3);
    return {
      name: 'Spending Discipline',
      score,
      weight: 0,
      trend: budgetHealth.trend ?? 'stable',
      trendPercent: budgetHealth.trendPercent,
    };
  }

  private combineDiversification(diversificationScore: ScoreComponent, investmentScore: ScoreComponent): ScoreComponent {
    // Diversification is primarily about concentration/type spread; investmentScore is a secondary proxy
    const score = Math.round(diversificationScore.score * 0.75 + investmentScore.score * 0.25);
    return {
      name: 'Diversification',
      score,
      weight: 0,
      trend: diversificationScore.trend ?? 'stable',
    };
  }

  private generateRecommendations(
    components: ScoreComponent[],
    spending: number,
    budget: number,
    investments: any[],
  ): string[] {
    const recommendations: string[] = [];

    // Budget recommendations
    if (components[0].score < 60 && budget > 0) {
      recommendations.push(
        `📊 You're spending ${Math.round((spending / budget) * 100)}% of your budget. Try to reduce to 75-80% for better health.`
      );
    }

    // Savings recommendations
    if (components[1].score < 70) {
      recommendations.push(
        '💰 Increase your savings rate to at least 20% of income for financial security.'
      );
    }

    // Investment recommendations
    if (components[2].score < 50) {
      recommendations.push(
        '📈 Your investments need attention. Consider rebalancing or adding more diverse assets.'
      );
    }

    // Diversification recommendations
    if (components[3].score < 60) {
      recommendations.push(
        '🎯 Diversify your portfolio across more asset types to reduce risk.'
      );
    }

    // Consistency recommendations
    if (components[4].score < 50) {
      recommendations.push(
        '📅 Your spending patterns are erratic. Aim for more consistent daily spending.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✨ Excellent! Your financial health is on track. Keep it up!');
    }

    return recommendations.slice(0, 4);
  }

  private generateImprovements(
    components: ScoreComponent[],
    spending: number,
    investments: any[],
  ): HealthScore['improvements'] {
    const improvements: HealthScore['improvements'] = [];

    // Find the lowest scoring component
    const sorted = [...components].sort((a, b) => a.score - b.score);

    if (sorted[0].score < 70) {
      improvements.push({
        priority: 'high',
        action: `Improve ${sorted[0].name.toLowerCase()} from ${sorted[0].score}/100`,
        potentialImpact: Math.min(20, 100 - sorted[0].score),
      });
    }

    if (sorted[1].score < 70) {
      improvements.push({
        priority: 'medium',
        action: `Work on ${sorted[1].name.toLowerCase()} (currently ${sorted[1].score}/100)`,
        potentialImpact: Math.min(15, 100 - sorted[1].score),
      });
    }

    if (spending > 100000 && investments.length < 2) {
      improvements.push({
        priority: 'high',
        action: 'Start investing for wealth creation',
        potentialImpact: 15,
      });
    }

    return improvements.slice(0, 3);
  }
}
