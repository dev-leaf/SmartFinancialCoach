import { IsString, IsNumber, IsOptional, IsBoolean, Min, Length } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsString()
  @Length(1, 20)
  type: string; // 'cash', 'bank', 'digital'

  @IsNumber()
  @Min(0)
  balance?: number;

  @IsString()
  @Length(3, 3)
  currency?: string; // ISO code like 'INR', 'USD'

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
