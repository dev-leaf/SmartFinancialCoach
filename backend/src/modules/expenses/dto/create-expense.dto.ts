import { IsString, IsNumber, IsOptional, Min, Max, Length } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  amount: number;

  @IsString()
  @Length(1, 50)
  category: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;
}
