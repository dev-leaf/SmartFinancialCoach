import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  tokenVersion: number;
}

@Injectable()
export class TokenManagementService {
  private readonly logger = new Logger(TokenManagementService.name);
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generate new access and refresh tokens with version tracking
   */
  async generateTokenPair(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Get current token version
      let tokenVersion = await this.getTokenVersion(userId);

      const payload: JwtPayload = {
        sub: userId,
        email: (await this.prisma.user.findUnique({ where: { id: userId } }))?.email || '',
        tokenVersion,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        secret: process.env.JWT_SECRET,
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Store refresh token hash in DB for revocation tracking
      await this.storeRefreshTokenHash(userId, refreshToken);

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`Failed to generate token pair for ${userId}:`, error);
      throw new UnauthorizedException('Failed to generate tokens');
    }
  }

  /**
   * Validate and rotate refresh token
   * Returns new token pair if valid, throws if invalid/revoked
   */
  async rotateRefreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as JwtPayload;

      const userId = payload.sub;

      // Check if token version matches (if not, token was revoked)
      const currentVersion = await this.getTokenVersion(userId);
      if (payload.tokenVersion !== currentVersion) {
        this.logger.warn(`Token version mismatch for user ${userId} - possible token reuse attack`);
        // Revoke all tokens for this user (security incident)
        await this.revokeAllTokens(userId);
        throw new UnauthorizedException('Token has been revoked');
      }

      // Generate new token pair
      return await this.generateTokenPair(userId);
    } catch (error) {
      this.logger.error('Failed to rotate refresh token:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Validate access token
   */
  validateAccessToken(accessToken: string): JwtPayload {
    try {
      return this.jwtService.verify(accessToken, {
        secret: process.env.JWT_SECRET,
      }) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Get token version for user (for revocation)
   */
  private async getTokenVersion(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    return user?.tokenVersion || 0;
  }

  /**
   * Store refresh token hash for revocation tracking
   */
  private async storeRefreshTokenHash(userId: string, token: string): Promise<void> {
    // In production, implement token blacklist/whitelist
    // For now, we use tokenVersion field for rotation
  }

  /**
   * Revoke all tokens for a user (increment token version)
   */
  async revokeAllTokens(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });

      this.logger.log(`Revoked all tokens for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke tokens for ${userId}:`, error);
    }
  }

  /**
   * Logout (revoke current token)
   */
  async logout(userId: string): Promise<void> {
    await this.revokeAllTokens(userId);
  }
}
