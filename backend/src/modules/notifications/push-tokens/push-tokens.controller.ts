import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PushTokensService } from './push-tokens.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('push-tokens')
@UseGuards(AuthGuard('jwt'))
export class PushTokensController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: RegisterPushTokenDto,
  ): Promise<ApiResponse<any>> {
    const token = await this.pushTokensService.register(req.user.id, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: token ? 'Push token registered' : 'Invalid Expo push token',
      data: token,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  async unregister(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { expoPushToken: string },
  ): Promise<ApiResponse<{ disabled: number }>> {
    const expoPushToken = (body?.expoPushToken ?? '').trim();
    const result = await this.pushTokensService.disableByToken(req.user.id, expoPushToken);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Push token disabled',
      data: { disabled: result.count },
      timestamp: new Date().toISOString(),
    };
  }
}

