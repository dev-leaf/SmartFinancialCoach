import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { DatabaseModule } from '../database/database.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { BillingModule } from '../billing/billing.module';
import { DeterministicEnricher } from './enrichers/deterministic.enricher';
import { OpenAIEnricher } from './enrichers/openai.enricher';

@Module({
  imports: [DatabaseModule, ExpensesModule, BudgetsModule, BillingModule],
  providers: [InsightsService, DeterministicEnricher, OpenAIEnricher],
  controllers: [InsightsController],
  exports: [InsightsService],
})
export class InsightsModule {}
