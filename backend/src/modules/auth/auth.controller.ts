import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

interface AuthResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

interface AuthReq {
  user: { id: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Register a new user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse<any>> {
    const result = await this.authService.register(registerDto);
    const refreshToken = this.authService.generateRefreshToken(result.user);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
      data: {
        ...result,
        refresh_token: refreshToken,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /auth/login
   * Login user and return JWT token
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse<any>> {
    const result = await this.authService.login(loginDto);
    const refreshToken = this.authService.generateRefreshToken(result.user);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: {
        ...result,
        refresh_token: refreshToken,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /auth/refresh
   * CRITICAL FIX P1: Refresh access token with token version validation
   * Prevents use of revoked refresh tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() { refresh_token }: { refresh_token: string }): Promise<AuthResponse<any>> {
    try {
      // Decode refresh token
      const decoded = await this.authService.validateToken(refresh_token);
      const user = await this.authService.getUserById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // CRITICAL FIX P1: Verify tokenVersion matches
      // If tokenVersion has incremented, refresh token is revoked
      if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user as any).tokenVersion) {
        throw new UnauthorizedException('Token has been revoked. Please login again.');
      }

      // Generate new access token
      const newAccessToken = this.authService.generateToken(user);
      
      // Generate rotated refresh token (with updated tokenVersion)
      const newRefreshToken = this.authService.generateRefreshToken(user);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        data: {
          user,
          access_token: newAccessToken,
          refresh_token: newRefreshToken, // New refresh token with rotation
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * POST /auth/logout
   * CRITICAL FIX P1: Logout and revoke all refresh tokens
   * Increments tokenVersion to invalidate all existing refresh tokens
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: AuthReq): Promise<AuthResponse<null>> {
    try {
      await this.authService.logout(req.user.id);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Logged out successfully. All tokens have been revoked.',
        data: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new UnauthorizedException('Logout failed');
    }
  }
}
