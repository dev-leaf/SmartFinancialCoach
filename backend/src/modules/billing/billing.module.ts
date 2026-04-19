import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { RevenueMetricsService } from './revenue-metrics.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, RevenueMetricsService],
  exports: [SubscriptionService],
})
export class BillingModule {}

