export class InvestmentDto {
  id: string;
  userId: string;
  assetName: string;
  assetSymbol?: string;
  type: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  totalBuyValue: number;
  totalCurrentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  currency: string;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
  // Live price enrichment fields
  change24h: number;
  usingCachedPrice: boolean;
  lastPriceUpdate: Date;
}
