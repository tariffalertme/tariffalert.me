import { BaseEcommerceClient, type EcommerceProduct, type ProductSearchParams } from './BaseEcommerceClient';
import { createHmac } from 'crypto';

interface AmazonApiConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  partnerId: string;
  rateLimit: number;
  rateLimitPeriod: number;
  marketplace?: string;
}

export class AmazonApiClient extends BaseEcommerceClient {
  private readonly secretKey: string;
  private readonly partnerId: string;
  private readonly marketplace: string;

  constructor(config: AmazonApiConfig) {
    super({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      rateLimit: config.rateLimit,
      rateLimitPeriod: config.rateLimitPeriod
    });

    this.secretKey = config.secretKey;
    this.partnerId = config.partnerId;
    this.marketplace = config.marketplace || 'US';
  }

  /**
   * Search for products using Amazon's Product Advertising API
   */
  public async searchProducts(params: ProductSearchParams): Promise<EcommerceProduct[]> {
    try {
      const timestamp = new Date().toISOString();
      const signature = this.generateSignature('SearchItems', timestamp);

      const response = await this.client.post('/paapi5/searchitems', {
        Keywords: params.query,
        SearchIndex: params.category || 'All',
        MinPrice: params.minPrice,
        MaxPrice: params.maxPrice,
        Brand: params.brand,
        ItemCount: params.limit || 10,
        ItemPage: params.offset ? Math.floor(params.offset / (params.limit || 10)) + 1 : 1,
        SortBy: this.mapSortBy(params.sortBy),
        Marketplace: this.marketplace,
        PartnerTag: this.partnerId,
        PartnerType: 'Associates',
        Resources: [
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ProductInfo',
          'Offers.Listings.Price',
          'Images.Primary.Large'
        ]
      }, {
        headers: {
          'X-Amz-Date': timestamp,
          'X-Amz-Signature': signature
        }
      });

      return this.normalizeProducts(response.data.ItemsResult.Items);
    } catch (error) {
      this.handleError(error, 'Amazon product search');
    }
  }

  /**
   * Get detailed information about a specific product
   */
  public async getProduct(productId: string): Promise<EcommerceProduct> {
    try {
      const timestamp = new Date().toISOString();
      const signature = this.generateSignature('GetItems', timestamp);

      const response = await this.client.post('/paapi5/getitems', {
        ItemIds: [productId],
        Marketplace: this.marketplace,
        PartnerTag: this.partnerId,
        PartnerType: 'Associates',
        Resources: [
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ProductInfo',
          'ItemInfo.ByLineInfo',
          'Offers.Listings.Price',
          'Images.Primary.Large',
          'BrowseNodeInfo'
        ]
      }, {
        headers: {
          'X-Amz-Date': timestamp,
          'X-Amz-Signature': signature
        }
      });

      const product = response.data.ItemsResult.Items[0];
      return this.normalizeProduct(product);
    } catch (error) {
      this.handleError(error, 'Amazon product fetch');
    }
  }

  /**
   * Get multiple products by their IDs
   */
  public async getProducts(productIds: string[]): Promise<EcommerceProduct[]> {
    try {
      const timestamp = new Date().toISOString();
      const signature = this.generateSignature('GetItems', timestamp);

      const response = await this.client.post('/paapi5/getitems', {
        ItemIds: productIds,
        Marketplace: this.marketplace,
        PartnerTag: this.partnerId,
        PartnerType: 'Associates',
        Resources: [
          'ItemInfo.Title',
          'ItemInfo.Features',
          'ItemInfo.ProductInfo',
          'ItemInfo.ByLineInfo',
          'Offers.Listings.Price',
          'Images.Primary.Large',
          'BrowseNodeInfo'
        ]
      }, {
        headers: {
          'X-Amz-Date': timestamp,
          'X-Amz-Signature': signature
        }
      });

      return this.normalizeProducts(response.data.ItemsResult.Items);
    } catch (error) {
      this.handleError(error, 'Amazon products fetch');
    }
  }

  /**
   * Get product price history (Note: Amazon doesn't provide historical prices directly)
   */
  public async getPriceHistory(productId: string, days: number): Promise<Array<{
    date: Date;
    price: number;
    currency: string;
  }>> {
    // This would need to be implemented using our own price tracking database
    // as Amazon doesn't provide historical price data through their API
    throw new Error('Price history not available through Amazon API');
  }

  /**
   * Generate affiliate URL for Amazon product
   */
  protected generateAffiliateUrl(productUrl: string): string {
    const url = new URL(productUrl);
    url.searchParams.set('tag', this.partnerId);
    return url.toString();
  }

  /**
   * Extract country of origin from Amazon product data
   */
  protected extractCountryOfOrigin(productData: any): string | undefined {
    // Try to extract from product features or details
    const features = productData.ItemInfo?.Features?.DisplayValues || [];
    const originFeature = features.find((f: string) => 
      f.toLowerCase().includes('made in') || 
      f.toLowerCase().includes('country of origin')
    );

    if (originFeature) {
      const match = originFeature.match(/made in ([\w\s]+)|country of origin:?\s*([\w\s]+)/i);
      return match ? (match[1] || match[2]).trim() : undefined;
    }

    return undefined;
  }

  /**
   * Normalize Amazon categories to standard format
   */
  protected normalizeCategories(browseNodes: any[]): string[] {
    return browseNodes.map(node => node.DisplayName)
      .filter((name): name is string => typeof name === 'string');
  }

  /**
   * Generate signature for Amazon PA-API request
   */
  private generateSignature(operation: string, timestamp: string): string {
    const stringToSign = [
      'POST',
      this.config.baseUrl,
      `/paapi5/${operation.toLowerCase()}`,
      `X-Amz-Date:${timestamp}`
    ].join('\n');

    return createHmac('sha256', this.secretKey)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * Map our sort parameters to Amazon's sort values
   */
  private mapSortBy(sortBy?: ProductSearchParams['sortBy']): string {
    switch (sortBy) {
      case 'price_asc':
        return 'Price:LowToHigh';
      case 'price_desc':
        return 'Price:HighToLow';
      case 'relevance':
      default:
        return 'Relevance';
    }
  }

  /**
   * Normalize a single Amazon product to our standard format
   */
  private normalizeProduct(item: any): EcommerceProduct {
    return {
      id: item.ASIN,
      title: item.ItemInfo.Title.DisplayValue,
      description: item.ItemInfo.Features?.DisplayValues.join('\n') || '',
      brand: item.ItemInfo.ByLineInfo?.Brand?.DisplayValue,
      currentPrice: parseFloat(item.Offers.Listings[0].Price.Amount),
      currency: item.Offers.Listings[0].Price.Currency,
      imageUrl: item.Images.Primary.Large.URL,
      url: this.generateAffiliateUrl(item.DetailPageURL),
      countryOfOrigin: this.extractCountryOfOrigin(item),
      categories: this.normalizeCategories(item.BrowseNodeInfo.BrowseNodes),
      availability: this.mapAvailability(item.Offers.Listings[0].Availability),
      merchant: 'Amazon',
      merchantId: 'amazon',
      lastUpdated: new Date()
    };
  }

  /**
   * Normalize multiple Amazon products
   */
  private normalizeProducts(items: any[]): EcommerceProduct[] {
    return items.map(item => this.normalizeProduct(item));
  }

  /**
   * Map Amazon availability to our standard format
   */
  private mapAvailability(availability: string): EcommerceProduct['availability'] {
    if (availability.includes('in stock')) return 'in_stock';
    if (availability.includes('limited')) return 'limited';
    return 'out_of_stock';
  }
} 