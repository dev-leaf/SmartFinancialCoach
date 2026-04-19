import { Injectable } from '@nestjs/common';
import { AIInsight } from '../insights.service';
import { InsightsEnricher, InsightsEnrichmentContext } from './insights-enricher.interface';

@Injectable()
export class DeterministicEnricher implements InsightsEnricher {
  async enrich(insights: AIInsight[], _context: InsightsEnrichmentContext): Promise<AIInsight[]> {
    return insights;
  }
}

