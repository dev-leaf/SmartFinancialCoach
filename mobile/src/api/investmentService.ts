import { httpClient } from '../services/api/httpClient';
import {
  InvestmentResponse,
  CreateInvestmentPayload,
  NetWorthResponse,
} from '../types/investment';

export const investmentService = {
  async getInvestments(): Promise<InvestmentResponse> {
    return httpClient.get<InvestmentResponse>('/investments');
  },

  async createInvestment(payload: CreateInvestmentPayload): Promise<InvestmentResponse> {
    return httpClient.post<InvestmentResponse>('/investments', payload);
  },

  async updateInvestment(
    id: string,
    payload: Partial<CreateInvestmentPayload>,
  ): Promise<InvestmentResponse> {
    return httpClient.put<InvestmentResponse>(`/investments/${id}`, payload);
  },

  async deleteInvestment(id: string): Promise<InvestmentResponse> {
    return httpClient.delete<InvestmentResponse>(`/investments/${id}`);
  },

  async getPortfolioSummary(): Promise<InvestmentResponse> {
    return httpClient.get<InvestmentResponse>('/investments/summary/portfolio');
  },

  // ── Net Worth ────────────────────────────────────────────────────────────────

  async getNetWorth(): Promise<NetWorthResponse> {
    return httpClient.get<NetWorthResponse>('/net-worth');
  },

  async getNetWorthTrend(): Promise<NetWorthResponse> {
    return httpClient.get<NetWorthResponse>('/net-worth/trend');
  },

  // ── Search & Price (future backend integration) ──────────────────────────

  async searchAssets(query: string): Promise<any> {
    return httpClient.get<any>('/investments/search', { params: { q: query } });
  },

  async getAssetPrice(symbol: string, type: string): Promise<any> {
    return httpClient.get<any>('/investments/price', {
      params: { symbol, type },
    });
  },
};
