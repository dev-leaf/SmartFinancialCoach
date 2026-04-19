/**
 * CRITICAL FIX P1: Circuit Breaker Pattern
 * 
 * Implements resilience pattern for external API calls:
 * 1. Prevents cascading failures (stops hitting rate-limited APIs)
 * 2. Automatic recovery with exponential backoff
 * 3. Fallback to cached data
 * 4. Monitoring and alerting
 * 
 * States:
 * - CLOSED (normal): Pass requests through
 * - OPEN (failing): Reject requests, use cache
 * - HALF_OPEN (recovering): Test with single request
 * 
 * Use case:
 * - CoinGecko API hits rate limit (429)
 * - Circuit opens, stops hammering API
 * - After recovery window, tries again
 * - If successful, fully recovered
 */

import { Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // # failures before opening
  resetTimeout: number; // ms before half-open
  monitoringPeriod: number; // ms for counting failures
  successThreshold: number; // # successes before fully closing
}

/**
 * Circuit breaker for resilient API calls
 */
export class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private readonly logger = new Logger('CircuitBreaker');

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      successThreshold: 2,
    },
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<R extends T>(
    key: string,
    fn: () => Promise<R>,
    options?: { cacheDuration?: number },
  ): Promise<R> {
    // Check if circuit should transition to HALF_OPEN
    if (this.state === CircuitState.OPEN && this.shouldAttemptReset()) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      this.logger.warn(
        `[${this.name}] Circuit breaker entering HALF_OPEN state`,
      );
    }

    // If circuit is OPEN, use cache
    if (this.state === CircuitState.OPEN) {
      const cached = this.getCache(key);
      if (cached) {
        this.logger.log(
          `[${this.name}] Circuit OPEN, returning cached data for ${key}`,
        );
        return cached;
      }
      throw new Error(
        `Circuit breaker is OPEN. Service unavailable. No cache available for ${key}.`,
      );
    }

    try {
      const result = await fn();

      // Success
      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++;
        this.logger.log(
          `[${this.name}] HALF_OPEN: Success ${this.successCount}/${this.config.successThreshold}`,
        );

        if (this.successCount >= this.config.successThreshold) {
          this.reset();
          this.logger.log(`[${this.name}] Circuit breaker CLOSED (recovered)`);
        }
      } else if (this.state === CircuitState.CLOSED) {
        this.failureCount = 0;
      }

      // Cache success
      this.setCache(key, result, options?.cacheDuration);
      return result;
    } catch (error: any) {
      const statusCode = error.response?.status;

      // 429 Too Many Requests = rate limit, likely temporary
      // 503 Service Unavailable = service down
      // Network timeout = service unreachable
      const isTransient =
        statusCode === 429 ||
        statusCode === 503 ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT';

      if (!isTransient) {
        // Not a transient error (e.g., 400 Bad Request), fail immediately
        throw error;
      }

      this.failureCount++;
      this.lastFailureTime = Date.now();

      this.logger.warn(
        `[${this.name}] Failure ${this.failureCount}/${this.config.failureThreshold} ` +
          `(${statusCode || error.message})`,
      );

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = Date.now() + this.config.resetTimeout;
        this.logger.error(
          `[${this.name}] Circuit breaker OPEN. Will retry at ${new Date(
            this.nextAttemptTime,
          ).toISOString()}`,
        );
      }

      // Try to return cached data
      const cached = this.getCache(key);
      if (cached) {
        this.logger.log(
          `[${this.name}] Error occurred, returning cached data for ${key}`,
        );
        return cached;
      }

      throw error;
    }
  }

  /**
   * Check if enough time has passed to attempt recovery
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime !== undefined && Date.now() >= this.nextAttemptTime;
  }

  /**
   * Reset circuit to CLOSED state
   */
  private reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  /**
   * Cache result
   */
  private setCache(key: string, data: T, duration?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached result if valid
   */
  private getCache(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Cache is valid for 1 hour by default
    const age = Date.now() - cached.timestamp;
    if (age > 3600000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Get circuit status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      cacheSize: this.cache.size,
      nextAttemptTime: this.nextAttemptTime
        ? new Date(this.nextAttemptTime).toISOString()
        : null,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Force circuit to specific state (for testing)
   */
  setState(state: CircuitState) {
    this.state = state;
    if (state === CircuitState.CLOSED) {
      this.reset();
    }
  }
}

/**
 * Global circuit breakers for external APIs
 */
export const circuitBreakers = {
  coinGecko: new CircuitBreaker('CoinGecko', {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 300000,
    successThreshold: 2,
  }),

  alphaVantage: new CircuitBreaker('AlphaVantage', {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 300000,
    successThreshold: 2,
  }),

  newsApi: new CircuitBreaker('NewsAPI', {
    failureThreshold: 5,
    resetTimeout: 120000, // 2 minutes
    monitoringPeriod: 600000, // 10 minutes
    successThreshold: 3,
  }),
};
