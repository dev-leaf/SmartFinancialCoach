import { IsString, IsNumber, IsOptional, Min, Length, IsEnum } from 'class-validator';

export class CreateInvestmentDto {
  @IsString()
  @Length(1, 100)
  assetName: string; // "Apple Stock", "Bitcoin", etc

  @IsOptional()
  @IsString()
  assetSymbol?: string; // "AAPL", "BTC"

  @IsEnum(['stock', 'crypto', 'mutual_fund', 'commodity'])
  type: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  buyPrice: number;

  @IsOptional()
  @IsString()
  currency?: string; // Default "INR"

  @IsOptional()
  purchaseDate?: string; // ISO date string
}
