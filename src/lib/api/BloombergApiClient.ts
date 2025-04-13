import { BaseNewsApiClient, NewsApiConfig } from './BaseNewsApiClient';
import type { NormalizedNewsItem } from '@/types/api';

interface BloombergNewsItem {
  storyId: string;
  title: string;
  summary: string;
  text: string;
  publishedAt: string;
  webUrl: string;
  byline: string[];
  topics: string[];
  industries: string[];
  regions: string[];
  markets: string[];
  multimedia?: {
    type: string;
    url: string;
    title: string;
  }[];
}

export class BloombergApiClient extends BaseNewsApiClient {
  constructor(config: Omit<NewsApiConfig, 'sourceId' | 'sourceName' | 'sourceType'> & {
    apiKey: string;
    secretKey: string;
  }) {
    super({
      ...config,
      sourceId: 'bloomberg',
      sourceName: 'Bloomberg',
      sourceType: 'news',
      auth: {
        type: 'apiKey',
        apiKey: config.apiKey
      },
      headers: {
        'X-BAPI-SECRET': config.secretKey
      }
    });
  }

  protected normalizeNewsItem(item: BloombergNewsItem): NormalizedNewsItem {
    const normalizedItem: NormalizedNewsItem = {
      title: item.title,
      content: item.text || item.summary,
      publishedDate: new Date(item.publishedAt),
      sourceUrl: item.webUrl,
      source: this.sourceName,
      categories: [
        ...item.topics,
        ...item.industries,
        ...item.regions,
        ...item.markets,
        ...this.extractCategories({
          title: item.title,
          content: item.text || item.summary,
          publishedDate: new Date(item.publishedAt),
          sourceUrl: item.webUrl,
          source: this.sourceName,
          categories: [...item.topics, ...item.industries, ...item.regions, ...item.markets],
          metadata: {
            storyId: item.storyId,
            byline: item.byline,
            multimedia: item.multimedia
          }
        })
      ],
      metadata: {
        storyId: item.storyId,
        byline: item.byline,
        multimedia: item.multimedia
      }
    };

    // Add impact analysis if it's tariff related
    if (this.isTariffRelated(normalizedItem)) {
      normalizedItem.impact = {
        level: this.analyzeImpactLevel(normalizedItem),
        description: this.generateImpactDescription(normalizedItem)
      };
    }

    return normalizedItem;
  }

  private generateImpactDescription(item: NormalizedNewsItem): string {
    const impactLevel = this.analyzeImpactLevel(item);
    const regions = (item.categories || []).filter(cat => 
      ['asia', 'europe', 'americas', 'africa', 'oceania'].includes(cat.toLowerCase())
    );
    const sectors = (item.categories || []).filter(cat => 
      ['agriculture', 'automotive', 'electronics', 'energy', 'manufacturing', 'technology', 'textiles', 'steel', 'aluminum']
      .includes(cat.toLowerCase())
    );

    let description = `This news may have a ${impactLevel} impact`;
    if (regions.length > 0) {
      description += ` in ${regions.join(', ')}`;
    }
    if (sectors.length > 0) {
      description += ` on the ${sectors.join(', ')} sector${sectors.length > 1 ? 's' : ''}`;
    }
    return description + '.';
  }

  public async getLatestNews(limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ stories: BloombergNewsItem[] }>({
      method: 'GET',
      url: '/stories/latest',
      params: {
        limit,
        template: 'FULL',
        topics: 'TRADE,ECONOMY,MARKETS'
      }
    });

    return response.stories.map(item => this.normalizeNewsItem(item));
  }

  public async searchNews(query: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ stories: BloombergNewsItem[] }>({
      method: 'GET',
      url: '/stories/search',
      params: {
        query,
        limit,
        template: 'FULL',
        sortBy: 'relevance'
      }
    });

    return response.stories.map(item => this.normalizeNewsItem(item));
  }

  public async getNewsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ stories: BloombergNewsItem[] }>({
      method: 'GET',
      url: '/stories/search',
      params: {
        dateRange: `${startDate.toISOString()}/${endDate.toISOString()}`,
        limit,
        template: 'FULL',
        sortBy: 'date'
      }
    });

    return response.stories.map(item => this.normalizeNewsItem(item));
  }

  /**
   * Get news items by specific industry
   */
  public async getNewsByIndustry(industry: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ stories: BloombergNewsItem[] }>({
      method: 'GET',
      url: '/stories/search',
      params: {
        industries: industry,
        limit,
        template: 'FULL',
        sortBy: 'date'
      }
    });

    return response.stories.map(item => this.normalizeNewsItem(item));
  }

  /**
   * Get news items by specific region
   */
  public async getNewsByRegion(region: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ stories: BloombergNewsItem[] }>({
      method: 'GET',
      url: '/stories/search',
      params: {
        regions: region,
        limit,
        template: 'FULL',
        sortBy: 'date'
      }
    });

    return response.stories.map(item => this.normalizeNewsItem(item));
  }

  /**
   * Get news items by specific market
   */
  public async getNewsByMarket(market: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ stories: BloombergNewsItem[] }>({
      method: 'GET',
      url: '/stories/search',
      params: {
        markets: market,
        limit,
        template: 'FULL',
        sortBy: 'date'
      }
    });

    return response.stories.map(item => this.normalizeNewsItem(item));
  }
} 