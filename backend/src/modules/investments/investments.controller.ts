import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { RichInvestmentDto, PortfolioSummaryDto } from './investments.service';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

type AuthReq = ExpressRequest & { user: { id: string } };

@Controller('investments')
@UseGuards(AuthGuard('jwt'))
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // POST /investments
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: AuthReq,
    @Body() dto: CreateInvestmentDto,
  ): Promise<ApiResponse<RichInvestmentDto>> {
    const investment = await this.investmentsService.create(req.user.id, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Investment created with live price',
      data: investment,
      timestamp: new Date().toISOString(),
    };
  }

  // GET /investments  — returns investments enriched with live prices
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() req: AuthReq,
  ): Promise<ApiResponse<RichInvestmentDto[]>> {
    const investments = await this.investmentsService.findAll(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `${investments.length} investments with live prices`,
      data: investments,
      timestamp: new Date().toISOString(),
    };
  }

  // GET /investments/summary/portfolio
  @Get('summary/portfolio')
  @HttpCode(HttpStatus.OK)
  async getPortfolioSummary(
    @Request() req: AuthReq,
  ): Promise<ApiResponse<PortfolioSummaryDto>> {
    const summary = await this.investmentsService.getPortfolioSummary(req.user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Portfolio summary with live P&L',
      data: summary,
      timestamp: new Date().toISOString(),
    };
  }

  // GET /investments/:id
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Request() req: AuthReq,
    @Param('id') id: string,
  ): Promise<ApiResponse<RichInvestmentDto | null>> {
    const investment = await this.investmentsService.findById(req.user.id, id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Investment retrieved',
      data: investment,
      timestamp: new Date().toISOString(),
    };
  }

  // PUT /investments/:id
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: AuthReq,
    @Param('id') id: string,
    @Body() dto: Partial<CreateInvestmentDto>,
  ): Promise<ApiResponse<RichInvestmentDto>> {
    const investment = await this.investmentsService.update(req.user.id, id, dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Investment updated',
      data: investment,
      timestamp: new Date().toISOString(),
    };
  }

  // DELETE /investments/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Request() req: AuthReq,
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.investmentsService.delete(req.user.id, id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Investment deleted',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
