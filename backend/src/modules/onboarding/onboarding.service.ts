import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, dto: OnboardingDto) {
    const targetDate = dto.targetDateIso ? new Date(dto.targetDateIso) : null;

    const [income, goal, habits] = await Promise.all([
      this.prisma.incomeProfile.upsert({
        where: { userId },
        update: { monthlyIncome: dto.monthlyIncome, currency: dto.currency ?? undefined },
        create: { userId, monthlyIncome: dto.monthlyIncome, currency: dto.currency ?? 'INR' },
      }),
      this.prisma.userGoal.upsert({
        where: { userId },
        update: { savingsGoalInr: dto.savingsGoalInr, targetDate: targetDate ?? undefined },
        create: { userId, savingsGoalInr: dto.savingsGoalInr, targetDate },
      }),
      this.prisma.userHabitsProfile.upsert({
        where: { userId },
        update: {
          spendingStyle: dto.spendingStyle,
          riskTolerance: dto.riskTolerance,
          wantsDailyDigest: dto.wantsDailyDigest ?? true,
        },
        create: {
          userId,
          spendingStyle: dto.spendingStyle,
          riskTolerance: dto.riskTolerance,
          wantsDailyDigest: dto.wantsDailyDigest ?? true,
        },
      }),
    ]);

    return { income, goal, habits };
  }
}

