import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { SmartAlertsService, SmartAlertResponse } from './smart-alerts.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
export class SmartAlertsController {
  constructor(private smartAlertsService: SmartAlertsService) {}

  /**
   * Generate and fetch all active alerts for the current user
   * GET /alerts/active
   */
  @Get('active')
  async getActiveAlerts(
    @Request() req: ExpressRequest & { user: { id: string } },
  ): Promise<SmartAlertResponse[]> {
    return this.smartAlertsService.getActiveAlerts(req.user.id);
  }

  /**
   * Get all alerts with optional limit
   * GET /alerts
   */
  @Get()
  async getAllAlerts(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body('limit') limit?: number,
  ): Promise<SmartAlertResponse[]> {
    return this.smartAlertsService.getAllAlerts(req.user.id, limit || 50);
  }

  /**
   * Generate fresh alerts (triggers alert generation logic)
   * POST /alerts/generate
   */
  @Post('generate')
  async generateAlerts(
    @Request() req: ExpressRequest & { user: { id: string } },
  ): Promise<SmartAlertResponse[]> {
    // Clear existing undismissed alerts for this session
    return this.smartAlertsService.generateAlertsForUser(req.user.id);
  }

  /**
   * Dismiss a specific alert
   * PUT /alerts/:id/dismiss
   */
  @Put(':id/dismiss')
  async dismissAlert(
    @Param('id') alertId: string,
    @Request() req: ExpressRequest & { user: { id: string } },
  ): Promise<SmartAlertResponse> {
    return this.smartAlertsService.dismissAlert(alertId);
  }

  /**
   * Get alert configuration
   * GET /alerts/config
   */
  @Get('config')
  async getConfiguration(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.smartAlertsService.getAlertConfiguration(req.user.id);
  }

  /**
   * Update alert configuration
   * PUT /alerts/config
   */
  @Put('config')
  async updateConfiguration(
    @Body()
    updates: {
      budgetThresholdPercent?: number;
      unusualSpendingEnabled?: boolean;
      subscriptionRemindersEnabled?: boolean;
      dailyDigestEnabled?: boolean;
    },
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.smartAlertsService.updateAlertConfiguration(req.user.id, updates);
  }
}
