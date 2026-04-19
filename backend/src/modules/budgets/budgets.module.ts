import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService], // Export for use in other modules
})
export class BudgetsModule {}
