import { BaseApiClient } from '../../src/lib/api/BaseApiClient';
import { ApiClientConfig } from '../../src/types/api';
import { Logger } from '../../src/lib/utils/logger';

interface LogMetadata {
  [key: string]: unknown;
}

interface UstrNewsItem {
  title: string;
  content: string;
  publishedDate: string;
  sourceUrl: string;
  category?: string;
}

interface UstrApiResponse {
  data: {
    items: UstrNewsItem[];
  };
}

interface UstrSearchParams {
  query?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export class UstrApiClient extends BaseApiClient {
  private readonly logger: Logger;

  constructor(config: Omit<ApiClientConfig, 'baseUrl'> & {
    baseUrl?: string;
    logger: Logger;
  }) {
    const baseUrl = config.baseUrl || 'https://ustr.gov/api/v1';
    
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

  async getLatestNews(): Promise<UstrNewsItem[]> {
    try {
      const response = await this.request<UstrApiResponse>({
        method: 'GET',
        url: '/news'
      });
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to fetch USTR news', { error: String(error) });
      return [];
    }
  }

  async searchNews(params: UstrSearchParams = {}): Promise<UstrNewsItem[]> {
    try {
      const response = await this.request<UstrApiResponse>({
        method: 'GET',
        url: '/press-releases',
        params: {
          q: params.query || 'tariff',
          start_date: params.startDate,
          end_date: params.endDate,
          category: params.category,
          page: params.page || 1,
          limit: params.limit || 10
        }
      });

      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to fetch USTR news', { error: String(error) });
      return [];
    }
  }

  async getLatestTariffNews(): Promise<UstrNewsItem[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.searchNews({
      query: 'tariff OR tariffs OR trade OR section 301',
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      limit: 20
    });
  }

  async getNewsByCategory(category: string): Promise<UstrNewsItem[]> {
    return this.searchNews({
      category,
      limit: 20
    });
  }
} 