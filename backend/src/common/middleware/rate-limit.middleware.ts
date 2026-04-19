import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private rateLimitService: RateLimitService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Get client IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Determine limiter type based on route
    let limiterType = 'api';
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
      limiterType = 'auth';
    }

    // Check rate limit
    const isAllowed = await this.rateLimitService.checkLimit(clientIp, limiterType);

    // Get remaining requests
    const remaining = await this.rateLimitService.getRemaining(clientIp, limiterType);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (!isAllowed) {
      throw new HttpException('Too many requests, please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
