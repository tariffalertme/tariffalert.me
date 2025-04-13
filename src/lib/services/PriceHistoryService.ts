import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../types/database';
import { Logger } from '../../../lib/utils/logger';
import { PostgrestError } from '@supabase/supabase-js';

interface PriceHistoryData {
  date: Date;
  price: number;
  currency: string;
  retailer: string;
}

interface PriceStatistics {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceChange: number;
  priceChangePercentage: number;
}

export class PriceHistoryService {
  private readonly logger: Logger;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    loggerName = 'PriceHistoryService'
  ) {
    this.logger = new Logger(loggerName);
  }

  /**
   * Record a new price point for a product
   */
  public async recordPrice(
    productId: string,
    price: number,
    currency: string,
    retailer: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('price_history')
        .insert({
          product_id: productId,
          price,
          currency,
          retailer,
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Failed to record price:', {
        error: errorMessage,
        productId,
        price,
        currency,
        retailer
      });
      throw new Error(`Failed to record price: ${errorMessage}`);
    }
  }

  /**
   * Get price history for a product with optional filtering
   */
  public async getPriceHistory(
    productId: string,
    options: {
      days?: number;
      retailer?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<PriceHistoryData[]> {
    try {
      let query = this.supabase
        .from('price_history')
        .select('recorded_at, price, currency, retailer')
        .eq('product_id', productId)
        .order('recorded_at', { ascending: true });

      if (options.days) {
        query = query.gte(
          'recorded_at',
          new Date(Date.now() - options.days * 24 * 60 * 60 * 1000).toISOString()
        );
      }

      if (options.retailer) {
        query = query.eq('retailer', options.retailer);
      }

      if (options.startDate) {
        query = query.gte('recorded_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('recorded_at', options.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(record => ({
        date: new Date(record.recorded_at),
        price: record.price,
        currency: record.currency,
        retailer: record.retailer
      }));
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Failed to get price history:', {
        error: errorMessage,
        productId,
        options
      });
      throw new Error(`Failed to get price history: ${errorMessage}`);
    }
  }

  /**
   * Calculate price statistics for a product
   */
  public async getPriceStatistics(
    productId: string,
    days: number = 30
  ): Promise<PriceStatistics> {
    try {
      const priceHistory = await this.getPriceHistory(productId, { days });

      if (priceHistory.length === 0) {
        throw new Error('No price history available');
      }

      const prices = priceHistory.map(record => record.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Calculate price change from oldest to newest
      const oldestPrice = priceHistory[0].price;
      const newestPrice = priceHistory[priceHistory.length - 1].price;
      const priceChange = newestPrice - oldestPrice;
      const priceChangePercentage = (priceChange / oldestPrice) * 100;

      return {
        minPrice,
        maxPrice,
        avgPrice,
        priceChange,
        priceChangePercentage
      };
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Failed to calculate price statistics:', {
        error: errorMessage,
        productId,
        days
      });
      throw new Error(`Failed to calculate price statistics: ${errorMessage}`);
    }
  }

  /**
   * Get aggregated price data for multiple retailers
   */
  public async getRetailerPriceComparison(
    productId: string,
    days: number = 30
  ): Promise<Record<string, PriceStatistics>> {
    try {
      const priceHistory = await this.getPriceHistory(productId, { days });
      const retailers = Array.from(new Set(priceHistory.map(record => record.retailer)));

      const result: Record<string, PriceStatistics> = {};

      for (const retailer of retailers) {
        const retailerPrices = priceHistory
          .filter(record => record.retailer === retailer)
          .map(record => record.price);

        const minPrice = Math.min(...retailerPrices);
        const maxPrice = Math.max(...retailerPrices);
        const avgPrice = retailerPrices.reduce((a, b) => a + b, 0) / retailerPrices.length;

        const oldestPrice = retailerPrices[0];
        const newestPrice = retailerPrices[retailerPrices.length - 1];
        const priceChange = newestPrice - oldestPrice;
        const priceChangePercentage = (priceChange / oldestPrice) * 100;

        result[retailer] = {
          minPrice,
          maxPrice,
          avgPrice,
          priceChange,
          priceChangePercentage
        };
      }

      return result;
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Failed to get retailer price comparison:', {
        error: errorMessage,
        productId,
        days
      });
      throw new Error(`Failed to get retailer price comparison: ${errorMessage}`);
    }
  }
} 