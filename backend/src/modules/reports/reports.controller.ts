import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { WeeklyReportService, WeeklyReportDto } from './weekly-report.service';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly weeklyReportService: WeeklyReportService) {}

  /**
   * GET /reports/weekly
   * Get weekly financial report with spending analysis and insights
   */
  @Get('weekly')
  @HttpCode(HttpStatus.OK)
  async getWeeklyReport(
    @Request() req: ExpressRequest & { user: { id: string } },
  ): Promise<ApiResponse<WeeklyReportDto>> {
    const userId = req.user.id;
    const report = await this.weeklyReportService.getWeeklyReport(userId);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Weekly report generated successfully',
      data: report,
      timestamp: new Date().toISOString(),
    };
  }
}
