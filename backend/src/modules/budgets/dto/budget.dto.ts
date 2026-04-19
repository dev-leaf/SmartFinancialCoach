/**
 * Budget response DTO
 */
export class BudgetDto {
  id: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
