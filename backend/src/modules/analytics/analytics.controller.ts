import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('track')
  @HttpCode(HttpStatus.OK)
  async track(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { event: string; properties?: Record<string, any> },
  ) {
    await this.analytics.trackEvent({
      event: body.event,
      userId: req.user.id,
      properties: body.properties ?? {},
      timestamp: new Date(),
    });
    return { success: true, statusCode: HttpStatus.OK, message: 'Tracked', data: null, timestamp: new Date().toISOString() };
  }
}

