import { IsIn, IsString, MinLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @MinLength(10)
  expoPushToken!: string;

  @IsString()
  @IsIn(['ios', 'android', 'web', 'unknown'])
  platform!: 'ios' | 'android' | 'web' | 'unknown';
}

