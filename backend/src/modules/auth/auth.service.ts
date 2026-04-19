import {  Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tokenVersion?: number; // CRITICAL FIX P1: For refresh token rotation
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param registerDto - Registration data (email, password, name)
   * @returns User object with access token
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
    });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token: token,
    };
  }

  /**
   * Login user
   * @param loginDto - Login data (email, password)
   * @returns User object with access token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token: token,
    };
  }

  /**
   * Validate JWT token and extract user
   * @param token - JWT token
   * @returns Decoded token payload
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token for user
   * @param user - User object
   * @returns JWT token
   */
  generateToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '15m', // Short-lived access token
    });
  }

  /**
   * Generate refresh token (long-lived) with token version
   * CRITICAL FIX P1: Include tokenVersion for rotation/revocation
   * @param user - User object with tokenVersion
   * @returns Refresh token with version embedded
   */
  generateRefreshToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion || 0, // CRITICAL: Include for validation
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d', // Long-lived refresh token
    });
  }

  /**
   * CRITICAL FIX P1: Logout and revoke all tokens
   * Increments tokenVersion to invalidate refresh tokens
   */
  async logout(userId: string): Promise<void> {
    try {
      // Increment tokenVersion to invalidate all existing refresh tokens
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tokenVersion: {
            increment: 1, // This invalidates all old refresh tokens
          },
        },
      });
    } catch (error) {
      throw new Error('Logout failed');
    }
  }

  /**
   * Get user by ID with tokenVersion for token rotation
   * @param userId - User ID
   * @returns User object with tokenVersion
   */
  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tokenVersion: true, // Include for token rotation validation
        createdAt: true,
      },
    });
  }
}
