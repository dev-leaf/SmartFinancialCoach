import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { HealthScoreModule } from './modules/health-score/health-score.module';
import { InsightsModule } from './modules/insights/insights.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinancialProfileModule } from './modules/financial-profile/financial-profile.module';
import { BillingModule } from './modules/billing/billing.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { RateLimitService } from './common/services/rate-limit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    BudgetsModule,
    ExpensesModule,
    WalletsModule,
    InvestmentsModule,
    HealthScoreModule,
    InsightsModule,
    NotificationsModule,
    FinancialProfileModule,
    BillingModule,
    OnboardingModule,
    ReferralsModule,
    AnalyticsModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [RateLimitService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CRITICAL FIX P0: Activate rate limiting middleware
    // Global rate limit: 1000 requests per 15 minutes per IP
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('*');
  }
}
