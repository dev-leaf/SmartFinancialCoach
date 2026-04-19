import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDto } from './dto/expense.dto';
import { PrismaService } from '../database/prisma.service';
import { BudgetsService } from '../budgets/budgets.service';

export type AlertLevel = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';

interface BudgetSummary {
  totalSpending: number;
  monthlyBudget: number;
  remaining: number;
  percentageUsed: number;
  alertLevel: AlertLevel;
  expenseCount: number;
  currentMonthExpenseCount: number;
}

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private budgetsService: BudgetsService,
  ) {}

  async create(userId: string, createExpenseDto: any): Promise<ExpenseDto> {
    const expense = await this.prisma.$transaction(async (tx) => {
      // SECURITY: If walletId provided, verify ownership BEFORE creating expense
      if (createExpenseDto.walletId) {
        const wallet = await tx.wallet.findUnique({
          where: { id: createExpenseDto.walletId },
        });

        if (!wallet) {
          throw new NotFoundException('Wallet not found');
        }

        // CRITICAL: Verify wallet belongs to this user
        if (wallet.userId !== userId) {
          throw new NotFoundException('Wallet not found');
        }

        // Optional: Check wallet has sufficient balance
        if (wallet.balance < createExpenseDto.amount) {
          throw new NotFoundException('Insufficient wallet balance');
        }
      }

      // 1. Create expense
      const newExpense = await tx.expense.create({
        data: {
          amount: createExpenseDto.amount,
          category: createExpenseDto.category,
          description: createExpenseDto.description || undefined,
          date: new Date(),
          userId: userId,
          walletId: createExpenseDto.walletId || null,
          currency: createExpenseDto.currency || 'INR',
        },
      });

      // 2. Deduct from wallet if walletId provided
      if (createExpenseDto.walletId) {
        await tx.wallet.update({
          where: { id: createExpenseDto.walletId },
          data: { balance: { decrement: createExpenseDto.amount } }
        });
      }
      return newExpense;
    });

    return this.mapToExpenseDto(expense);
  }

  async findAll(userId: string): Promise<ExpenseDto[]> {
    const expenses = await this.prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { wallet: true }
    });

    return expenses.map(e => this.mapToExpenseDto(e));
  }

  async findById(userId: string, id: string): Promise<ExpenseDto | null> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { wallet: true }
    });

    if (expense && expense.userId !== userId) {
      return null;
    }

    return expense ? this.mapToExpenseDto(expense) : null;
  }

  async update(userId: string, id: string, payload: any): Promise<ExpenseDto> {
    // CRITICAL: Verify ownership BEFORE update to prevent cross-user access
    const expense = await this.prisma.expense.findUnique({ 
      where: { id },
      include: { wallet: true }
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // SECURITY: Ensure the expense belongs to this user
    if (expense.userId !== userId) {
      throw new NotFoundException('Expense not found');
    }

    // Whitelist updatable fields - prevent userId/walletId changes (ownership change)
    const safePayload: Record<string, any> = {};

    if (payload.amount !== undefined) {
      if (payload.amount <= 0) {
        throw new NotFoundException('Amount must be greater than 0');
      }
      safePayload.amount = payload.amount;
    }

    if (payload.category !== undefined) {
      if (!payload.category || !String(payload.category).trim()) {
        throw new NotFoundException('Category is required');
      }
      safePayload.category = payload.category;
    }

    if (payload.description !== undefined) {
      safePayload.description = payload.description;
    }

    if (payload.date !== undefined) {
      safePayload.date = new Date(payload.date);
    }

    // walletId and userId intentionally NOT updatable (prevent ownership/wallet changes)

    // Update safely with ownership verified
    const updated = await this.prisma.expense.update({
      where: { id },
      data: safePayload,
      include: { wallet: true }
    });

    return this.mapToExpenseDto(updated);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({ where: { id, userId } });
      if (!expense) throw new NotFoundException('Expense not found');

      if (expense.walletId) {
        await tx.wallet.update({
          where: { id: expense.walletId },
          data: { balance: { increment: expense.amount } }
        });
      }

      await tx.expense.delete({ where: { id, userId } });
    });
  }

  async getCurrentMonthExpenses(userId: string): Promise<ExpenseDto[]> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: firstDay, lte: lastDay },
      },
      orderBy: { date: 'desc' },
    });

    return expenses.map(e => this.mapToExpenseDto(e));
  }

  async getCurrentMonthTotal(userId: string): Promise<number> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        date: { gte: firstDay, lte: lastDay },
      },
    });

    return result._sum.amount || 0;
  }

  private calculateAlertLevel(percentageUsed: number): AlertLevel {
    if (percentageUsed < 50) return 'SAFE';
    if (percentageUsed < 80) return 'CAUTION';
    if (percentageUsed < 100) return 'WARNING';
    return 'DANGER';
  }

  async getBudgetSummary(userId: string): Promise<BudgetSummary> {
    const monthlyTotal = await this.getCurrentMonthTotal(userId);
    const currentMonthExpenses = await this.getCurrentMonthExpenses(userId);
    const monthlyBudget = await this.budgetsService.getCurrentMonthBudgetAmount(userId);

    const remaining = monthlyBudget - monthlyTotal;
    const percentageUsed = monthlyBudget > 0
      ? Math.round((monthlyTotal / monthlyBudget) * 10000) / 100
      : 0;

    const alertLevel = this.calculateAlertLevel(percentageUsed);
    const allExpenses = await this.findAll(userId);

    return {
      totalSpending: monthlyTotal,
      monthlyBudget: monthlyBudget,
      remaining: remaining > 0 ? remaining : 0,
      percentageUsed,
      alertLevel,
      expenseCount: allExpenses.length,
      currentMonthExpenseCount: currentMonthExpenses.length,
    };
  }

  private mapToExpenseDto(expense: any): ExpenseDto {
    return {
      ...expense,
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      createdAt: expense.createdAt,
    };
  }
}
