export interface Budget {
  id: string;
  userId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface SetBudgetPayload {
  amount: number;
}

export interface BudgetResponse {
  success: boolean;
  statusCode: number;
  data?: Budget | { message: string } | null;
  message: string;
  timestamp: string;
}

export enum AlertLevel {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  WARNING = 'WARNING',
  DANGER = 'DANGER',
}

export interface BudgetSummary {
  totalSpending: number;
  monthlyBudget: number;
  remainingBudget: number;
  spendingPercentage: number;
  alertLevel: AlertLevel;
  expenseCount: number;
}

export interface BudgetSummaryApi {
  totalSpending: number;
  remaining: number;
  percentageUsed: number;
  alertLevel: AlertLevel;
  expenseCount: number;
}

export interface SummaryResponse {
  success: boolean;
  statusCode: number;
  data?: BudgetSummaryApi | null;
  message: string;
  timestamp: string;
}

export interface BudgetState {
  budget: Budget | null;
  summary: BudgetSummary | null;
  isLoading: boolean;
  error: string | null;
}

export const ALERT_COLORS: Record<AlertLevel, string> = {
  [AlertLevel.SAFE]: '#18B979',
  [AlertLevel.CAUTION]: '#F59E0B',
  [AlertLevel.WARNING]: '#F97316',
  [AlertLevel.DANGER]: '#FF5A5F',
};
