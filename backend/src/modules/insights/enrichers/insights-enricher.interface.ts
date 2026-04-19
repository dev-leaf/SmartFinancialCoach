import { AIInsight } from '../insights.service';

export interface InsightsEnrichmentContext {
  userId: string;
  baseCurrency: string;
  generatedAt: string; // ISO
}

export interface InsightsEnricher {
  enrich(insights: AIInsight[], context: InsightsEnrichmentContext): Promise<AIInsight[]>;
}

