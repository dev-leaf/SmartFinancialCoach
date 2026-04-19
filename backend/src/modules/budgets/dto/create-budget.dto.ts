import { IsNumber, Min, Max } from 'class-validator';

/**
 * DTO for creating or updating a budget
 */
export class CreateBudgetDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a valid number' })
  @Min(0.01, { message: 'Budget amount must be at least $0.01' })
  @Max(999999.99, { message: 'Budget amount cannot exceed $999,999.99' })
  amount: number;
}
