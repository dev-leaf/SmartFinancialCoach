export interface WeeklyReport {
  totalSpent: number;
  change: string; // "+12%" or "-8%"
  topCategory: string | null;
  biggestExpense: number | null;
  savingsRate: number;
  insight: string;
}

export interface WeeklyReportResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: WeeklyReport | null;
  timestamp: string;
}
