import { WtoApiClient } from '../api/WtoApiClient';
import { ReutersApiClient } from '../api/ReutersApiClient';
import { BloombergApiClient } from '../api/BloombergApiClient';
import { CacheService } from './CacheService';
import type { NormalizedNewsItem } from '@/types/api';

export interface NewsSource {
  client: WtoApiClient | ReutersApiClient | BloombergApiClient;
  weight: number; // Priority weight for this source (0-1)
  enabled: boolean;
}

export class NewsAggregatorService {
  private sources: NewsSource[] = [];
  private cache: CacheService;

  constructor(cacheConfig: {
    host: string;
    port: number;
    password?: string;
    defaultTTL?: number;
  }) {
    this.cache = new CacheService(cacheConfig);
  }

  /**
   * Add a news source to the aggregator
   */
  public addSource(source: NewsSource): void {
    this.sources.push(source);
  }

  /**
   * Enable or disable a news source
   */
  public setSourceEnabled(sourceId: string, enabled: boolean): void {
    const source = this.sources.find(s => s.client.sourceId === sourceId);
    if (source) {
      source.enabled = enabled;
    }
  }

  /**
   * Get the latest news from all enabled sources
   */
  public async getLatestNews(limit: number = 20): Promise<NormalizedNewsItem[]> {
    const cacheKey = `latest:${limit}`;
    const cached = await this.cache.getCachedNewsItems(cacheKey);
    if (cached) return cached;

    const sourceLimits = this.calculateSourceLimits(limit);
    const newsPromises = this.sources
      .filter(source => source.enabled)
      .map(source => source.client.getLatestNews(sourceLimits.get(source.client.sourceId) || 0));

    const results = await Promise.allSettled(newsPromises);
    const news = this.processResults(results);
    
    await this.cache.cacheNewsItems(cacheKey, news);
    return news;
  }

  /**
   * Search news across all enabled sources
   */
  public async searchNews(query: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const cacheKey = `search:${query}:${limit}`;
    const cached = await this.cache.getCachedNewsItems(cacheKey);
    if (cached) return cached;

    const sourceLimits = this.calculateSourceLimits(limit);
    const newsPromises = this.sources
      .filter(source => source.enabled)
      .map(source => source.client.searchNews(query, sourceLimits.get(source.client.sourceId) || 0));

    const results = await Promise.allSettled(newsPromises);
    const news = this.processResults(results);
    
    await this.cache.cacheNewsItems(cacheKey, news);
    return news;
  }

  /**
   * Get news from a specific date range across all enabled sources
   */
  public async getNewsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<NormalizedNewsItem[]> {
    const cacheKey = `range:${startDate.toISOString()}:${endDate.toISOString()}:${limit}`;
    const cached = await this.cache.getCachedNewsItems(cacheKey);
    if (cached) return cached;

    const sourceLimits = this.calculateSourceLimits(limit);
    const newsPromises = this.sources
      .filter(source => source.enabled)
      .map(source => source.client.getNewsByDateRange(
        startDate,
        endDate,
        sourceLimits.get(source.client.sourceId) || 0
      ));

    const results = await Promise.allSettled(newsPromises);
    const news = this.processResults(results);
    
    await this.cache.cacheNewsItems(cacheKey, news);
    return news;
  }

  /**
   * Calculate how many items to request from each source based on weights
   */
  private calculateSourceLimits(totalLimit: number): Map<string, number> {
    const enabledSources = this.sources.filter(s => s.enabled);
    const totalWeight = enabledSources.reduce((sum, source) => sum + source.weight, 0);
    
    const limits = new Map<string, number>();
    enabledSources.forEach(source => {
      const sourceLimit = Math.max(1, Math.round((source.weight / totalWeight) * totalLimit));
      limits.set(source.client.sourceId, sourceLimit);
    });

    return limits;
  }

  /**
   * Process results from multiple sources and combine them
   */
  private processResults(results: PromiseSettledResult<NormalizedNewsItem[]>[]): NormalizedNewsItem[] {
    const allNews: NormalizedNewsItem[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
      // Failed requests are silently ignored to maintain service availability
    });

    // Sort by date, most recent first
    return allNews.sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
  }

  /**
   * Get news items filtered by impact level
   */
  public async getNewsByImpactLevel(
    level: 'low' | 'medium' | 'high',
    limit: number = 20
  ): Promise<NormalizedNewsItem[]> {
    const allNews = await this.getLatestNews(limit * 2); // Fetch more to account for filtering
    return allNews
      .filter(item => item.impact?.level === level)
      .slice(0, limit);
  }

  /**
   * Get news items filtered by category
   */
  public async getNewsByCategory(category: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    const allNews = await this.getLatestNews(limit * 2); // Fetch more to account for filtering
    return allNews
      .filter(item => item.categories.some(cat => cat.toLowerCase() === category.toLowerCase()))
      .slice(0, limit);
  }

  /**
   * Get trending topics based on recent news
   */
  public async getTrendingTopics(days: number = 7): Promise<Array<{ topic: string; count: number }>> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const news = await this.getNewsByDateRange(startDate, endDate, 100);
    const topicCounts = new Map<string, number>();

    news.forEach(item => {
      item.categories.forEach(category => {
        const count = topicCounts.get(category) || 0;
        topicCounts.set(category, count + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }

  public async cleanup(): Promise<void> {
    await this.cache.disconnect();
  }
} 