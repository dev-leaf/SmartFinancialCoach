import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications.service';
import { ExpoPushGateway } from '../push-tokens/expo-push.gateway';

@Injectable()
export class DailyDigestService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private push: ExpoPushGateway,
  ) {}

  async runDailyDigest(): Promise<{ usersProcessed: number }> {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    let processed = 0;

    for (const u of users) {
      // respect user preference if present
      const habits = await this.prisma.userHabitsProfile.findUnique({ where: { userId: u.id } });
      if (habits && habits.wantsDailyDigest === false) continue;

      const unread = await this.notifications.getUnread(u.id);
      const title = 'Daily Summary';
      const message = unread.length > 0
        ? `You have ${unread.length} new update(s). Check your insights and alerts.`
        : 'Quick check-in: review your spending today and stay on budget.';

      await this.notifications.create({ userId: u.id, title, message, type: 'budget' });
      await this.push.sendToUser(u.id, { title, body: message, data: { type: 'daily_digest' } });

      processed++;
    }

    return { usersProcessed: processed };
  }
}

