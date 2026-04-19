import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

function randomCode(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referralCode.findFirst({ where: { inviterUserId: userId } });
    if (existing) return existing;

    for (let i = 0; i < 5; i++) {
      const code = randomCode(8);
      try {
        return await this.prisma.referralCode.create({
          data: { inviterUserId: userId, code },
        });
      } catch (_) {
        // retry on collision
      }
    }
    throw new Error('Unable to generate referral code');
  }

  async redeem(inviteeUserId: string, code: string) {
    const normalized = code.trim().toUpperCase();
    const ref = await this.prisma.referralCode.findUnique({ where: { code: normalized } });
    if (!ref) return { ok: false, reason: 'invalid_code' as const };
    if (ref.inviterUserId === inviteeUserId) return { ok: false, reason: 'self_redeem' as const };

    const rewardedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.referralRedemption.create({
      data: {
        code: normalized,
        inviterUserId: ref.inviterUserId,
        inviteeUserId,
        rewardedUntil,
      },
    });

    // Grant invitee Premium for 7 days (extend if already premium/pro)
    const existingSub = await this.prisma.userSubscription.findUnique({ where: { userId: inviteeUserId } });
    const expiresAt = existingSub?.expiresAt && existingSub.expiresAt > rewardedUntil ? existingSub.expiresAt : rewardedUntil;

    await this.prisma.userSubscription.upsert({
      where: { userId: inviteeUserId },
      update: { tier: 'premium', isActive: true, expiresAt },
      create: { userId: inviteeUserId, tier: 'premium', isActive: true, expiresAt },
    });

    return { ok: true, rewardedUntil };
  }
}

