import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmartAlertsService } from './smart-alerts.service';
import { SmartAlertsController } from './smart-alerts.controller';
import { DatabaseModule } from '../database/database.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { PushTokensController } from './push-tokens/push-tokens.controller';
import { PushTokensService } from './push-tokens/push-tokens.service';
import { ExpoPushGateway } from './push-tokens/expo-push.gateway';
import { DailyDigestService } from './digest/daily-digest.service';
import { DigestJobsController } from './digest/digest.controller';

@Module({
  imports: [DatabaseModule, ExpensesModule, BudgetsModule],
  providers: [NotificationsService, SmartAlertsService, PushTokensService, ExpoPushGateway, DailyDigestService],
  controllers: [NotificationsController, SmartAlertsController, PushTokensController, DigestJobsController],
  exports: [NotificationsService, SmartAlertsService, PushTokensService, ExpoPushGateway, DailyDigestService],
})
export class NotificationsModule {}
