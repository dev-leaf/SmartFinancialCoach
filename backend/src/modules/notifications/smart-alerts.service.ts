import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { BudgetsService } from '../budgets/budgets.service';
import { NotificationsService } from './notifications.service';

export interface SmartAlertPayload {
  userId: string;
  alertType: 'budget_threshold' | 'unusual_spending' | 'subscription_reminder' | 'health_score';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  actionUrl?: string;
}

export interface SmartAlertResponse {
  id: string;
  alertType: string;
  title: string;
  message: string;
  severity: string;
  dismissed: boolean;
  createdAt: Date;
  actionUrl?: string;
}

@Injectable()
export class SmartAlertsService {
  constructor(
    private prisma: PrismaService,
    private expensesService: ExpensesService,
    private budgetsService: BudgetsService,
    private notificationsService: NotificationsService,
  ) {}

  async generateAlertsForUser(userId: string): Promise<SmartAlertResponse[]> {
    const alerts: SmartAlertResponse[] = [];

    const budgetAlert = await this.checkBudgetThreshold(userId);
    if (budgetAlert) alerts.push(budgetAlert);

    const anomalyAlert = await this.detectUnusualSpending(userId);
    if (anomalyAlert) alerts.push(anomalyAlert);

    const subAlert = await this.checkSubscriptionReminders(userId);
    if (subAlert) alerts.push(subAlert);

    return alerts;
  }

