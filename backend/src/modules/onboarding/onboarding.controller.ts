import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { OnboardingService } from './onboarding.service';
import { OnboardingDto } from './dto/onboarding.dto';

@Controller('onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submit(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: OnboardingDto,
  ) {
    const data = await this.onboardingService.submit(req.user.id, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Onboarding saved',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

