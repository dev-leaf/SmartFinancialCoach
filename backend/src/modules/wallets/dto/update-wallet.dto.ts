import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
