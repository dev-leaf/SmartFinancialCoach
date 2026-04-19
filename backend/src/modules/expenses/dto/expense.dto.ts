export class ExpenseDto {
  id: string;
  userId: string;
  walletId?: string;
  amount: number;
  currency: string;
  category: string;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
