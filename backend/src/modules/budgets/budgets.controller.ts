import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetDto } from './dto/budget.dto';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('budgets')
@UseGuards(AuthGuard('jwt'))
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  /**
   * POST /budgets
   * Set or update the monthly budget for authenticated user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async setMonthlyBudget(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() createBudgetDto: CreateBudgetDto,
  ): Promise<ApiResponse<BudgetDto>> {
    // Validate amount
    if (!createBudgetDto.amount || createBudgetDto.amount <= 0) {
      throw new BadRequestException('Budget amount must be greater than 0');
    }

    const userId = req.user.id;
    const budget = await this.budgetsService.setMonthlyBudget(userId, createBudgetDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: `Monthly budget set to $${budget.amount} for ${budget.month}/${budget.year}`,
      data: budget,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /budgets
   * Get the current month's budget for authenticated user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMonthlyBudget(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<BudgetDto | { message: string }>> {
    const userId = req.user.id;
    const budget = await this.budgetsService.getCurrentMonthBudget(userId);

    if (!budget) {
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'No budget set for current month. Using default: $10,000',
        data: { message: 'No budget set. Default budget of $10,000 will be used.' },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Current month budget retrieved`,
      data: budget,
      timestamp: new Date().toISOString(),
    };
  }
}
