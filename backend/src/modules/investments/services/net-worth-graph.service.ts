import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface NetWorthDataPoint {
  date: string;
  total: number;
  walletTotal: number;
  investmentTotal: number;
  breakdown: {
    category: string;
    value: number;
    percentage: number;
  }[];
}

export interface NetWorthGraph {
  currentTotal: number;
  period: 'daily' | 'weekly' | 'monthly';
  days: number;
  dataPoints: NetWorthDataPoint[];
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentChange: number;
    absoluteChange: number;
  };
  summary: {
    highest: number;
    lowest: number;
    average: number;
    volatility: number; // Standard deviation
  };
}

@Injectable()
export class NetWorthGraphService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record daily net worth snapshot (should be called daily via cron)
   */
  async recordDailySnapshot(userId: string, total: number, walletTotal: number, investmentTotal: number): Promise<void> {
    // Check if snapshot exists for today
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const existingSnapshot = await this.prisma.netWorthSnapshot.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!existingSnapshot) {
      await this.prisma.netWorthSnapshot.create({
        data: {
          userId,
          total,
          walletTotal,
          investmentTotal,
        },
      });
    }
  }

  /**
   * Get net worth graph data for the last N days
   */
  async getNetWorthGraph(userId: string, days: number = 30): Promise<NetWorthGraph> {
    const snapshots = await this.prisma.netWorthSnapshot.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (snapshots.length === 0) {
      return this.getEmptyGraph();
    }

    const dataPoints = snapshots.map(snap => ({
      date: new Date(snap.createdAt).toISOString().split('T')[0],
      total: snap.total,
      walletTotal: snap.walletTotal,
      investmentTotal: snap.investmentTotal,
      breakdown: [
        {
          category: 'Wallets',
          value: snap.walletTotal,
          percentage: snap.total > 0 ? (snap.walletTotal / snap.total) * 100 : 0,
        },
        {
          category: 'Investments',
          value: snap.investmentTotal,
          percentage: snap.total > 0 ? (snap.investmentTotal / snap.total) * 100 : 0,
        },
      ],
    }));

    // Calculate trends
    const currentSnapshot = snapshots[snapshots.length - 1];
    const previousSnapshot = snapshots[0];

    const absoluteChange = currentSnapshot.total - previousSnapshot.total;
    const percentChange = (absoluteChange / previousSnapshot.total) * 100;
    const direction = absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'stable';

    // Calculate summary statistics
    const totals = snapshots.map(s => s.total);
    const highest = Math.max(...totals);
    const lowest = Math.min(...totals);
    const average = totals.reduce((a, b) => a + b) / totals.length;

    // Calculate volatility (standard deviation)
    const variance = totals.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / totals.length;
    const volatility = Math.sqrt(variance);

    return {
      currentTotal: currentSnapshot.total,
      period: days <= 7 ? 'daily' : days <= 35 ? 'weekly' : 'monthly',
      days,
      dataPoints,
      trend: {
        direction,
        percentChange: Math.round(percentChange * 100) / 100,
        absoluteChange: Math.round(absoluteChange),
      },
      summary: {
        highest: Math.round(highest),
        lowest: Math.round(lowest),
        average: Math.round(average),
        volatility: Math.round(volatility),
      },
    };
  }

  /**
   * Get comparison between two periods
   */
  async getNetWorthComparison(userId: string): Promise<{
    current30Days: NetWorthGraph;
    previous30Days: NetWorthGraph;
    improvement: {
      percentChange: number;
      absoluteChange: number;
    };
  }> {
    const current30 = await this.getNetWorthGraph(userId, 30);

    // Get previous 30 days (days 30-60)
    const snapshots = await this.prisma.netWorthSnapshot.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let previous30: NetWorthGraph;

    if (snapshots.length === 0) {
      previous30 = this.getEmptyGraph();
    } else {
      const dataPoints = snapshots.map(snap => ({
        date: new Date(snap.createdAt).toISOString().split('T')[0],
        total: snap.total,
        walletTotal: snap.walletTotal,
        investmentTotal: snap.investmentTotal,
        breakdown: [
          {
            category: 'Wallets',
            value: snap.walletTotal,
            percentage: snap.total > 0 ? (snap.walletTotal / snap.total) * 100 : 0,
          },
          {
            category: 'Investments',
            value: snap.investmentTotal,
            percentage: snap.total > 0 ? (snap.investmentTotal / snap.total) * 100 : 0,
          },
        ],
      }));

      const totals = snapshots.map(s => s.total);
      const average = totals.reduce((a, b) => a + b) / totals.length;
      const variance = totals.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / totals.length;

      previous30 = {
        currentTotal: snapshots[snapshots.length - 1].total,
        period: 'weekly',
        days: 30,
        dataPoints,
        trend: {
          direction: 'stable',
          percentChange: 0,
          absoluteChange: 0,
        },
        summary: {
          highest: Math.max(...totals),
          lowest: Math.min(...totals),
          average: Math.round(average),
          volatility: Math.round(Math.sqrt(variance)),
        },
      };
    }

    const improvement = {
      percentChange: current30.summary.average > 0
        ? ((current30.summary.average - previous30.summary.average) / previous30.summary.average) * 100
        : 0,
      absoluteChange: current30.summary.average - previous30.summary.average,
    };

    return {
      current30Days: current30,
      previous30Days: previous30,
      improvement: {
        percentChange: Math.round(improvement.percentChange * 100) / 100,
        absoluteChange: Math.round(improvement.absoluteChange),
      },
    };
  }

  /**
   * Get 90-day graph data
   */
  async getNetWorthGraph90Days(userId: string): Promise<NetWorthGraph> {
    return this.getNetWorthGraph(userId, 90);
  }

  /**
   * Get last N snapshots in raw format (for mobile to process)
   */
  async getRawSnapshots(userId: string, days: number = 30): Promise<any[]> {
    return this.prisma.netWorthSnapshot.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        total: true,
        walletTotal: true,
        investmentTotal: true,
        createdAt: true,
      },
    });
  }

  private getEmptyGraph(): NetWorthGraph {
    return {
      currentTotal: 0,
      period: 'daily',
      days: 30,
      dataPoints: [],
      trend: {
        direction: 'stable',
        percentChange: 0,
        absoluteChange: 0,
      },
      summary: {
        highest: 0,
        lowest: 0,
        average: 0,
        volatility: 0,
      },
    };
  }
}
