import { BaseApiClient } from '../../src/lib/api/BaseApiClient';
import { ApiClientConfig } from '@/types/api';
import { Logger } from '../../src/lib/utils/logger';

interface LogMetadata {
  [key: string]: unknown;
}

interface WtoNewsItem {
  title: string;
  content: string;
  publishedDate: string;
  sourceUrl: string;
  category?: string;
}

interface WtoApiResponse {
  data: {
    items: WtoNewsItem[];
  };
}

interface WtoSearchParams {
  query?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export class WtoApiClient extends BaseApiClient {
  private readonly logger: Logger;

  constructor(config: Omit<ApiClientConfig, 'baseUrl'> & {
    baseUrl?: string;
    logger: Logger;
  }) {
    const baseUrl = config.baseUrl || 'https://api.wto.org/v1';
    
    super({
      ...config,
      baseUrl,
      rateLimit: {
        requestsPerSecond: 2
      },
      headers: {
        ...config.headers,
        'Content-Type': 'application/json'
      }
    });

    this.logger = config.logger;
  }

  async getLatestNews(): Promise<WtoNewsItem[]> {
    try {
      const response = await this.request<WtoApiResponse>({
        method: 'GET',
        url: '/news'
      });
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to fetch WTO news', { error: String(error) });
      return [];
    }
  }

  async searchNews(params: WtoSearchParams = {}): Promise<WtoNewsItem[]> {
    try {
      const response = await this.request<WtoApiResponse>({
        method: 'GET',
        url: '/news/search',
        params: {
          q: params.query,
          start_date: params.startDate,
          end_date: params.endDate,
          category: params.category,
          page: params.page || 1,
          limit: params.limit || 10
        }
      });
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to search WTO news', { error: String(error) });
      return [];
    }
  }

  async getLatestTariffNews(): Promise<WtoNewsItem[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.searchNews({
      query: 'tariff OR tariffs OR trade',
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      limit: 20
    });
  }

  async getNewsByCategory(category: string): Promise<WtoNewsItem[]> {
    return this.searchNews({
      category,
      limit: 20
    });
  }
} 