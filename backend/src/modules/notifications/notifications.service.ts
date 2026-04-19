import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'budget' | 'investment' | 'health_score' | 'subscription';
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(payload: NotificationPayload): Promise<any> {
    return this.prisma.notification.create({
      data: payload,
    });
  }

  async getUnread(userId: string): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getAll(userId: string): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string): Promise<any> {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async delete(notificationId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Helper methods for notifications
  async notifyBudgetExceeded(userId: string, percentage: number): Promise<any> {
    return this.create({
      userId,
      title: '⚠️ Budget Alert',
      message: `You've exceeded your budget by ${Math.round(percentage - 100)}%`,
      type: 'budget',
    });
  }

  async notifyInvestmentAlert(userId: string, assetName: string, change: number): Promise<any> {
    return this.create({
      userId,
      title: `📈 ${assetName} Alert`,
      message: `Your investment changed by ${change.toFixed(2)}%`,
      type: 'investment',
    });
  }

  async notifySubscriptionFound(userId: string, monthlyTotal: number): Promise<any> {
    return this.create({
      userId,
      title: '🔄 Subscriptions Found',
      message: `You have ₹${Math.round(monthlyTotal)} in monthly subscriptions`,
      type: 'subscription',
    });
  }

  async notifyHealthScoreUpdate(userId: string, score: number, grade: string): Promise<any> {
    return this.create({
      userId,
      title: `💪 Health Score: ${grade}`,
      message: `Your financial health score is ${score}/100`,
      type: 'health_score',
    });
  }
}
