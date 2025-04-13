import { BaseNewsApiClient, NewsApiConfig } from './BaseNewsApiClient';
import type { NormalizedNewsItem } from '@/types/api';

interface ReutersNewsItem {
  id: string;
  headline: string;
  body: string;
  dateTime: string;
  url: string;
  authors: string[];
  channels: string[];
  tags: string[];
  images?: {
    url: string;
    caption: string;
  }[];
}

export class ReutersApiClient extends BaseNewsApiClient {
  constructor(config: Omit<NewsApiConfig, 'sourceId' | 'sourceName' | 'sourceType'> & {
    apiKey: string;
  }) {
    super({
      ...config,
      sourceId: 'reuters',
      sourceName: 'Reuters',
      sourceType: 'news',
      auth: {
        type: 'apiKey',
        apiKey: config.apiKey
      }
    });
  }

  protected normalizeNewsItem(item: ReutersNewsItem): NormalizedNewsItem {
    const normalizedItem: NormalizedNewsItem = {
      title: item.headline,
      content: item.body,
      publishedDate: new Date(item.dateTime),
      sourceUrl: item.url,
      source: this.sourceName,
      categories: [...item.channels, ...item.tags, ...this.extractCategories({
        title: item.headline,
        content: item.body,
        publishedDate: new Date(item.dateTime),
        sourceUrl: item.url,
        source: this.sourceName,
        categories: [...item.channels, ...item.tags],
        metadata: {
          authors: item.authors,
          id: item.id,
          images: item.images
        }
      })],
      metadata: {
        authors: item.authors,
        id: item.id,
        images: item.images
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
    const sectors = item.categories.filter(cat => 
      ['agriculture', 'automotive', 'electronics', 'energy', 'manufacturing', 'technology', 'textiles', 'steel', 'aluminum']
      .includes(cat.toLowerCase())
    );

    if (sectors.length > 0) {
      return `This news may have a ${impactLevel} impact on the ${sectors.join(', ')} sector${sectors.length > 1 ? 's' : ''}.`;
    }

    return `This news may have a ${impactLevel} impact on international trade.`;
  }

  public async getLatestNews(limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ articles: ReutersNewsItem[] }>({
      method: 'GET',
      url: '/news/v1/latest',
      params: {
        limit,
        channel: 'business,economy,markets'
      }
    });

    return response.articles.map(item => this.normalizeNewsItem(item));
  }

  public async searchNews(query: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ articles: ReutersNewsItem[] }>({
      method: 'GET',
      url: '/news/v1/search',
      params: {
        q: query,
        limit,
        sortBy: 'relevance'
      }
    });

    return response.articles.map(item => this.normalizeNewsItem(item));
  }

  public async getNewsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ articles: ReutersNewsItem[] }>({
      method: 'GET',
      url: '/news/v1/search',
      params: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        limit,
        sortBy: 'date'
      }
    });

    return response.articles.map(item => this.normalizeNewsItem(item));
  }

  /**
   * Get news items by specific business channel
   */
  public async getNewsByChannel(channel: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ articles: ReutersNewsItem[] }>({
      method: 'GET',
      url: '/news/v1/latest',
      params: {
        channel,
        limit
      }
    });

    return response.articles.map(item => this.normalizeNewsItem(item));
  }

  /**
   * Get news items by specific tag
   */
  public async getNewsByTag(tag: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<{ articles: ReutersNewsItem[] }>({
      method: 'GET',
      url: '/news/v1/search',
      params: {
        tag,
        limit,
        sortBy: 'date'
      }
    });

    return response.articles.map(item => this.normalizeNewsItem(item));
  }
} 