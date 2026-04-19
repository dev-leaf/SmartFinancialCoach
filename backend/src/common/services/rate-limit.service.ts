import { Injectable } from '@nestjs/common';

// Simple in-memory rate limiter implementation
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitService {
  private limiters: Map<string, Map<string, RateLimitEntry>> = new Map();

  private getOrCreateLimiter(key: string, pointsPerWindow: number, windowMs: number): Map<string, RateLimitEntry> {
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new Map());
    }
    return this.limiters.get(key)!;
  }

  /**
   * Check rate limit for a specific key (IP, user ID, etc)
   */
  async checkLimit(key: string, limiterType: string = 'default'): Promise<boolean> {
    let pointsPerWindow = 100;
    let windowMs = 15 * 60 * 1000; // 15 minutes

    if (limiterType === 'auth') {
      pointsPerWindow = 5; // 5 login attempts
      windowMs = 15 * 60 * 1000; // per 15 minutes
    } else if (limiterType === 'api') {
      pointsPerWindow = 1000; // 1000 requests
      windowMs = 60 * 1000; // per minute
    }

    const limiter = this.getOrCreateLimiter(`${limiterType}_${key}`, pointsPerWindow, windowMs);
    const now = Date.now();
    const entry = limiter.get(key) || { count: 0, resetTime: now + windowMs };

    // Check if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    // Increment counter
    entry.count++;
    limiter.set(key, entry);

    return entry.count <= pointsPerWindow;
  }

  /**
   * Get remaining requests for a key
   */
  async getRemaining(key: string, limiterType: string = 'default'): Promise<number> {
    let pointsPerWindow = 100;

    if (limiterType === 'auth') {
      pointsPerWindow = 5;
    } else if (limiterType === 'api') {
      pointsPerWindow = 1000;
    }

    const limiter = this.getOrCreateLimiter(`${limiterType}_${key}`, pointsPerWindow, 15 * 60 * 1000);
    const entry = limiter.get(key);

    if (!entry) {
      return pointsPerWindow;
    }

    return Math.max(0, pointsPerWindow - entry.count);
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string, limiterType: string = 'default'): Promise<void> {
    const limiter = this.limiters.get(`${limiterType}_${key}`);
    if (limiter) {
      limiter.delete(key);
    }
  }
}
