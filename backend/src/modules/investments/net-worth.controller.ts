import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { NetWorthService, NetWorthResponse, TrendPoint } from './services/net-worth.service';
import { NetWorthGraphService, NetWorthGraph } from './services/net-worth-graph.service';
import { RequireTier } from '../../common/subscription/require-tier.decorator';
import { SubscriptionTierGuard } from '../../common/subscription/subscription-tier.guard';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

type AuthReq = ExpressRequest & { user: { id: string } };

@Controller('net-worth')
@UseGuards(AuthGuard('jwt'), SubscriptionTierGuard)
export class NetWorthController {
  constructor(
    private readonly netWorthService: NetWorthService,
    private readonly graphService: NetWorthGraphService,
  ) {}

  /**
   * GET /net-worth
   * Returns total net worth (wallets + live investment values).
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getNetWorth(
    @Request() req: AuthReq,
  ): Promise<ApiResponse<NetWorthResponse>> {
    const data = await this.netWorthService.calculateNetWorth(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Net worth calculated successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /net-worth/trend
   * Returns 30-day trend data points from NetWorthSnapshot table.
   */
  @Get('trend')
  @HttpCode(HttpStatus.OK)
  async getTrend(
    @Request() req: AuthReq,
  ): Promise<ApiResponse<TrendPoint[]>> {
    const trend = await this.netWorthService.getNetWorthTrend(req.user.id, 30);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `${trend.length} trend points retrieved`,
      data: trend,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /net-worth/graph
   * Returns graph data for specified number of days (default: 30)
   */
  @Get('graph')
  @HttpCode(HttpStatus.OK)
  async getGraph(
    @Request() req: AuthReq,
    @Query('days') days?: string,
  ): Promise<ApiResponse<NetWorthGraph>> {
    const dayCount = days ? parseInt(days, 10) : 30;
    const data = await this.graphService.getNetWorthGraph(req.user.id, dayCount);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Net worth graph for last ${dayCount} days`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /net-worth/graph/90
   * Returns 90-day graph data
   */
  @Get('graph/90')
  @HttpCode(HttpStatus.OK)
  @RequireTier('premium')
  async getGraph90Days(
    @Request() req: AuthReq,
  ): Promise<ApiResponse<NetWorthGraph>> {
    const data = await this.graphService.getNetWorthGraph90Days(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Net worth graph for last 90 days',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /net-worth/comparison
   * Returns comparison between current 30 days and previous 30 days
   */
  @Get('comparison')
  @HttpCode(HttpStatus.OK)
  @RequireTier('premium')
  async getComparison(@Request() req: AuthReq) {
    const data = await this.graphService.getNetWorthComparison(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Net worth 30-day comparison',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /net-worth/snapshots
   * Returns raw snapshot data for custom processing
   */
  @Get('snapshots')
  @HttpCode(HttpStatus.OK)
  @RequireTier('premium')
  async getRawSnapshots(
    @Request() req: AuthReq,
    @Query('days') days?: string,
  ): Promise<ApiResponse<any[]>> {
    const dayCount = days ? parseInt(days, 10) : 30;
    const data = await this.graphService.getRawSnapshots(req.user.id, dayCount);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `${data.length} snapshots retrieved`,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
