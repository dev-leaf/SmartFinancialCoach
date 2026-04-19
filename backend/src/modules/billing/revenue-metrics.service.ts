import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const PRICE_INR: Record<string, number> = {
  free: 0,
  premium: 99,
  pro: 299,
};

@Injectable()
export class RevenueMetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(rangeDays: number = 30) {
    const now = new Date();
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

    const subs = await this.prisma.userSubscription.findMany();

    const active = subs.filter((s) => {
      if (!s.isActive) return false;
      if (!s.expiresAt) return true;
      return s.expiresAt > now;
    });

    const activeByTier = active.reduce<Record<string, number>>((acc, s) => {
      const t = s.tier ?? 'free';
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});

    const mrrInr = active.reduce((sum, s) => sum + (PRICE_INR[s.tier ?? 'free'] ?? 0), 0);

    // Churn proxy: cancellations in last N days / active users at start of window (approx)
    const cancels = await this.prisma.subscriptionEvent.count({
      where: { eventType: 'cancel', createdAt: { gte: since } },
    });

    const activeAtStart = await this.prisma.subscriptionEvent.count({
      where: { eventType: 'upgrade', createdAt: { lt: since } },
    });
    const churnRate = activeAtStart > 0 ? cancels / activeAtStart : 0;

    return {
      rangeDays,
      activeSubscriptions: active.length,
      activeByTier,
      mrrInr,
      churnRate: Math.round(churnRate * 10000) / 10000,
    };
  }
}

