import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceResult {
  symbol: string;
  price: number;         // price in INR
  currency: 'INR';
  change24h: number;     // % change in last 24 h
  lastUpdated: Date;
  cached: boolean;       // true → value came from cache (API was unavailable)
}

interface CacheEntry {
  price: number;
  change24h: number;
  timestamp: number;
}

interface CoinGeckoResponse {
  [coinId: string]: {
    inr: number;
    inr_24h_change: number;
  };
}

interface AlphaVantageQuote {
  '05. price': string;
  '10. change percent': string;
}

interface AlphaVantageResponse {
  'Global Quote'?: AlphaVantageQuote;
  Note?: string;           // rate-limit note
  Information?: string;    // another rate-limit key
}

// ─── Symbol maps ──────────────────────────────────────────────────────────────

const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  DOGE: 'dogecoin',
  BNB:  'binancecoin',
  XRP:  'ripple',
  ADA:  'cardano',
  SOL:  'solana',
  USDT: 'tether',
  USDC: 'usd-coin',
  LTC:  'litecoin',
  MATIC:'matic-network',
  DOT:  'polkadot',
  AVAX: 'avalanche-2',
  SHIB: 'shiba-inu',
  LINK: 'chainlink',
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly cache = new Map<string, CacheEntry>();

  /** TTL in milliseconds – 60 s for live calls, configurable */
  private readonly CACHE_TTL_MS = 60 * 1000;

  private readonly http: AxiosInstance;
  private readonly coinGeckoBase = 'https://api.coingecko.com/api/v3';
  private readonly alphaVantageBase = 'https://www.alphavantage.co/query';
  private readonly alphaVantageKey: string;

  constructor() {
    this.http = axios.create({ timeout: 10_000 });
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY ?? '';
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Auto-detect asset type and return normalized PriceResult in INR.
   */
  async getPrice(
    symbol: string,
    type?: 'crypto' | 'stock' | 'mutual_fund' | 'commodity',
  ): Promise<PriceResult> {
    const upper = symbol.toUpperCase();
    const resolvedType =
      type ??
      (CRYPTO_SYMBOL_MAP[upper] ? 'crypto' : 'stock');

    if (resolvedType === 'crypto') {
      return this.getCryptoPrice(upper);
    }
    return this.getStockPrice(upper);
  }

  /**
   * Fetch crypto price from CoinGecko in INR.
   */
  async getCryptoPrice(symbol: string): Promise<PriceResult> {
    const upper = symbol.toUpperCase();
    const cacheKey = `crypto_${upper}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.toResult(upper, cached, true);
    }

    const coinId = CRYPTO_SYMBOL_MAP[upper];
    if (!coinId) {
      this.logger.warn(`Unknown crypto symbol: ${upper}`);
      return this.zeroResult(upper);
    }

    try {
      const { data } = await this.http.get<CoinGeckoResponse>(
        `${this.coinGeckoBase}/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: 'inr',
            include_24hr_change: 'true',
          },
        },
      );

      const row = data[coinId];
      if (!row?.inr) {
        this.logger.warn(`CoinGecko returned no INR price for ${coinId}`);
        return this.zeroResult(upper);
      }

      const entry: CacheEntry = {
        price: row.inr,
        change24h: row.inr_24h_change ?? 0,
        timestamp: Date.now(),
      };
      this.cache.set(cacheKey, entry);
      this.logger.log(`[CoinGecko] ${upper}: ₹${entry.price.toFixed(2)} (${entry.change24h.toFixed(2)}%)`);
      return this.toResult(upper, entry, false);
    } catch (err: any) {
      this.logger.error(`CoinGecko error for ${upper}: ${err.message}`);
      // Fall back to last cached value, even if expired
      const stale = this.cache.get(cacheKey);
      if (stale) return this.toResult(upper, stale, true);
      return this.zeroResult(upper);
    }
  }

  /**
   * Fetch stock price from Alpha Vantage.
   * Alpha Vantage returns USD; we convert to INR using a fixed approximate rate
   * (or you can add a dedicated FX endpoint call).
   */
  async getStockPrice(symbol: string): Promise<PriceResult> {
    const upper = symbol.toUpperCase();
    const cacheKey = `stock_${upper}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.toResult(upper, cached, true);
    }

    if (!this.alphaVantageKey) {
      this.logger.warn('ALPHA_VANTAGE_API_KEY is not configured. Stock prices will be unavailable.');
      return this.zeroResult(upper);
    }

    try {
      const { data } = await this.http.get<AlphaVantageResponse>(
        this.alphaVantageBase,
        {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: upper,
            apikey: this.alphaVantageKey,
          },
        },
      );

      // Detect rate-limit messages
      if (data.Note || data.Information) {
        this.logger.warn(`Alpha Vantage rate-limit hit for ${upper}. Using cache.`);
        const stale = this.cache.get(cacheKey);
        if (stale) return this.toResult(upper, stale, true);
        return this.zeroResult(upper);
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        this.logger.warn(`No Alpha Vantage quote for ${upper}`);
        return this.zeroResult(upper);
      }

      const priceUsd = parseFloat(quote['05. price']);
      const changePercent = parseFloat(
        (quote['10. change percent'] ?? '0%').replace('%', ''),
      );

      // Convert USD → INR (approximate; replace with live FX if needed)
      const USD_TO_INR = parseFloat(process.env.USD_TO_INR_RATE ?? '83.5');
      const priceInr = priceUsd * USD_TO_INR;

      const entry: CacheEntry = {
        price: priceInr,
        change24h: changePercent,
        timestamp: Date.now(),
      };
      this.cache.set(cacheKey, entry);
      this.logger.log(`[AlphaVantage] ${upper}: ₹${priceInr.toFixed(2)} (${changePercent.toFixed(2)}%)`);
      return this.toResult(upper, entry, false);
    } catch (err: any) {
      this.logger.error(`Alpha Vantage error for ${upper}: ${err.message}`);
      const stale = this.cache.get(cacheKey);
      if (stale) return this.toResult(upper, stale, true);
      return this.zeroResult(upper);
    }
  }

  /**
   * Batch-fetch multiple crypto prices in one CoinGecko call (efficient).
   */
  async getBatchCryptoPrices(
    symbols: string[],
  ): Promise<Record<string, PriceResult>> {
    const results: Record<string, PriceResult> = {};
    const toFetch: string[] = [];

    for (const sym of symbols) {
      const upper = sym.toUpperCase();
      const cacheKey = `crypto_${upper}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        results[upper] = this.toResult(upper, cached, true);
      } else {
        toFetch.push(upper);
      }
    }

    if (toFetch.length === 0) return results;

    const ids = toFetch
      .map((s) => CRYPTO_SYMBOL_MAP[s])
      .filter(Boolean)
      .join(',');

    if (!ids) return results;

    try {
      const { data } = await this.http.get<CoinGeckoResponse>(
        `${this.coinGeckoBase}/simple/price`,
        {
          params: {
            ids,
            vs_currencies: 'inr',
            include_24hr_change: 'true',
          },
        },
      );

      for (const sym of toFetch) {
        const coinId = CRYPTO_SYMBOL_MAP[sym];
        if (!coinId) continue;
        const row = data[coinId];
        if (!row?.inr) continue;
        const entry: CacheEntry = {
          price: row.inr,
          change24h: row.inr_24h_change ?? 0,
          timestamp: Date.now(),
        };
        this.cache.set(`crypto_${sym}`, entry);
        results[sym] = this.toResult(sym, entry, false);
      }
    } catch (err: any) {
      this.logger.error(`Batch crypto fetch failed: ${err.message}`);
    }

    return results;
  }

  /** Clear the entire price cache (for testing / manual refresh). */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Price cache cleared');
  }

  /** Return cache stats for monitoring endpoint. */
  getCacheStats() {
    const entries: any[] = [];
    this.cache.forEach((v, k) => {
      entries.push({ key: k, price: v.price, ageMs: Date.now() - v.timestamp });
    });
    return { count: this.cache.size, ttlMs: this.CACHE_TTL_MS, entries };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp < this.CACHE_TTL_MS) return entry;
    return null; // expired but left in map as fallback stale value
  }

  private toResult(symbol: string, entry: CacheEntry, cached: boolean): PriceResult {
    return {
      symbol,
      price: entry.price,
      currency: 'INR',
      change24h: entry.change24h,
      lastUpdated: new Date(entry.timestamp),
      cached,
    };
  }

  private zeroResult(symbol: string): PriceResult {
    return {
      symbol,
      price: 0,
      currency: 'INR',
      change24h: 0,
      lastUpdated: new Date(),
      cached: false,
    };
  }
}
