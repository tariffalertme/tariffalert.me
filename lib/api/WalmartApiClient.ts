import { BaseApiClient } from '../../src/lib/api/BaseApiClient';
import { ApiClientConfig } from '@/types/api';
import { Logger } from '../../src/lib/utils/logger';

interface LogMetadata {
  [key: string]: unknown;
}

export interface WalmartProduct {
  itemId: string;
  name: string;
  salePrice: number;
  categoryPath: string;
  brandName?: string;
  thumbnailImage?: string;
  mediumImage?: string;
  largeImage?: string;
  productUrl: string;
  stock: string;
  addToCartUrl?: string;
  affiliateAddToCartUrl?: string;
  freeShippingOver35Dollars: boolean;
  giftOptions: boolean;
  imageEntities?: Array<{
    thumbnailImage: string;
    mediumImage: string;
    largeImage: string;
    entityType: string;
  }>;
}

interface WalmartApiResponse {
  data: {
    items: WalmartProduct[];
  };
}

interface WalmartSearchParams {
  query: string;
  categoryId?: string;
  sort?: 'price' | 'bestseller' | 'rating' | 'title' | 'new';
  order?: 'asc' | 'desc';
  numItems?: number;
  start?: number;
  responseGroup?: string;
  facet?: boolean;
}

export class WalmartApiClient extends BaseApiClient {
  private readonly apiKey: string;
  private readonly logger: Logger;

  constructor(config: Omit<ApiClientConfig, 'baseUrl'> & {
    apiKey: string;
    baseUrl?: string;
    logger: Logger;
  }) {
    const baseUrl = config.baseUrl || 'https://api.walmart.com/v3';
    
    super({
      ...config,
      baseUrl,
      rateLimit: {
        requestsPerSecond: 5
      },
      headers: {
        ...config.headers,
        'WM_SEC.KEY_VERSION': '1',
        'WM_CONSUMER.ID': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    this.apiKey = config.apiKey;
    this.logger = config.logger;
  }

  async searchProducts(params: WalmartSearchParams): Promise<WalmartProduct[]> {
    try {
      const response = await this.request<WalmartApiResponse>({
        method: 'GET',
        url: '/search',
        params: {
          query: params.query,
          categoryId: params.categoryId,
          sort: params.sort,
          order: params.order,
          numItems: params.numItems || 25,
          start: params.start || 1,
          responseGroup: params.responseGroup || 'base',
          facet: params.facet || false
        }
      });

      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to search Walmart products', { error: String(error) });
      return [];
    }
  }

  async getProductById(itemId: string): Promise<WalmartProduct | null> {
    try {
      const response = await this.request<{ data: WalmartProduct }>({
        method: 'GET',
        url: `/items/${itemId}`
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Walmart product details', { error: String(error), itemId });
      return null;
    }
  }

  async getTrendingProducts(categoryId?: string): Promise<WalmartProduct[]> {
    try {
      const response = await this.request<WalmartApiResponse>({
        method: 'GET',
        url: '/trends',
        params: {
          categoryId,
          numItems: 20
        }
      });
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to get trending Walmart products', { error: String(error) });
      return [];
    }
  }

  async getProductRecommendations(itemId: string): Promise<WalmartProduct[]> {
    try {
      const response = await this.request<WalmartApiResponse>({
        method: 'GET',
        url: `/nbp/${itemId}`
      });
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to get Walmart product recommendations', { error: String(error), itemId });
      return [];
    }
  }
} 