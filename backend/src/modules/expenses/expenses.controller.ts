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
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDto } from './dto/expense.dto';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
}

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  /**
   * POST /expenses
   * Create a new expense
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<ApiResponse<ExpenseDto>> {
    // Validate amount
    if (!createExpenseDto.amount || createExpenseDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate category
    if (!createExpenseDto.category || !createExpenseDto.category.trim()) {
      throw new BadRequestException('Category is required');
    }

    const userId = req.user.id;
    const expense = await this.expensesService.create(userId, createExpenseDto);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Expense created successfully',
      data: expense,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /expenses
   * Get all expenses for authenticated user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<ExpenseDto[]>> {
    const userId = req.user.id;
    const expenses = await this.expensesService.findAll(userId);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Retrieved ${expenses.length} expenses`,
      data: expenses,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /expenses/summary
   * Get expense summary with budget analysis and alert levels
   * Returns total spending, remaining balance, percentage used, and alert status
   */
  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary(@Request() req: ExpressRequest & { user: { id: string } }): Promise<ApiResponse<{
    totalSpending: number;
    remaining: number;
    percentageUsed: number;
    alertLevel: string;
    expenseCount: number;
  }>> {
    const userId = req.user.id;
    const summary = await this.expensesService.getBudgetSummary(userId);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Budget summary with alerts retrieved successfully',
      data: {
        totalSpending: summary.totalSpending,
        remaining: summary.remaining,
        percentageUsed: summary.percentageUsed,
        alertLevel: summary.alertLevel,
        expenseCount: summary.currentMonthExpenseCount,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Request() req: ExpressRequest & { user: { id: string } }, @Param('id') id: string): Promise<ApiResponse<void>> {
    await this.expensesService.delete(req.user.id, id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Expense deleted successfully',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() payload: any
  ): Promise<ApiResponse<ExpenseDto>> {
    const expense = await this.expensesService.update(req.user.id, id, payload);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Expense updated successfully',
      data: expense,
      timestamp: new Date().toISOString(),
    };
  }
}
