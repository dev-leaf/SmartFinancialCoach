import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RevenueMetricsService } from './revenue-metrics.service';

@Controller('revenue')
@UseGuards(AuthGuard('jwt'))
export class RevenueController {
  constructor(private readonly revenueMetricsService: RevenueMetricsService) {}

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  async getMetrics(@Query('days') days?: string) {
    const rangeDays = days ? Math.max(7, Math.min(365, parseInt(days, 10))) : 30;
    const data = await this.revenueMetricsService.getMetrics(rangeDays);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Revenue metrics computed',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

