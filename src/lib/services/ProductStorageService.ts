import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedProduct } from './ProductNormalizationService';
import { Logger } from '../../../lib/utils/logger';
import { Database } from '../../../src/types/supabase';
import { PostgrestError } from '@supabase/supabase-js';

interface ProductStorageConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export class ProductStorageService {
  private readonly supabase: SupabaseClient<Database>;
  private readonly logger: Logger;

  constructor(config: ProductStorageConfig) {
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey);
    this.logger = new Logger('ProductStorageService');
  }

  /**
   * Store a normalized product in the database
   */
  public async storeProduct(product: NormalizedProduct): Promise<string> {
    try {
      // Start a transaction
      const { data: productData, error: productError } = await this.supabase
        .from('products')
        .upsert({
          platform_id: product.platformId,
          platform: product.platform,
          title: product.title,
          description: product.description,
          brand: product.brand,
          current_price: product.price.current,
          currency: product.price.currency,
          price_updated_at: product.price.lastUpdated,
          primary_image_url: product.images.primary,
          additional_image_urls: product.images.additional,
          product_url: product.url,
          affiliate_url: product.affiliateUrl,
          origin_country: product.origin.country,
          origin_confidence: product.origin.confidence,
          availability: product.availability.status,
          availability_quantity: product.availability.quantity,
          specifications: product.specifications,
          first_seen_at: product.metadata.firstSeen,
          last_checked_at: product.metadata.lastChecked
        }, {
          onConflict: 'platform,platform_id'
        })
        .select();

      if (productError) throw productError;
      if (!productData || !productData[0]) {
        throw new Error('No product data returned after upsert');
      }

      // Store categories
      if (product.categories.normalized.length > 0) {
        const { error: categoriesError } = await this.supabase
          .from('product_categories')
          .upsert(
            product.categories.normalized.map((category, index) => ({
              product_id: productData[0].id,
              raw_category: product.categories.raw[index],
              normalized_category: category,
              tariff_code: product.categories.tariffCodes?.[index]
            })),
            {
              onConflict: 'product_id,normalized_category'
            }
          );

        if (categoriesError) throw categoriesError;
      }

      return productData[0].id;
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError || error instanceof Error) {
        errorMessage = error.message;
      } else {
        // Handle non-Error objects
        errorMessage = typeof error === 'object' && error !== null 
          ? JSON.stringify(error)
          : String(error);
      }
      this.logger.error('Failed to store product:', {
        error: errorMessage,
        productId: product.platformId,
        platform: product.platform
      });
      throw new Error(`Failed to store product: ${errorMessage}`);
    }
  }

  /**
   * Store multiple normalized products in the database
   */
  public async storeProducts(products: NormalizedProduct[]): Promise<string[]> {
    const productIds: string[] = [];

    for (const product of products) {
      try {
        const id = await this.storeProduct(product);
        productIds.push(id);
      } catch (error) {
        this.logger.error('Failed to store product in batch:', {
          error,
          productId: product.id,
          platform: product.platform
        });
      }
    }

    return productIds;
  }

  /**
   * Get a product by its ID
   */
  public async getProduct(id: string): Promise<NormalizedProduct | null> {
    try {
      // Get product data
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      if (!product) return null;

      // Get product categories
      const { data: categories, error: categoriesError } = await this.supabase
        .from('product_categories')
        .select('*')
        .eq('product_id', id);

      if (categoriesError) throw categoriesError;

      return this.denormalizeProduct(product, categories || []);
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Failed to get product:', { error: errorMessage, productId: id });
      throw new Error(`Failed to get product: ${errorMessage}`);
    }
  }

  /**
   * Get products by platform and platform IDs
   */
  public async getProductsByPlatformIds(
    platform: string,
    platformIds: string[]
  ): Promise<NormalizedProduct[]> {
    try {
      // Get products data
      const { data: products, error: productsError } = await this.supabase
        .from('products')
        .select('*')
        .eq('platform', platform)
        .in('platform_id', platformIds);

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      // Get categories for all products
      const { data: categories, error: categoriesError } = await this.supabase
        .from('product_categories')
        .select('*')
        .in('product_id', products.map(p => p.id));

      if (categoriesError) throw categoriesError;

      // Group categories by product ID
      const categoriesByProduct = (categories || []).reduce((acc, cat) => {
        if (!acc[cat.product_id]) acc[cat.product_id] = [];
        acc[cat.product_id].push(cat);
        return acc;
      }, {} as Record<string, typeof categories>);

      // Denormalize each product
      return products.map(product => 
        this.denormalizeProduct(product, categoriesByProduct[product.id] || [])
      );
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof PostgrestError) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Failed to get products by platform IDs:', {
        error: errorMessage,
        platform,
        platformIds
      });
      throw new Error(`Failed to get products by platform IDs: ${errorMessage}`);
    }
  }

  /**
   * Get price history for a product
   */
  public async getPriceHistory(
    productId: string,
    days: number
  ): Promise<Array<{ date: Date; price: number; currency: string }>> {
    try {
      const { data, error } = await this.supabase
        .from('price_history')
        .select('recorded_at, price, currency')
        .eq('product_id', productId)
        .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(record => ({
        date: new Date(record.recorded_at),
        price: record.price,
        currency: record.currency
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
        days
      });
      throw new Error(`Failed to get price history: ${errorMessage}`);
    }
  }

  /**
   * Convert database product record back to NormalizedProduct
   */
  private denormalizeProduct(
    product: any,
    categories: any[]
  ): NormalizedProduct {
    return {
      id: product.id,
      platformId: product.platform_id,
      platform: product.platform,
      title: product.title,
      description: product.description,
      brand: product.brand,
      price: {
        current: product.current_price,
        currency: product.currency,
        lastUpdated: new Date(product.price_updated_at)
      },
      images: {
        primary: product.primary_image_url,
        additional: product.additional_image_urls
      },
      url: product.product_url,
      affiliateUrl: product.affiliate_url,
      origin: {
        country: product.origin_country,
        confidence: product.origin_confidence
      },
      categories: {
        raw: categories.map(c => c.raw_category),
        normalized: categories.map(c => c.normalized_category),
        tariffCodes: categories
          .map(c => c.tariff_code)
          .filter((code): code is string => code !== null)
      },
      availability: {
        status: product.availability,
        quantity: product.availability_quantity
      },
      specifications: product.specifications,
      metadata: {
        lastChecked: new Date(product.last_checked_at),
        firstSeen: new Date(product.first_seen_at),
        platform: product.platform,
        platformId: product.platform_id
      }
    };
  }
} 