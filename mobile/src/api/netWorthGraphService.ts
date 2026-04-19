import { httpClient } from '../services/api/httpClient';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

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
    volatility: number;
  };
}

export interface NetWorthComparison {
  current30Days: NetWorthGraph;
  previous30Days: NetWorthGraph;
  improvement: {
    percentChange: number;
    absoluteChange: number;
  };
}

export const netWorthGraphService = {
  async getCurrentNetWorth(): Promise<ApiResponse<any>> {
    return httpClient.get<ApiResponse<any>>('/net-worth');
  },

  async getNetWorthGraph(days?: number): Promise<ApiResponse<NetWorthGraph>> {
    const params = days ? { params: { days } } : undefined;
    return httpClient.get<ApiResponse<NetWorthGraph>>('/net-worth/graph', params as any);
  },

  async getNetWorthGraph30Days(): Promise<ApiResponse<NetWorthGraph>> {
    return httpClient.get<ApiResponse<NetWorthGraph>>('/net-worth/graph', { params: { days: 30 } } as any);
  },

  async getNetWorthGraph90Days(): Promise<ApiResponse<NetWorthGraph>> {
    return httpClient.get<ApiResponse<NetWorthGraph>>('/net-worth/graph/90');
  },

  async getNetWorthComparison(): Promise<ApiResponse<NetWorthComparison>> {
    return httpClient.get<ApiResponse<NetWorthComparison>>('/net-worth/comparison');
  },

  async getRawSnapshots(days?: number): Promise<ApiResponse<any[]>> {
    const params = days ? { params: { days } } : undefined;
    return httpClient.get<ApiResponse<any[]>>('/net-worth/snapshots', params as any);
  },

  async getNetWorthTrend(): Promise<ApiResponse<any[]>> {
    return httpClient.get<ApiResponse<any[]>>('/net-worth/trend');
  },
};
