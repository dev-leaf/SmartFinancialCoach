import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { WeeklyReportService } from './weekly-report.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [WeeklyReportService],
  exports: [WeeklyReportService],
})
export class ReportsModule {}
