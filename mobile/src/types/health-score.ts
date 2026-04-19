export interface HealthScore {
  overallScore: number;
  scoreBreakdown: {
    budgetHealth: number;
    savingsRate: number;
    investmentScore: number;
    consistencyScore: number;
  };
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  recommendations: string[];
}

export interface HealthScoreResponse {
  success: boolean;
  statusCode: number;
  data?: HealthScore | null;
  message: string;
  timestamp: string;
}
