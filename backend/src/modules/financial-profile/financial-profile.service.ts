import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class FinancialProfileService {
  constructor(private prisma: PrismaService) {}

  async getIncomeProfile(userId: string) {
    return this.prisma.incomeProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        monthlyIncome: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async upsertIncomeProfile(userId: string, dto: UpdateIncomeDto) {
    return this.prisma.incomeProfile.upsert({
      where: { userId },
      update: {
        monthlyIncome: dto.monthlyIncome,
        currency: dto.currency ?? undefined,
      },
      create: {
        userId,
        monthlyIncome: dto.monthlyIncome,
        currency: dto.currency ?? 'INR',
      },
      select: {
        id: true,
        userId: true,
        monthlyIncome: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

