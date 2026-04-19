import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestmentDto } from './dto/investment.dto';
import { PriceService, PriceResult } from './services/price.service';

// Extended DTO returned by service methods
export interface RichInvestmentDto extends InvestmentDto {
  change24h: number;       // live 24-h % change from price provider
  usingCachedPrice: boolean;
  lastPriceUpdate: Date;
}

export interface PortfolioSummaryDto {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  topPerformer: RichInvestmentDto | null;
  worstPerformer: RichInvestmentDto | null;
  byType: Record<string, { invested: number; current: number; profitLoss: number; totalCurrentValue: number }>;
  lastUpdated: string;
}

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceService,
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(
    userId: string,
    dto: CreateInvestmentDto,
  ): Promise<RichInvestmentDto> {
    const symbol = dto.assetSymbol ?? dto.assetName;
    const priceResult = await this.priceService.getPrice(
      symbol,
      dto.type as 'crypto' | 'stock',
    );

    const buyPrice       = dto.buyPrice;
    const currentPrice   = priceResult.price > 0 ? priceResult.price : buyPrice;
    const totalBuyValue  = dto.quantity * buyPrice;
    const totalCurrentValue = dto.quantity * currentPrice;
    const profitLoss     = totalCurrentValue - totalBuyValue;
    const profitLossPercent =
      totalBuyValue > 0 ? (profitLoss / totalBuyValue) * 100 : 0;

    const investment = await this.prisma.investment.create({
      data: {
        userId,
        assetName: dto.assetName,
        assetSymbol: dto.assetSymbol,
        type: dto.type,
        quantity: dto.quantity,
        buyPrice,
        currentPrice,
        totalBuyValue,
        totalCurrentValue,
        profitLoss,
        profitLossPercent,
        currency: dto.currency ?? 'INR',
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
      },
    });

    return this.toRichDto(investment, priceResult);
  }

  // ── Read all with live prices ────────────────────────────────────────────────

  async findAll(userId: string): Promise<RichInvestmentDto[]> {
    const rows = await this.prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Batch-fetch cryptos first for efficiency
    const cryptoSymbols = rows
      .filter((r) => r.type === 'crypto' && r.assetSymbol)
      .map((r) => r.assetSymbol!);

    if (cryptoSymbols.length > 0) {
      await this.priceService.getBatchCryptoPrices(cryptoSymbols);
    }

    // Now resolve each (cache will answer crypto, AV hit for stocks)
    return Promise.all(
      rows.map(async (row) => {
        const symbol = row.assetSymbol ?? row.assetName;
        const priceResult = await this.priceService.getPrice(
          symbol,
          row.type as 'crypto' | 'stock',
        );

        // Compute live values
        const livePrice = priceResult.price > 0 ? priceResult.price : row.currentPrice;
        const liveCurrentValue = row.quantity * livePrice;
        const livePnL = liveCurrentValue - row.totalBuyValue;
        const livePnLPct =
          row.totalBuyValue > 0 ? (livePnL / row.totalBuyValue) * 100 : 0;

        // Persist updated prices back to DB (fire-and-forget)
        this.updateStoredPrice(row.id, livePrice, liveCurrentValue, livePnL, livePnLPct).catch(() => {});

        return this.toRichDto(
          {
            ...row,
            currentPrice: livePrice,
            totalCurrentValue: liveCurrentValue,
            profitLoss: livePnL,
            profitLossPercent: livePnLPct,
          },
          priceResult,
        );
      }),
    );
  }

  // ── Read one ─────────────────────────────────────────────────────────────────

  async findById(userId: string, id: string): Promise<RichInvestmentDto | null> {
    const row = await this.prisma.investment.findUnique({ where: { id } });
    if (!row) return null;
    if (row.userId !== userId) throw new NotFoundException('Investment not found');

    const symbol = row.assetSymbol ?? row.assetName;
    const priceResult = await this.priceService.getPrice(
      symbol,
      row.type as 'crypto' | 'stock',
    );
    const livePrice = priceResult.price > 0 ? priceResult.price : row.currentPrice;
    const liveCurrentValue = row.quantity * livePrice;
    const livePnL = liveCurrentValue - row.totalBuyValue;
    const livePnLPct =
      row.totalBuyValue > 0 ? (livePnL / row.totalBuyValue) * 100 : 0;

    return this.toRichDto(
      { ...row, currentPrice: livePrice, totalCurrentValue: liveCurrentValue, profitLoss: livePnL, profitLossPercent: livePnLPct },
      priceResult,
    );
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(
    userId: string,
    id: string,
    data: Partial<CreateInvestmentDto>,
  ): Promise<RichInvestmentDto> {
    const existing = await this.prisma.investment.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Investment not found');
    }

    const symbol = data.assetSymbol ?? data.assetName ?? existing.assetSymbol ?? existing.assetName;
    const priceResult = await this.priceService.getPrice(
      symbol,
      (data.type ?? existing.type) as 'crypto' | 'stock',
    );

    const quantity  = data.quantity  ?? existing.quantity;
    const buyPrice  = data.buyPrice  ?? existing.buyPrice;
    const livePrice = priceResult.price > 0 ? priceResult.price : existing.currentPrice;
    const totalBuyValue     = quantity * buyPrice;
    const totalCurrentValue = quantity * livePrice;
    const profitLoss        = totalCurrentValue - totalBuyValue;
    const profitLossPercent =
      totalBuyValue > 0 ? (profitLoss / totalBuyValue) * 100 : 0;

    const updated = await this.prisma.investment.update({
      where: { id },
      data: {
        assetName: data.assetName ?? existing.assetName,
        assetSymbol: data.assetSymbol ?? existing.assetSymbol,
        type: data.type ?? existing.type,
        quantity,
        buyPrice,
        currentPrice: livePrice,
        totalBuyValue,
        totalCurrentValue,
        profitLoss,
        profitLossPercent,
      },
    });

    return this.toRichDto(updated, priceResult);
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async delete(userId: string, id: string): Promise<void> {
    const row = await this.prisma.investment.findUnique({ where: { id } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Investment not found');
    }
    await this.prisma.investment.delete({ where: { id } });
  }

  // ── Portfolio summary ────────────────────────────────────────────────────────

  async getPortfolioSummary(userId: string): Promise<PortfolioSummaryDto> {
    const investments = await this.findAll(userId);

    let totalInvested      = 0;
    let totalCurrentValue  = 0;
    let totalProfitLoss    = 0;

    const byType: Record<string, { invested: number; current: number; profitLoss: number; totalCurrentValue: number }> = {};

    let topPerformer:   RichInvestmentDto | null = null;
    let worstPerformer: RichInvestmentDto | null = null;

    for (const inv of investments) {
      totalInvested     += inv.totalBuyValue;
      totalCurrentValue += inv.totalCurrentValue;
      totalProfitLoss   += inv.profitLoss;

      if (!byType[inv.type]) {
        byType[inv.type] = { invested: 0, current: 0, profitLoss: 0, totalCurrentValue: 0 };
      }
      byType[inv.type].invested        += inv.totalBuyValue;
      byType[inv.type].current         += inv.totalCurrentValue;
      byType[inv.type].profitLoss      += inv.profitLoss;
      byType[inv.type].totalCurrentValue += inv.totalCurrentValue;

      if (!topPerformer || inv.profitLossPercent > topPerformer.profitLossPercent) {
        topPerformer = inv;
      }
      if (!worstPerformer || inv.profitLossPercent < worstPerformer.profitLossPercent) {
        worstPerformer = inv;
      }
    }

    const totalProfitLossPercent =
      totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      topPerformer,
      worstPerformer,
      byType,
      lastUpdated: new Date().toISOString(),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private toRichDto(row: any, priceResult?: PriceResult): RichInvestmentDto {
    return {
      id:                 row.id,
      userId:             row.userId,
      assetName:          row.assetName,
      assetSymbol:        row.assetSymbol,
      type:               row.type,
      quantity:           row.quantity,
      buyPrice:           row.buyPrice,
      currentPrice:       row.currentPrice,
      totalBuyValue:      row.totalBuyValue,
      totalCurrentValue:  row.totalCurrentValue,
      profitLoss:         row.profitLoss,
      profitLossPercent:  row.profitLossPercent,
      currency:           row.currency,
      purchaseDate:       row.purchaseDate,
      createdAt:          row.createdAt,
      updatedAt:          row.updatedAt,
      change24h:          priceResult?.change24h ?? 0,
      usingCachedPrice:   priceResult?.cached ?? false,
      lastPriceUpdate:    priceResult?.lastUpdated ?? new Date(),
    };
  }

  private async updateStoredPrice(
    id: string,
    currentPrice: number,
    totalCurrentValue: number,
    profitLoss: number,
    profitLossPercent: number,
  ): Promise<void> {
    await this.prisma.investment.update({
      where: { id },
      data: { currentPrice, totalCurrentValue, profitLoss, profitLossPercent },
    });
  }
}
