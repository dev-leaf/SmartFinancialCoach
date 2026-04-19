import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { NetWorthController } from './net-worth.controller';
import { PriceService } from './services/price.service';
import { PriceUpdateService } from './services/price-update.service';
import { NetWorthService } from './services/net-worth.service';
import { NetWorthGraphService } from './services/net-worth-graph.service';
import { DatabaseModule } from '../database/database.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [DatabaseModule, BillingModule],
  providers: [
    InvestmentsService,
    PriceService,
    PriceUpdateService,
    NetWorthService,
    NetWorthGraphService,
  ],
  controllers: [InvestmentsController, NetWorthController],
  exports: [InvestmentsService, PriceService, NetWorthService, NetWorthGraphService],
})
export class InvestmentsModule {}
