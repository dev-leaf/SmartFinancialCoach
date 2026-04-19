import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PushTokensService } from './push-tokens.service';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
};

@Injectable()
export class ExpoPushGateway {
  private readonly logger = new Logger(ExpoPushGateway.name);
  private readonly url = 'https://exp.host/--/api/v2/push/send';

  constructor(private readonly pushTokensService: PushTokensService) {}

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, any> },
  ): Promise<void> {
    const tokens = await this.pushTokensService.listEnabledTokens(userId);
    if (tokens.length === 0) return;

    // Expo supports batching; keep requests small-ish.
    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: 'default',
      priority: 'high',
    }));

    const chunkSize = 50;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await this.sendChunk(chunk);
    }
  }

  private async sendChunk(messages: ExpoPushMessage[]): Promise<void> {
    try {
      const { data } = await axios.post(
        this.url,
        messages,
        { timeout: 10_000, headers: { 'Content-Type': 'application/json' } },
      );

      const tickets: any[] = data?.data ?? [];
      for (let idx = 0; idx < tickets.length; idx++) {
        const t = tickets[idx];
        if (t?.status === 'error') {
          const token = messages[idx]?.to;
          const details = t?.details;
          this.logger.warn(`Expo ticket error for token=${token}: ${t?.message ?? 'unknown'}`);

          // Disable unregistered tokens to stop retry loops.
          if (token && (details?.error === 'DeviceNotRegistered' || details?.error === 'InvalidCredentials')) {
            await this.pushTokensService.disableToken(token);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Expo push send failed: ${err?.message ?? err}`);
    }
  }
}

