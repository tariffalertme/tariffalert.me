import { BaseEcommerceClient, type EcommerceProduct, type ProductSearchParams } from './BaseEcommerceClient';

interface WalmartApiConfig {
  baseUrl: string;
  apiKey: string;
  publisherId: string;
  rateLimit: number;
  rateLimitPeriod: number;
}

export class WalmartApiClient extends BaseEcommerceClient {
  private readonly publisherId: string;

  constructor(config: WalmartApiConfig) {
    super({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      rateLimit: config.rateLimit,
      rateLimitPeriod: config.rateLimitPeriod
    });

    this.publisherId = config.publisherId;
  }

  /**
   * Search for products using Walmart's Search API
   */
  public async searchProducts(params: ProductSearchParams): Promise<EcommerceProduct[]> {
    try {
      const response = await this.client.get('/v1/search', {
        params: {
          query: params.query,
          categoryId: params.category,
          priceMin: params.minPrice,
          priceMax: params.maxPrice,
          brand: params.brand,
          limit: params.limit || 10,
          offset: params.offset || 0,
          sort: this.mapSortBy(params.sortBy)
        },
        headers: {
          'WM_SEC.KEY_VERSION': '1',
          'WM_CONSUMER.ID': this.publisherId
        }
      });

      return this.normalizeProducts(response.data.items);
    } catch (error) {
      this.handleError(error, 'Walmart product search');
    }
  }

  /**
   * Get detailed information about a specific product
   */
  public async getProduct(productId: string): Promise<EcommerceProduct> {
    try {
      const response = await this.client.get(`/v1/items/${productId}`, {
        headers: {
          'WM_SEC.KEY_VERSION': '1',
          'WM_CONSUMER.ID': this.publisherId
        }
      });

      return this.normalizeProduct(response.data);
    } catch (error) {
      this.handleError(error, 'Walmart product fetch');
    }
  }

  /**
   * Get multiple products by their IDs
   */
  public async getProducts(productIds: string[]): Promise<EcommerceProduct[]> {
    try {
      const response = await this.client.get('/v1/items', {
        params: {
          ids: productIds.join(',')
        },
        headers: {
          'WM_SEC.KEY_VERSION': '1',
          'WM_CONSUMER.ID': this.publisherId
        }
      });

      return this.normalizeProducts(response.data.items);
    } catch (error) {
      this.handleError(error, 'Walmart products fetch');
    }
  }

  /**
   * Get product price history (Note: Walmart doesn't provide historical prices)
   */
  public async getPriceHistory(productId: string, days: number): Promise<Array<{
    date: Date;
    price: number;
    currency: string;
  }>> {
    // This would need to be implemented using our own price tracking database
    // as Walmart doesn't provide historical price data through their API
    throw new Error('Price history not available through Walmart API');
  }

  /**
   * Generate affiliate URL for Walmart product
   */
  protected generateAffiliateUrl(productUrl: string): string {
    const url = new URL(productUrl);
    url.searchParams.set('publisherId', this.publisherId);
    return url.toString();
  }

  /**
   * Extract country of origin from Walmart product data
   */
  protected extractCountryOfOrigin(productData: any): string | undefined {
    // Try to extract from product specifications
    const specs = productData.specifications || [];
    const originSpec = specs.find((spec: any) => 
      spec.name.toLowerCase().includes('country of origin') ||
      spec.name.toLowerCase().includes('made in')
    );

    if (originSpec) {
      return originSpec.value.trim();
    }

    return undefined;
  }

  /**
   * Normalize Walmart categories to standard format
   */
  protected normalizeCategories(categoryPath: string): string[] {
    return categoryPath.split('/').map(cat => cat.trim());
  }

  /**
   * Map our sort parameters to Walmart's sort values
   */
  private mapSortBy(sortBy?: ProductSearchParams['sortBy']): string {
    switch (sortBy) {
      case 'price_asc':
        return 'price_low';
      case 'price_desc':
        return 'price_high';
      case 'relevance':
      default:
        return 'best_match';
    }
  }

  /**
   * Normalize a single Walmart product to our standard format
   */
  private normalizeProduct(item: any): EcommerceProduct {
    return {
      id: item.itemId,
      title: item.name,
      description: item.shortDescription || '',
      brand: item.brand,
      currentPrice: item.salePrice || item.price,
      currency: 'USD', // Walmart US only returns prices in USD
      imageUrl: item.largeImage,
      url: this.generateAffiliateUrl(item.productUrl),
      countryOfOrigin: this.extractCountryOfOrigin(item),
      categories: this.normalizeCategories(item.categoryPath),
      availability: this.mapAvailability(item.stock),
      merchant: 'Walmart',
      merchantId: 'walmart',
      lastUpdated: new Date()
    };
  }

  /**
   * Normalize multiple Walmart products
   */
  private normalizeProducts(items: any[]): EcommerceProduct[] {
    return items.map(item => this.normalizeProduct(item));
  }

  /**
   * Map Walmart availability to our standard format
   */
  private mapAvailability(stock: string): EcommerceProduct['availability'] {
    if (stock === 'Available') return 'in_stock';
    if (stock === 'Limited Supply') return 'limited';
    return 'out_of_stock';
  }
} 