import { Module } from '@nestjs/common';
import { HealthScoreService } from './health-score.service';
import { HealthScoreController } from './health-score.controller';
import { DatabaseModule } from '../database/database.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
  imports: [DatabaseModule, ExpensesModule, BudgetsModule],
  providers: [HealthScoreService],
  controllers: [HealthScoreController],
  exports: [HealthScoreService],
})
export class HealthScoreModule {}
