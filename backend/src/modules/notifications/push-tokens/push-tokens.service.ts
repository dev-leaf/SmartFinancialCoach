import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

function looksLikeExpoToken(token: string): boolean {
  // Common formats:
  // - ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
  // - ExpoPushToken[...]
  return /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token);
}

@Injectable()
export class PushTokensService {
  constructor(private prisma: PrismaService) {}

  async register(userId: string, dto: RegisterPushTokenDto) {
    const expoPushToken = dto.expoPushToken.trim();
    if (!looksLikeExpoToken(expoPushToken)) {
      // Store nothing; client can re-check token generation.
      return null;
    }

    return this.prisma.devicePushToken.upsert({
      where: { expoPushToken },
      update: {
        userId,
        platform: dto.platform,
        enabled: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        expoPushToken,
        platform: dto.platform,
        enabled: true,
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
        expoPushToken: true,
        platform: true,
        enabled: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async disableByToken(userId: string, expoPushToken: string) {
    return this.prisma.devicePushToken.updateMany({
      where: { userId, expoPushToken },
      data: { enabled: false },
    });
  }

  async listEnabledTokens(userId: string): Promise<string[]> {
    const rows = await this.prisma.devicePushToken.findMany({
      where: { userId, enabled: true },
      select: { expoPushToken: true },
    });
    return rows.map(r => r.expoPushToken);
  }

  async disableToken(expoPushToken: string): Promise<void> {
    await this.prisma.devicePushToken.updateMany({
      where: { expoPushToken },
      data: { enabled: false },
    });
  }
}

