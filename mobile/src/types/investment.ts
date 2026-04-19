export interface Investment {
  id: string;
  userId: string;
  assetName: string;
  assetSymbol?: string;
  type: 'stock' | 'crypto' | 'mutual_fund' | 'commodity';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  totalBuyValue: number;
  totalCurrentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  currency: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  // Live price enrichment (from backend)
  change24h: number;
  usingCachedPrice: boolean;
  lastPriceUpdate: string;
}

export interface CreateInvestmentPayload {
  assetName: string;
  assetSymbol?: string;
  type: 'stock' | 'crypto' | 'mutual_fund' | 'commodity';
  quantity: number;
  buyPrice: number;
  currency?: string;
  purchaseDate?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  topPerformer: Investment | null;
  worstPerformer: Investment | null;
  byType: Record<
    string,
    {
      invested: number;
      current: number;
      profitLoss: number;
      totalCurrentValue: number;
    }
  >;
  lastUpdated: string;
}

export interface InvestmentResponse {
  success: boolean;
  statusCode: number;
  data?: Investment | Investment[] | PortfolioSummary | null;
  message: string;
  timestamp: string;
}

export interface NetWorthData {
  totalNetWorth: number;
  breakdown: {
    wallets: number;
    investments: number;
    byType: Record<string, number>;
  };
  wallets: { total: number; count: number };
  investments: { total: number; count: number; profitLoss: number };
  lastUpdated: string;
}

export interface NetWorthTrendPoint {
  date: string; // YYYY-MM-DD
  netWorth: number;
  walletTotal: number;
  investmentTotal: number;
}

export interface NetWorthResponse {
  success: boolean;
  statusCode: number;
  data: NetWorthData | NetWorthTrendPoint[];
  message: string;
  timestamp: string;
}
