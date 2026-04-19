import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateIncomeDto {
  @IsNumber()
  @Min(0)
  monthlyIncome!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

