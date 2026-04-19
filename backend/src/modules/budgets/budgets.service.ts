import { Injectable } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetDto } from './dto/budget.dto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Set or update the budget for the current month for authenticated user
   * If a budget exists for this month, update it. Otherwise, create a new one.
   * @param userId - User ID from JWT token
   * @param createBudgetDto - Budget amount
   * @returns Created or updated budget
   */
  async setMonthlyBudget(userId: string, createBudgetDto: CreateBudgetDto): Promise<BudgetDto> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Find existing budget for this month
    const existingBudget = await this.prisma.budget.findFirst({
      where: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    let budget;

    if (existingBudget) {
      // Update existing budget
      budget = await this.prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount: createBudgetDto.amount },
      });
    } else {
      // Create new budget
      budget = await this.prisma.budget.create({
        data: {
          amount: createBudgetDto.amount,
          month: currentMonth,
          year: currentYear,
          userId,
        },
      });
    }

    return this.mapToBudgetDto(budget);
  }

  /**
   * Get the budget for the current month for authenticated user
   * @param userId - User ID from JWT token
   * @returns Budget for current month or null if not set
   */
  async getCurrentMonthBudget(userId: string): Promise<BudgetDto | null> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Find budget for current month + year
    const budget = await this.prisma.budget.findFirst({
      where: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    return budget ? this.mapToBudgetDto(budget) : null;
  }

  /**
   * Get the budget amount for the current month for authenticated user
   * @param userId - User ID from JWT token
   * @returns Budget amount or default 10000 if not set
   */
  async getCurrentMonthBudgetAmount(userId: string): Promise<number> {
    const budget = await this.getCurrentMonthBudget(userId);
    return budget ? budget.amount : 10000; // Default budget if not set
  }

  /**
   * Get all budgets for the authenticated user
   * @param userId - User ID from JWT token
   * @returns Array of all user's budgets
   */
  async getAllBudgets(userId: string): Promise<BudgetDto[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map(b => this.mapToBudgetDto(b));
  }

  /**
   * Helper: Map Prisma Budget to BudgetDto
   */
  private mapToBudgetDto(budget: any): BudgetDto {
    return {
      id: budget.id,
      userId: budget.userId,
      month: budget.month,
      year: budget.year,
      amount: budget.amount,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }
}
