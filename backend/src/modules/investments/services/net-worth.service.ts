import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PriceService } from './price.service';

interface NetWorthBreakdown {
  wallets: number;
  investments: number;
  byType: Record<string, number>;
}

export interface NetWorthResponse {
  totalNetWorth: number;
  breakdown: NetWorthBreakdown;
  wallets: { total: number; count: number };
  investments: { total: number; count: number; profitLoss: number };
  lastUpdated: string;
}

export interface TrendPoint {
  date: string;   // YYYY-MM-DD
  netWorth: number;
  walletTotal: number;
  investmentTotal: number;
}

@Injectable()
export class NetWorthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceService,
  ) {}

  /**
   * Calculate current net worth with up-to-date live prices.
   */
  async calculateNetWorth(userId: string): Promise<NetWorthResponse> {
    // ── Wallet balance ─────────────────────────────────────────────────────
    const wallets = await this.prisma.wallet.findMany({ where: { userId } });
    const walletTotal = wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);

    // ── Investment value (with refreshed prices) ───────────────────────────
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    // Batch-refresh crypto prices; refresh stocks individually
    const cryptoSymbols = investments
      .filter((i) => i.type === 'crypto' && i.assetSymbol)
      .map((i) => i.assetSymbol!);

    if (cryptoSymbols.length > 0) {
      await this.priceService.getBatchCryptoPrices(cryptoSymbols);
    }

    let investmentTotal = 0;
    let investmentProfitLoss = 0;
    const byType: Record<string, number> = {};

    for (const inv of investments) {
      const symbol = inv.assetSymbol ?? inv.assetName;
      const priceResult = await this.priceService.getPrice(
        symbol,
        inv.type as 'crypto' | 'stock',
      );

      const liveCurrentValue = inv.quantity * priceResult.price;
      const livePnL = liveCurrentValue - inv.totalBuyValue;

      investmentTotal += liveCurrentValue;
      investmentProfitLoss += livePnL;
      byType[inv.type] = (byType[inv.type] ?? 0) + liveCurrentValue;
    }

    const totalNetWorth = walletTotal + investmentTotal;

    // Persist daily snapshot for trend chart
    await this.upsertDailySnapshot(userId, totalNetWorth, walletTotal, investmentTotal);

    return {
      totalNetWorth,
      breakdown: { wallets: walletTotal, investments: investmentTotal, byType },
      wallets: { total: walletTotal, count: wallets.length },
      investments: {
        total: investmentTotal,
        count: investments.length,
        profitLoss: investmentProfitLoss,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Return the 30-day trend from NetWorthSnapshot.
   */
  async getNetWorthTrend(
    userId: string,
    days = 30,
  ): Promise<TrendPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await this.prisma.netWorthSnapshot.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    return snapshots.map((s) => ({
      date: s.createdAt.toISOString().slice(0, 10),
      netWorth: s.total,
      walletTotal: s.walletTotal,
      investmentTotal: s.investmentTotal,
    }));
  }

  /**
   * Upsert a single snapshot per user per calendar day.
   * Called automatically by calculateNetWorth so we always have fresh data.
   */
  async upsertDailySnapshot(
    userId: string,
    total: number,
    walletTotal: number,
    investmentTotal: number,
  ): Promise<void> {
    // Normalize to UTC day boundaries so “one per day” is consistent across deployments/timezones.
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

    // Check if there is already a snapshot for today
    const existing = await this.prisma.netWorthSnapshot.findFirst({
      where: {
        userId,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    if (existing) {
      await this.prisma.netWorthSnapshot.update({
        where: { id: existing.id },
        data: { total, walletTotal, investmentTotal },
      });
    } else {
      await this.prisma.netWorthSnapshot.create({
        data: { userId, total, walletTotal, investmentTotal },
      });
    }
  }
}