  private async checkBudgetThreshold(userId: string): Promise<SmartAlertResponse | null> {
    try {
      const config = await this.prisma.alertConfiguration.findUnique({ where: { userId } });
      const threshold = config?.budgetThresholdPercent || 80;

      const currentSpent = await this.expensesService.getCurrentMonthTotal(userId);
      const monthlyBudget = await this.budgetsService.getCurrentMonthBudgetAmount(userId);

      if (monthlyBudget === 0) return null;

      const percentUsed = (currentSpent / monthlyBudget) * 100;

      const existingAlert = await this.prisma.smartAlert.findFirst({
        where: {
          userId,
          alertType: 'budget_threshold',
          dismissed: false,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingAlert) return this.mapToResponse(existingAlert);

      if (percentUsed >= threshold) {
        const severity = percentUsed >= 100 ? 'critical' : 'warning';
        const message = percentUsed >= 100
          ? `You've exceeded your budget by ₹${Math.round(currentSpent - monthlyBudget)}!`
          : `You've used ${Math.round(percentUsed)}% of your monthly budget (${Math.round(monthlyBudget - currentSpent)} remaining).`;

        return await this.createAlert({
          userId,
          alertType: 'budget_threshold',
          title: percentUsed >= 100 ? '🚨 Budget Exceeded' : '⚠️ Budget Alert',
          message,
          severity,
          actionUrl: '/budgets',
        });
      }

      return null;
    } catch (error) {
      console.error('Error checking budget threshold:', error);
      return null;
    }
  }

  private async detectUnusualSpending(userId: string): Promise<SmartAlertResponse | null> {
    try {
      const config = await this.prisma.alertConfiguration.findUnique({ where: { userId } });
      if (!config?.unusualSpendingEnabled) return null;

      const allExpenses = await this.expensesService.findAll(userId);
      if (allExpenses.length < 20) return null;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

      const todayTotal = allExpenses
        .filter(e => {
          const t = new Date(e.date).getTime();
          return t >= todayStart.getTime() && t < tomorrowStart.getTime();
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const baselineStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
      const baselineExpenses = allExpenses.filter(e => {
        const t = new Date(e.date).getTime();
        return t >= baselineStart.getTime() && t < todayStart.getTime();
      });

      const dailyMap = new Map<string, number>();
      baselineExpenses.forEach(exp => {
        const d = new Date(exp.date);
        const key = d.toDateString();
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + exp.amount);
      });

      const dailyTotals = Array.from(dailyMap.values());
      if (dailyTotals.length < 10) return null;

      const mean = dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length;
      const variance = dailyTotals.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / dailyTotals.length;
      const stdDev = Math.sqrt(variance);

      if (todayTotal > mean + 2.5 * stdDev) {
        const existingAlert = await this.prisma.smartAlert.findFirst({
          where: {
            userId,
            alertType: 'unusual_spending',
            dismissed: false,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (existingAlert) return this.mapToResponse(existingAlert);

        return await this.createAlert({
          userId,
          alertType: 'unusual_spending',
          title: '🚨 Unusual Spending Alert',
          message: `You've spent ₹${Math.round(todayTotal)} today, significantly higher than usual (avg: ₹${Math.round(mean)}).`,
          severity: 'warning',
          actionUrl: '/expenses',
        });
      }

      return null;
    } catch (error) {
      console.error('Error detecting unusual spending:', error);
      return null;
    }
  }

  private async checkSubscriptionReminders(userId: string): Promise<SmartAlertResponse | null> {
    try {
      const config = await this.prisma.alertConfiguration.findUnique({ where: { userId } });
      if (!config?.subscriptionRemindersEnabled) return null;

      const allExpenses = await this.expensesService.findAll(userId);
      if (allExpenses.length < 30) return null;

      const frequencyMap: Record<string, any[]> = {};
      const last30Days = allExpenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      });

      last30Days.forEach(exp => {
        const rounded = Math.round(exp.amount / 10) * 10;
        if (!frequencyMap[rounded]) frequencyMap[rounded] = [];
        frequencyMap[rounded].push(exp);
      });

      let totalRecurring = 0;

      for (const [amount, expenses] of Object.entries(frequencyMap)) {
        if (expenses.length >= 2) {
          const dates = expenses.map(e => new Date(e.date).getTime()).sort((a, b) => a - b);
          const gaps = [];
          for (let i = 1; i < dates.length; i++) {
            gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
          }

          if (gaps.length > 0) {
            const avgGap = gaps.reduce((a, b) => a + b) / gaps.length;
            const gapStdDev = Math.sqrt(gaps.reduce((sq, n) => sq + Math.pow(n - avgGap, 2)) / gaps.length);

            if (gapStdDev < avgGap * 0.3) {
              const monthlyRecurring = (Number(amount) / avgGap) * 30;
              totalRecurring += monthlyRecurring;
            }
          }
        }
      }

      const existingAlert = await this.prisma.smartAlert.findFirst({
        where: {
          userId,
          alertType: 'subscription_reminder',
          dismissed: false,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      });

      if (existingAlert || totalRecurring === 0) {
        return existingAlert ? this.mapToResponse(existingAlert) : null;
      }

      if (totalRecurring > 300) {
        return await this.createAlert({
          userId,
          alertType: 'subscription_reminder',
          title: '🔄 Review Your Subscriptions',
          message: `You have ₹${Math.round(totalRecurring)}/month in recurring charges. Cancel unused subscriptions to save.`,
          severity: 'info',
          actionUrl: '/subscriptions',
        });
      }

      return null;
    } catch (error) {
      console.error('Error checking subscriptions:', error);
      return null;
    }
  }

  async createAlert(payload: SmartAlertPayload): Promise<SmartAlertResponse> {
    const alert = await this.prisma.smartAlert.create({
      data: {
        userId: payload.userId,
        alertType: payload.alertType,
        title: payload.title,
        message: payload.message,
        severity: payload.severity,
        actionUrl: payload.actionUrl,
        dismissed: false,
      },
    });

    try {
      await this.notificationsService.create({
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.alertType as any,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return this.mapToResponse(alert);
  }

  async getActiveAlerts(userId: string): Promise<SmartAlertResponse[]> {
    const alerts = await this.prisma.smartAlert.findMany({
      where: { userId, dismissed: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return alerts.map(alert => this.mapToResponse(alert));
  }

  async getAllAlerts(userId: string, limit: number = 50): Promise<SmartAlertResponse[]> {
    const alerts = await this.prisma.smartAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts.map(alert => this.mapToResponse(alert));
  }

  async dismissAlert(alertId: string): Promise<SmartAlertResponse> {
    const alert = await this.prisma.smartAlert.update({
      where: { id: alertId },
      data: { dismissed: true },
    });

    return this.mapToResponse(alert);
  }

  async getAlertConfiguration(userId: string) {
    let config = await this.prisma.alertConfiguration.findUnique({ where: { userId } });

    if (!config) {
      config = await this.prisma.alertConfiguration.create({
        data: {
          userId,
          budgetThresholdPercent: 80,
          unusualSpendingEnabled: true,
          subscriptionRemindersEnabled: true,
          dailyDigestEnabled: false,
        },
      });
    }

    return config;
  }

  async updateAlertConfiguration(userId: string, updates: any) {
    return this.prisma.alertConfiguration.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates },
    });
  }

  private mapToResponse(alert: any): SmartAlertResponse {
    return {
      id: alert.id,
      alertType: alert.alertType,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      dismissed: alert.dismissed,
      createdAt: alert.createdAt,
      actionUrl: alert.actionUrl,
    };
  }
}
