export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description?: string;
  walletId?: string | null;
  currency?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpensePayload {
  amount: number;
  category: string;
  description?: string;
  walletId?: string;
  currency?: string;
}

export interface UpdateExpensePayload {
  amount?: number;
  category?: string;
  description?: string;
  walletId?: string;
  currency?: string;
}

export interface ExpenseResponse {
  success: boolean;
  statusCode: number;
  data?: Expense | Expense[];
  message: string;
  timestamp: string;
}

export interface ExpenseState {
  expenses: Expense[];
  currentExpense: Expense | null;
  isLoading: boolean;
  error: string | null;
}
