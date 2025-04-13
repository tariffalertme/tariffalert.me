import { BaseNewsApiClient, NewsApiConfig } from './BaseNewsApiClient';
import type { NormalizedNewsItem } from '@/types/api';

interface WtoNewsItem {
  title: string;
  description: string;
  publicationDate: string;
  documentUrl: string;
  type: string;
  members: string[];
  subjects: string[];
}

export class WtoApiClient extends BaseNewsApiClient {
  constructor(config: Omit<NewsApiConfig, 'sourceId' | 'sourceName' | 'sourceType'>) {
    super({
      ...config,
      sourceId: 'wto',
      sourceName: 'World Trade Organization',
      sourceType: 'government'
    });
  }

  protected normalizeNewsItem(item: WtoNewsItem): NormalizedNewsItem {
    const normalizedItem: NormalizedNewsItem = {
      title: item.title,
      content: item.description,
      publishedDate: new Date(item.publicationDate),
      sourceUrl: item.documentUrl,
      source: this.sourceName,
      categories: [...item.subjects, ...this.extractCategories({ 
        title: item.title,
        content: item.description,
        publishedDate: new Date(item.publicationDate),
        sourceUrl: item.documentUrl,
        source: this.sourceName,
        categories: item.subjects,
        metadata: {
          type: item.type,
          members: item.members
        }
      })],
      metadata: {
        type: item.type,
        members: item.members
      }
    };

    // Add impact analysis if it's tariff related
    if (this.isTariffRelated(normalizedItem)) {
      normalizedItem.impact = {
        level: this.analyzeImpactLevel(normalizedItem),
        description: `This ${item.type.toLowerCase()} may affect trade between ${item.members.join(', ')}`
      };
    }

    return normalizedItem;
  }

  public async getLatestNews(limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<WtoNewsItem[]>({
      method: 'GET',
      url: '/news',
      params: {
        limit,
        sort: 'publicationDate:desc'
      }
    });

    return response.map(item => this.normalizeNewsItem(item));
  }

  public async searchNews(query: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<WtoNewsItem[]>({
      method: 'GET',
      url: '/news/search',
      params: {
        q: query,
        limit,
        sort: 'relevance'
      }
    });

    return response.map(item => this.normalizeNewsItem(item));
  }

  public async getNewsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<NormalizedNewsItem[]> {
    const response = await this.request<WtoNewsItem[]>({
      method: 'GET',
      url: '/news',
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit,
        sort: 'publicationDate:desc'
      }
    });

    return response.map(item => this.normalizeNewsItem(item));
  }

  /**
   * Get news items specific to a country or region
   */
  public async getNewsByMember(member: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<WtoNewsItem[]>({
      method: 'GET',
      url: '/news',
      params: {
        member,
        limit,
        sort: 'publicationDate:desc'
      }
    });

    return response.map(item => this.normalizeNewsItem(item));
  }

  /**
   * Get news items by specific trade topics
   */
  public async getNewsBySubject(subject: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const response = await this.request<WtoNewsItem[]>({
      method: 'GET',
      url: '/news',
      params: {
        subject,
        limit,
        sort: 'publicationDate:desc'
      }
    });

    return response.map(item => this.normalizeNewsItem(item));
  }
} 