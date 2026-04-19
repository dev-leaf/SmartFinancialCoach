import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AIInsight } from '../insights.service';
import { InsightsEnricher, InsightsEnrichmentContext } from './insights-enricher.interface';

type AllowedCategory = AIInsight['category'];
type AllowedImpact = AIInsight['impact'];
type AllowedSeverity = AIInsight['severity'];

function isAllowedCategory(v: any): v is AllowedCategory {
  return ['spending', 'savings', 'investment', 'subscription', 'goal', 'warning'].includes(v);
}
function isAllowedImpact(v: any): v is AllowedImpact {
  return ['positive', 'negative', 'neutral'].includes(v);
}
function isAllowedSeverity(v: any): v is AllowedSeverity {
  return ['info', 'warning', 'critical'].includes(v);
}

function validateInsightArray(payload: any): AIInsight[] | null {
  if (!Array.isArray(payload)) return null;

  const validated: AIInsight[] = [];
  for (const row of payload) {
    if (!row || typeof row !== 'object') return null;
    if (typeof row.title !== 'string' || row.title.trim().length < 3) return null;
    if (typeof row.description !== 'string' || row.description.trim().length < 8) return null;
    if (!isAllowedCategory(row.category)) return null;
    if (!isAllowedImpact(row.impact)) return null;
    if (!isAllowedSeverity(row.severity)) return null;
    if (typeof row.actionable !== 'boolean') return null;

    const out: AIInsight = {
      title: row.title,
      description: row.description,
      category: row.category,
      impact: row.impact,
      severity: row.severity,
      actionable: row.actionable,
    };

    if (row.actionTitle != null) {
      if (typeof row.actionTitle !== 'string') return null;
      out.actionTitle = row.actionTitle;
    }
    if (row.predictedOutcome != null) {
      if (typeof row.predictedOutcome !== 'string') return null;
      out.predictedOutcome = row.predictedOutcome;
    }
    if (row.savingsPotential != null) {
      if (typeof row.savingsPotential !== 'number' || !Number.isFinite(row.savingsPotential)) return null;
      out.savingsPotential = row.savingsPotential;
    }

    validated.push(out);
  }
  return validated;
}

@Injectable()
export class OpenAIEnricher implements InsightsEnricher {
  private readonly logger = new Logger(OpenAIEnricher.name);

  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  private readonly baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  async enrich(insights: AIInsight[], context: InsightsEnrichmentContext): Promise<AIInsight[]> {
    if (!this.apiKey) return insights;
    if (insights.length === 0) return insights;

    // Keep deterministic structure; LLM may improve copy + next action.
    const prompt = this.buildPrompt(insights, context);

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'You are a fintech coach. Return ONLY valid JSON. No markdown. No extra keys.',
            },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 12_000,
        },
      );

      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') return insights;

      // Strip accidental code fences.
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      const enriched = validateInsightArray(parsed);
      if (!enriched) {
        this.logger.warn('OpenAI enrichment returned invalid schema. Using deterministic insights.');
        return insights;
      }

      // Preserve ordering/count; if LLM changed count, keep base count.
      return enriched.slice(0, insights.length);
    } catch (err: any) {
      this.logger.warn(`OpenAI enrichment failed: ${err?.message ?? err}`);
      return insights;
    }
  }

  private buildPrompt(insights: AIInsight[], context: InsightsEnrichmentContext): string {
    const schema = {
      title: 'string',
      description: 'string',
      category: ['spending', 'savings', 'investment', 'subscription', 'goal', 'warning'],
      impact: ['positive', 'negative', 'neutral'],
      severity: ['info', 'warning', 'critical'],
      actionable: 'boolean',
      actionTitle: 'string (optional)',
      predictedOutcome: 'string (optional)',
      savingsPotential: 'number (optional)',
    };

    return [
      `Context: baseCurrency=${context.baseCurrency}, generatedAt=${context.generatedAt}.`,
      'Task: Rewrite the following insights to be concise, actionable, and user-friendly for a personal finance app.',
      'Constraints:',
      '- Keep the SAME array length and order.',
      '- Do NOT invent new facts, numbers, or transactions.',
      '- You may rephrase titles/descriptions and improve next actions.',
      '- Return ONLY a JSON array of insight objects matching this schema exactly:',
      JSON.stringify(schema),
      'Input insights JSON:',
      JSON.stringify(insights),
    ].join('\n');
  }
}

