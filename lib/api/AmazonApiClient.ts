import { BaseApiClient } from '../../src/lib/api/BaseApiClient';
import { ApiClientConfig } from '@/types/api';
import { Logger } from '../../src/lib/utils/logger';
import crypto from 'crypto';

export interface AmazonProduct {
  ASIN: string;
  DetailPageURL: string;
  title: string;
  brand?: string;
  productGroup?: string;
  price?: {
    amount: number;
    currency: string;
  };
}

interface AmazonSearchParams {
  keywords: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  itemsPerPage?: number;
  limit?: number;
}

interface AmazonApiResponse {
  data: {
    SearchResult: {
      Items: Array<{
        ASIN: string;
        DetailPageURL: string;
        ItemInfo: {
          Title: { DisplayValue: string };
          ByLineInfo?: { Brand?: { DisplayValue: string } };
          Classifications?: { ProductGroup?: { DisplayValue: string } };
        };
        Offers?: {
          Listings: Array<{
            Price: { Amount: number; Currency: string };
          }>;
        };
      }>;
    };
  };
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface ProductsResponse {
  products: AmazonProduct[];
}

interface ProductResponse {
  product: AmazonProduct;
}

interface LogMetadata {
  [key: string]: unknown;
}

export class AmazonApiClient extends BaseApiClient {
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly associateTag: string;
  private readonly region: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly logger: Logger;

  constructor(config: Omit<ApiClientConfig, 'baseUrl'> & {
    accessKey: string;
    secretKey: string;
    associateTag: string;
    region?: string;
    apiKey: string;
    baseUrl?: string;
    logger: Logger;
  }) {
    const region = config.region || 'com';
    const baseUrl = config.baseUrl || `https://webservices.amazon.${region}/paapi5/1`;
    
    super({
      ...config,
      baseUrl,
      rateLimit: {
        requestsPerSecond: 1
      },
      headers: {
        ...config.headers,
        'Content-Type': 'application/json',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1',
        'Host': `webservices.amazon.${region}`
      }
    });

    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.associateTag = config.associateTag;
    this.region = region;
    this.baseUrl = baseUrl;
    this.apiKey = config.apiKey;
    this.logger = config.logger;
  }

  private generateSignature(operation: string, timestamp: string): string {
    const stringToSign = [
      'POST',
      `webservices.amazon.${this.region}`,
      '/paapi5/1',
      operation,
      this.accessKey,
      timestamp,
      this.associateTag
    ].join('\n');

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(stringToSign)
      .digest('base64');
  }

  async searchProducts(params: AmazonSearchParams): Promise<AmazonProduct[]> {
    try {
      const timestamp = new Date().toISOString();
      const signature = this.generateSignature('SearchItems', timestamp);
      
      const queryParams = new URLSearchParams();
      queryParams.append('Keywords', params.keywords);
      
      if (params.category) {
        queryParams.append('SearchIndex', params.category);
      }
      if (params.minPrice) {
        queryParams.append('MinPrice', params.minPrice.toString());
      }
      if (params.maxPrice) {
        queryParams.append('MaxPrice', params.maxPrice.toString());
      }
      if (params.sortBy) {
        queryParams.append('SortBy', params.sortBy);
      }
      if (params.page) {
        queryParams.append('ItemPage', params.page.toString());
      }
      if (params.itemsPerPage) {
        queryParams.append('ItemCount', params.itemsPerPage.toString());
      }

      queryParams.append('AssociateTag', this.associateTag);
      queryParams.append('Operation', 'SearchItems');
      queryParams.append('Signature', signature);
      queryParams.append('Timestamp', timestamp);

      const response = await this.request<AmazonApiResponse>({
        method: 'GET',
        url: `/search?${queryParams.toString()}`
      });
      
      return response.data.SearchResult.Items.map((item) => ({
        ASIN: item.ASIN,
        DetailPageURL: item.DetailPageURL,
        title: item.ItemInfo.Title.DisplayValue,
        brand: item.ItemInfo.ByLineInfo?.Brand?.DisplayValue,
        productGroup: item.ItemInfo.Classifications?.ProductGroup?.DisplayValue,
        price: item.Offers?.Listings[0] ? {
          amount: Number(item.Offers.Listings[0].Price.Amount),
          currency: item.Offers.Listings[0].Price.Currency
        } : undefined
      }));
    } catch (error) {
      this.logger.error('Error searching Amazon products', { error: String(error) });
      throw error;
    }
  }

  async getProductsByCategory(category: string, limit: number = 20): Promise<AmazonProduct[]> {
    const params: AmazonSearchParams = {
      keywords: category,
      category,
      limit,
      sortBy: 'price_low_to_high'
    };
    return this.searchProducts(params);
  }

  async getProductsByKeywords(keywords: string, limit: number = 20): Promise<AmazonProduct[]> {
    const params: AmazonSearchParams = {
      keywords,
      limit,
      sortBy: 'relevance'
    };
    return this.searchProducts(params);
  }

  async getProductDetails(asin: string): Promise<AmazonProduct | null> {
    try {
      const response = await this.request<ApiResponse<ProductResponse>>({
        method: 'GET',
        url: `/products/${asin}`
      });
      return response.data.product;
    } catch (error) {
      this.logger.error('Failed to get Amazon product details', { error: String(error), asin });
      return null;
    }
  }

  async getTrendingProducts(limit: number = 20): Promise<AmazonProduct[]> {
    try {
      const params: AmazonSearchParams = {
        keywords: 'trending',
        limit,
        sortBy: 'relevance'
      };
      return this.searchProducts(params);
    } catch (error) {
      this.logger.error('Failed to get trending Amazon products', { error });
      return [];
    }
  }

  async getProductsByPriceRange(min: number, max: number, limit: number = 20): Promise<AmazonProduct[]> {
    const params: AmazonSearchParams = {
      keywords: '*',
      minPrice: min,
      maxPrice: max,
      itemsPerPage: limit,
      sortBy: 'price-asc'
    };
    return this.searchProducts(params);
  }

  generateAffiliateUrl(productUrl: string): string {
    const affiliateTag = process.env.AMAZON_AFFILIATE_TAG;
    if (!affiliateTag) {
      this.logger.warn('Amazon affiliate tag not found in environment variables');
      return productUrl;
    }
    const url = new URL(productUrl);
    url.searchParams.set('tag', affiliateTag);
    return url.toString();
  }
} 