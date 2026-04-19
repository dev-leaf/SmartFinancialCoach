import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DailyDigestService } from './daily-digest.service';

@Controller('jobs')
@UseGuards(AuthGuard('jwt'))
export class DigestJobsController {
  constructor(private readonly dailyDigest: DailyDigestService) {}

  // Call this from an external scheduler (Railway/Render cron) once per day.
  @Post('daily-digest')
  @HttpCode(HttpStatus.OK)
  async runDailyDigest() {
    const data = await this.dailyDigest.runDailyDigest();
    return { success: true, statusCode: HttpStatus.OK, message: 'Daily digest sent', data, timestamp: new Date().toISOString() };
  }
}

