import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OnboardingDto {
  @IsNumber()
  @Min(0)
  monthlyIncome!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNumber()
  @Min(0)
  savingsGoalInr!: number;

  @IsOptional()
  @IsString()
  targetDateIso?: string;

  @IsString()
  @IsIn(['planner', 'balanced', 'impulsive'])
  spendingStyle!: 'planner' | 'balanced' | 'impulsive';

  @IsString()
  @IsIn(['low', 'medium', 'high'])
  riskTolerance!: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsBoolean()
  wantsDailyDigest?: boolean;
}

