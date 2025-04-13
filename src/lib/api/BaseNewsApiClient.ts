import { BaseApiClient } from './BaseApiClient';
import type { ApiClientConfig } from '@/types/api';
import type { NormalizedNewsItem } from '@/types/api';

export interface NewsApiConfig extends ApiClientConfig {
  sourceId: string;
  sourceName: string;
  sourceType: 'government' | 'news' | 'social';
}

export abstract class BaseNewsApiClient extends BaseApiClient {
  public readonly sourceId: string;
  protected readonly sourceName: string;
  protected readonly sourceType: string;

  constructor(config: NewsApiConfig) {
    super(config);
    this.sourceId = config.sourceId;
    this.sourceName = config.sourceName;
    this.sourceType = config.sourceType;
  }

  /**
   * Normalize a source-specific news item into the standard format
   */
  protected abstract normalizeNewsItem(item: any): NormalizedNewsItem;

  /**
   * Get the latest news items from this source
   */
  public abstract getLatestNews(limit?: number): Promise<NormalizedNewsItem[]>;

  /**
   * Search for news items by keywords
   */
  public abstract searchNews(query: string, limit?: number): Promise<NormalizedNewsItem[]>;

  /**
   * Get news items from a specific date range
   */
  public abstract getNewsByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<NormalizedNewsItem[]>;

  /**
   * Check if a news item is related to tariffs
   */
  protected isTariffRelated(item: NormalizedNewsItem): boolean {
    const tariffKeywords = [
      'tariff',
      'trade war',
      'import duty',
      'export duty',
      'customs duty',
      'trade policy',
      'trade restriction',
      'trade barrier',
      'trade regulation',
      'import tax',
      'export tax',
      'trade agreement',
      'trade dispute',
      'WTO',
      'World Trade Organization'
    ];

    const textToSearch = [
      item.title.toLowerCase(),
      item.content.toLowerCase(),
      ...(item.categories || []).map(c => c.toLowerCase())
    ].join(' ');

    return tariffKeywords.some(keyword => textToSearch.includes(keyword.toLowerCase()));
  }

  /**
   * Extract impact level from news content
   */
  protected analyzeImpactLevel(item: NormalizedNewsItem): 'low' | 'medium' | 'high' {
    // Simple keyword-based impact analysis
    const highImpactKeywords = ['major', 'significant', 'substantial', 'dramatic'];
    const mediumImpactKeywords = ['moderate', 'notable', 'considerable'];
    const textToAnalyze = [item.title, item.content].join(' ').toLowerCase();

    if (highImpactKeywords.some(keyword => textToAnalyze.includes(keyword))) {
      return 'high';
    }

    if (mediumImpactKeywords.some(keyword => textToAnalyze.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract relevant categories from news content
   */
  protected extractCategories(item: NormalizedNewsItem): string[] {
    const categories = new Set<string>();
    
    // Add source type as a category
    categories.add(this.sourceType);

    // Add basic tariff category if relevant
    if (this.isTariffRelated(item)) {
      categories.add('tariffs');
    }

    // Extract industry sectors if mentioned
    const sectors = [
      'agriculture',
      'automotive',
      'electronics',
      'energy',
      'manufacturing',
      'technology',
      'textiles',
      'steel',
      'aluminum'
    ];

    const textToSearch = [item.title, item.content].join(' ').toLowerCase();
    sectors.forEach(sector => {
      if (textToSearch.includes(sector)) {
        categories.add(sector);
      }
    });

    return Array.from(categories);
  }
} 