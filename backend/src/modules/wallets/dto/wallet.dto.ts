export class WalletDto {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
