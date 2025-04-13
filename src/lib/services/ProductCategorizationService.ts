import { Logger } from '../../../lib/utils/logger';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import { NormalizedProduct } from './ProductNormalizationService';

interface TariffCode {
  code: string;
  description: string;
  rate: number;
  effectiveDate: Date;
}

interface TariffImpact {
  level: 'high' | 'medium' | 'low';
  description: string;
  currentRate: number;
  predictedRate?: number;
  affectedCategories: string[];
}

export class ProductCategorizationService {
  private readonly logger: Logger;
  private readonly supabase: SupabaseClient<Database>;
  private readonly categoryMappings: Map<string, string[]>;
  private readonly tariffCodeCache: Map<string, TariffCode>;

  constructor(supabase: SupabaseClient<Database>) {
    this.logger = new Logger('ProductCategorizationService');
    this.supabase = supabase;
    this.categoryMappings = new Map();
    this.tariffCodeCache = new Map();
    this.initializeCategoryMappings();
  }

  /**
   * Initialize category mappings from standard categories to tariff codes
   */
  private async initializeCategoryMappings(): Promise<void> {
    try {
      const { data: mappings, error } = await this.supabase
        .from('category_tariff_mappings')
        .select('*');

      if (error) throw error;

      mappings?.forEach(mapping => {
        this.categoryMappings.set(
          mapping.category_name.toLowerCase(),
          mapping.tariff_codes
        );
      });
    } catch (error) {
      this.logger.error('Failed to initialize category mappings:', { error });
      // Set some default mappings as fallback
      this.categoryMappings.set('electronics', ['85', '84']);
      this.categoryMappings.set('clothing', ['61', '62']);
      this.categoryMappings.set('food', ['16', '17', '18', '19', '20', '21']);
    }
  }

  /**
   * Categorize a product and determine its tariff impact
   */
  public async categorizeProduct(product: NormalizedProduct): Promise<{
    categories: string[];
    tariffCodes: string[];
    impact: TariffImpact;
  }> {
    try {
      // Extract categories from product metadata
      const categories = await this.extractCategories(product);

      // Map categories to tariff codes
      const tariffCodes = await this.mapCategoriesToTariffCodes(categories);

      // Determine tariff impact
      const impact = await this.analyzeTariffImpact(product, tariffCodes);

      return { categories, tariffCodes, impact };
    } catch (error) {
      this.logger.error('Failed to categorize product:', {
        error,
        productId: product.id,
        platform: product.platform
      });
      throw error;
    }
  }

  /**
   * Extract categories from product metadata
   */
  private async extractCategories(product: NormalizedProduct): Promise<string[]> {
    const categories = new Set<string>();

    // Add existing normalized categories
    product.categories.normalized.forEach(cat => categories.add(cat.toLowerCase()));

    // Extract categories from product title and description
    const textToAnalyze = `${product.title} ${product.description}`.toLowerCase();
    
    // Get category keywords from database
    const { data: keywords, error } = await this.supabase
      .from('category_keywords')
      .select('keyword, category');

    if (error) {
      this.logger.error('Failed to fetch category keywords:', { error });
    } else {
      keywords?.forEach(({ keyword, category }) => {
        if (textToAnalyze.includes(keyword.toLowerCase())) {
          categories.add(category.toLowerCase());
        }
      });
    }

    return Array.from(categories);
  }

  /**
   * Map categories to tariff codes
   */
  private async mapCategoriesToTariffCodes(categories: string[]): Promise<string[]> {
    const tariffCodes = new Set<string>();

    categories.forEach(category => {
      const codes = this.categoryMappings.get(category);
      if (codes) {
        codes.forEach(code => tariffCodes.add(code));
      }
    });

    return Array.from(tariffCodes);
  }

  /**
   * Analyze tariff impact for a product
   */
  private async analyzeTariffImpact(
    product: NormalizedProduct,
    tariffCodes: string[]
  ): Promise<TariffImpact> {
    try {
      // Get current tariff rates for the product's country of origin
      const { data: rates, error } = await this.supabase
        .from('tariff_rates')
        .select('*')
        .in('tariff_code', tariffCodes)
        .eq('country', product.origin.country)
        .order('effective_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      const currentRate = rates?.[0]?.rate || 0;
      const predictedRate = await this.predictTariffRate(product, tariffCodes);

      // Determine impact level based on rate changes
      let level: TariffImpact['level'] = 'low';
      if (predictedRate && predictedRate > currentRate) {
        const increase = predictedRate - currentRate;
        level = increase > 10 ? 'high' : increase > 5 ? 'medium' : 'low';
      }

      return {
        level,
        description: this.generateImpactDescription(currentRate, predictedRate),
        currentRate,
        predictedRate,
        affectedCategories: Array.from(new Set(product.categories.normalized))
      };
    } catch (error) {
      this.logger.error('Failed to analyze tariff impact:', {
        error,
        productId: product.id,
        tariffCodes
      });
      throw error;
    }
  }

  /**
   * Predict future tariff rate based on news and historical data
   */
  private async predictTariffRate(
    product: NormalizedProduct,
    tariffCodes: string[]
  ): Promise<number | undefined> {
    try {
      // Get recent tariff news that might affect this product
      const { data: news, error } = await this.supabase
        .from('tariff_news')
        .select('*')
        .contains('categories', product.categories.normalized)
        .order('publish_date', { ascending: false })
        .limit(5);

      if (error) throw error;

      // If we have relevant news with price impact, use it for prediction
      const relevantNews = news?.find(n => n.price_impact !== null);
      if (relevantNews?.price_impact) {
        const impact = relevantNews.price_impact as { percentage: number; direction: 'increase' | 'decrease' };
        const { data: currentRates } = await this.supabase
          .from('tariff_rates')
          .select('rate')
          .in('tariff_code', tariffCodes)
          .eq('country', product.origin.country)
          .order('effective_date', { ascending: false })
          .limit(1);

        const currentRate = currentRates?.[0]?.rate || 0;
        const change = (currentRate * impact.percentage) / 100;
        return impact.direction === 'increase' ? currentRate + change : currentRate - change;
      }

      return undefined;
    } catch (error) {
      this.logger.error('Failed to predict tariff rate:', {
        error,
        productId: product.id,
        tariffCodes
      });
      return undefined;
    }
  }

  /**
   * Generate a human-readable description of tariff impact
   */
  private generateImpactDescription(
    currentRate: number,
    predictedRate?: number
  ): string {
    if (!predictedRate || predictedRate === currentRate) {
      return `Current tariff rate is ${currentRate}%. No significant changes predicted.`;
    }

    const change = predictedRate - currentRate;
    const direction = change > 0 ? 'increase' : 'decrease';
    const percentage = Math.abs(change);

    return `Current tariff rate is ${currentRate}%. A ${direction} of ${percentage.toFixed(1)}% is predicted based on recent trade news and policy changes.`;
  }

  /**
   * Batch categorize multiple products
   */
  public async batchCategorizeProducts(
    products: NormalizedProduct[]
  ): Promise<Map<string, { categories: string[]; tariffCodes: string[]; impact: TariffImpact }>> {
    const results = new Map();

    await Promise.all(
      products.map(async product => {
        try {
          const result = await this.categorizeProduct(product);
          results.set(product.id, result);
        } catch (error) {
          this.logger.error('Failed to categorize product in batch:', {
            error,
            productId: product.id
          });
        }
      })
    );

    return results;
  }
} 