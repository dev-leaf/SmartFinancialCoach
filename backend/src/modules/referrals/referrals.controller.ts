import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
@UseGuards(AuthGuard('jwt'))
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('code')
  @HttpCode(HttpStatus.OK)
  async code(@Request() req: ExpressRequest & { user: { id: string } }) {
    const data = await this.referralsService.getOrCreateCode(req.user.id);
    return { success: true, statusCode: HttpStatus.OK, message: 'Referral code', data, timestamp: new Date().toISOString() };
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  async redeem(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { code: string },
  ) {
    const data = await this.referralsService.redeem(req.user.id, body.code);
    return { success: true, statusCode: HttpStatus.OK, message: 'Referral processed', data, timestamp: new Date().toISOString() };
  }
}

