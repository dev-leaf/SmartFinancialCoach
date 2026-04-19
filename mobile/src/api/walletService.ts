import { httpClient } from '../services/api/httpClient';

export interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletResponse {
  success: boolean;
  statusCode: number;
  data: Wallet | Wallet[] | null;
  message: string;
  timestamp: string;
}

export const walletService = {
  async getWallets(): Promise<WalletResponse> {
    return httpClient.get<WalletResponse>('/wallets');
  },

  async createWallet(data: Partial<Wallet>): Promise<WalletResponse> {
    return httpClient.post<WalletResponse>('/wallets', data);
  },

  async updateWallet(id: string, data: Partial<Wallet>): Promise<WalletResponse> {
    return httpClient.put<WalletResponse>(`/wallets/${id}`, data);
  },

  async deleteWallet(id: string): Promise<WalletResponse> {
    return httpClient.delete<WalletResponse>(`/wallets/${id}`);
  },

  async getRates(base: string = 'INR'): Promise<any> {
    return httpClient.get(`/wallets/rates/${base}`);
  },
};
