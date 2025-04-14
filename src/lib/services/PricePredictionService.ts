import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Logger } from '@/lib/utils/logger';
import { PostgrestError } from '@supabase/supabase-js';

interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  factors: {
    tariffImpact: number;
    seasonalTrend: number;
    marketTrend: number;
  };
}

interface RetailerComparison {
  retailer: string;
  currentPrice: number;
  historicalLow: number;
  historicalHigh: number;
  averagePrice: number;
  priceVolatility: number;
}

export class PricePredictionService {
  private readonly logger: Logger;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    loggerName = 'PricePredictionService'
  ) {
    this.logger = new Logger(loggerName);
  }

  /**
   * Calculate the seasonal trend based on historical data
   */
  private async calculateSeasonalTrend(
    productId: string,
    currentPrice: number
  ): Promise<number> {
    try {
      // Get price history for the past year
      const { data, error } = await this.supabase
        .from('price_history')
        .select('price, recorded_at')
        .eq('product_id', productId)
        .gte('recorded_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return 0;
      }

      // Group prices by month and calculate average
      const monthlyAverages = data.reduce<Record<number, number[]>>((acc, record) => {
        const month = new Date(record.recorded_at).getMonth();
        if (!acc[month]) acc[month] = [];
        acc[month].push(record.price);
        return acc;
      }, {});

      const currentMonth = new Date().getMonth();
      const nextMonth = (currentMonth + 1) % 12;

      const currentMonthAvg = monthlyAverages[currentMonth]
        ? monthlyAverages[currentMonth].reduce((a, b) => a + b, 0) / monthlyAverages[currentMonth].length
        : currentPrice;

      const nextMonthAvg = monthlyAverages[nextMonth]
        ? monthlyAverages[nextMonth].reduce((a, b) => a + b, 0) / monthlyAverages[nextMonth].length
        : currentPrice;

      return ((nextMonthAvg - currentMonthAvg) / currentMonthAvg) * 100;
    } catch (error: unknown) {
      this.logger.error('Error calculating seasonal trend:', { error, productId });
      return 0;
    }
  }

  /**
   * Calculate the market trend based on recent price changes
   */
  private async calculateMarketTrend(
    productId: string,
    currentPrice: number
  ): Promise<number> {
    try {
      // Get price history for the past 30 days
      const { data, error } = await this.supabase
        .from('price_history')
        .select('price, recorded_at')
        .eq('product_id', productId)
        .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length < 2) {
        return 0;
      }

      const prices = data.map(record => record.price);
      const oldestPrice = prices[0];
      const trend = ((currentPrice - oldestPrice) / oldestPrice) * 100;

      return trend;
    } catch (error: unknown) {
      this.logger.error('Error calculating market trend:', { error, productId });
      return 0;
    }
  }

  /**
   * Get price prediction for a product
   */
  public async getPricePrediction(productId: string): Promise<PricePrediction> {
    try {
      // Get current product data
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('current_price, tariff_rate, impacted_by_tariffs')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error('Product not found');

      const currentPrice = product.current_price;
      const tariffImpact = product.impacted_by_tariffs ? (product.tariff_rate || 0) : 0;
      const seasonalTrend = await this.calculateSeasonalTrend(productId, currentPrice);
      const marketTrend = await this.calculateMarketTrend(productId, currentPrice);

      // Calculate predicted price using weighted factors
      const tariffFactor = 1 + (tariffImpact / 100);
      const seasonalFactor = 1 + (seasonalTrend / 100);
      const marketFactor = 1 + (marketTrend / 100);

      const predictedPrice = currentPrice * tariffFactor * seasonalFactor * marketFactor;
      
      // Calculate confidence based on data availability and factor consistency
      const confidence = Math.min(
        80, // Maximum confidence
        (tariffImpact ? 30 : 0) + // Tariff data confidence
        (Math.abs(seasonalTrend) < 20 ? 30 : 20) + // Seasonal trend confidence
        (Math.abs(marketTrend) < 15 ? 20 : 10) // Market trend confidence
      );

      return {
        predictedPrice,
        confidence,
        factors: {
          tariffImpact,
          seasonalTrend,
          marketTrend
        }
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
      this.logger.error('Failed to get price prediction:', {
        error: errorMessage,
        productId
      });
      throw new Error(`Failed to get price prediction: ${errorMessage}`);
    }
  }

  /**
   * Get retailer price comparison
   */
  public async getRetailerComparison(productId: string): Promise<RetailerComparison[]> {
    try {
      const { data, error } = await this.supabase
        .from('price_history')
        .select('price, retailer, recorded_at')
        .eq('product_id', productId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      const retailers = Array.from(new Set(data.map(record => record.retailer)));
      const comparisons: RetailerComparison[] = [];

      for (const retailer of retailers) {
        const retailerPrices = data
          .filter(record => record.retailer === retailer)
          .map(record => record.price);

        const currentPrice = retailerPrices[retailerPrices.length - 1];
        const historicalLow = Math.min(...retailerPrices);
        const historicalHigh = Math.max(...retailerPrices);
        const averagePrice = retailerPrices.reduce((a, b) => a + b, 0) / retailerPrices.length;

        // Calculate price volatility (standard deviation)
        const mean = averagePrice;
        const squaredDiffs = retailerPrices.map(price => Math.pow(price - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / retailerPrices.length;
        const priceVolatility = Math.sqrt(variance);

        comparisons.push({
          retailer,
          currentPrice,
          historicalLow,
          historicalHigh,
          averagePrice,
          priceVolatility
        });
      }

      return comparisons;
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Failed to get retailer comparison:', {
        error: errorMessage,
        productId
      });
      throw new Error(`Failed to get retailer comparison: ${errorMessage}`);
    }
  }
} 