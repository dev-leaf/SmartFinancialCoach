import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FinancialProfileController } from './financial-profile.controller';
import { FinancialProfileService } from './financial-profile.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FinancialProfileController],
  providers: [FinancialProfileService],
  exports: [FinancialProfileService],
})
export class FinancialProfileModule {}

