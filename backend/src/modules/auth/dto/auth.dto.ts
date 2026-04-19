import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for user registration
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  name?: string;
}

/**
 * DTO for user login
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  password: string;
}
