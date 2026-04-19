import { Controller, Get, UseGuards, Request, HttpStatus, HttpCode } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { HealthScoreService } from './health-score.service';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('health-score')
@UseGuards(AuthGuard('jwt'))
export class HealthScoreController {
  constructor(private healthScoreService: HealthScoreService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getScore(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<any>> {
    const score = await this.healthScoreService.calculateScore(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Health score calculated',
      data: score,
      timestamp: new Date().toISOString(),
    };
  }
}
