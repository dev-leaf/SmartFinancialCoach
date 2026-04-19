import { Body, Controller, Get, HttpCode, HttpStatus, Put, Request, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { FinancialProfileService } from './financial-profile.service';
import { UpdateIncomeDto } from './dto/update-income.dto';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('financial-profile')
@UseGuards(AuthGuard('jwt'))
export class FinancialProfileController {
  constructor(private readonly financialProfileService: FinancialProfileService) {}

  @Get('income')
  @HttpCode(HttpStatus.OK)
  async getIncome(
    @Request() req: ExpressRequest & { user: { id: string } },
  ): Promise<ApiResponse<any>> {
    const income = await this.financialProfileService.getIncomeProfile(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: income ? 'Income profile retrieved' : 'Income profile not set',
      data: income,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('income')
  @HttpCode(HttpStatus.OK)
  async upsertIncome(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: UpdateIncomeDto,
  ): Promise<ApiResponse<any>> {
    const income = await this.financialProfileService.upsertIncomeProfile(req.user.id, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Income profile updated',
      data: income,
      timestamp: new Date().toISOString(),
    };
  }
}

