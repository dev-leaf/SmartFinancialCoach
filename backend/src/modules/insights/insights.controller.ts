import { Controller, Get, Post, UseGuards, Request, HttpStatus, HttpCode } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { InsightsService } from './insights.service';
import { RequireTier } from '../../common/subscription/require-tier.decorator';
import { SubscriptionTierGuard } from '../../common/subscription/subscription-tier.guard';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('insights')
@UseGuards(AuthGuard('jwt'))
export class InsightsController {
  constructor(private insightsService: InsightsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getInsights(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<any[]>> {
    const insights = await this.insightsService.generateInsights(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'AI insights generated',
      data: insights,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /insights/generate
   * Explicit “refresh” endpoint (mobile calls this).
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<any[]>> {
    const insights = await this.insightsService.generateInsights(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'AI insights refreshed',
      data: insights,
      timestamp: new Date().toISOString(),
    };
  }
}
