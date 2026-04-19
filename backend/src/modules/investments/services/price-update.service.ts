import { Injectable, Logger } from '@nestjs/common';
import { PriceService } from './price.service';

@Injectable()
export class PriceUpdateService {
  private readonly logger = new Logger(PriceUpdateService.name);

  // Track which assets need price updates
  private trackedAssets = new Set<string>();
  private updateInterval: NodeJS.Timer | null = null;

  constructor(private priceService: PriceService) {
    this.startAutomaticUpdates();
  }

  /**
   * Start automatic price updates every 5 minutes
   */
  private startAutomaticUpdates(): void {
    this.updateInterval = setInterval(async () => {
      await this.updatePrices();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Register an asset for tracking
   */
  registerAsset(symbol: string, type: 'crypto' | 'stock'): void {
    this.trackedAssets.add(`${type}_${symbol}`);
  }

  /**
   * Update prices for all tracked assets
   */
  async updatePrices(): Promise<void> {
    if (this.trackedAssets.size === 0) return;

    try {
      for (const asset of this.trackedAssets) {
        const [type, symbol] = asset.split('_');
        await this.priceService.getPrice(symbol, type as 'crypto' | 'stock');
      }

      this.logger.debug(`Updated ${this.trackedAssets.size} asset prices`);
    } catch (error) {
      this.logger.error('Failed to update prices:', error);
    }
  }

  /**
   * Manually refresh price for an asset
   */
  async refreshPrice(symbol: string, type: 'crypto' | 'stock'): Promise<{ price: number; change24h: number; timestamp: string }> {
    const result = await this.priceService.getPrice(symbol, type);
    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
