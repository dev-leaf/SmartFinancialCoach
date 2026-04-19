export interface AIInsight {
  title: string;
  description: string;
  category?: 'spending' | 'savings' | 'investment' | 'subscription' | 'goal' | 'warning';
  impact: 'positive' | 'negative' | 'neutral';
  severity?: 'info' | 'warning' | 'critical';
  savingsPotential?: number;
  actionable: boolean;
  actionTitle?: string;
  predictedOutcome?: string;
}

export interface InsightsResponse {
  success: boolean;
  statusCode: number;
  data?: AIInsight[] | null;
  message: string;
  timestamp: string;
}
