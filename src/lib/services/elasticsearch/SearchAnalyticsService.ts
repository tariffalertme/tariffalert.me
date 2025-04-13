import { ElasticsearchService } from '../ElasticsearchService';
import { Logger } from '../../../../lib/utils/logger';

export interface SearchAnalytics {
  totalSearches: number;
  averageResponseTime: number;
  topQueries: Array<{
    query: string;
    count: number;
    averageResults: number;
  }>;
  topFilters: Array<{
    filter: string;
    count: number;
  }>;
  noResultQueries: Array<{
    query: string;
    count: number;
  }>;
  queryTrends: Array<{
    date: string;
    searches: number;
  }>;
}

export interface SearchSuggestion {
  text: string;
  score: number;
  type: 'product' | 'category' | 'trend';
}

export class SearchAnalyticsService {
  private elasticsearchService: ElasticsearchService;
  private logger: Logger;
  private readonly ANALYTICS_INDEX = 'search_analytics';

  constructor(elasticsearchService: ElasticsearchService) {
    this.elasticsearchService = elasticsearchService;
    this.logger = new Logger('SearchAnalyticsService');
  }

  async logSearchEvent(event: {
    query: string;
    filters?: Record<string, any>;
    resultCount: number;
    responseTime: number;
    userId?: string;
  }): Promise<boolean> {
    try {
      const searchEvent = {
        ...event,
        timestamp: new Date().toISOString(),
      };

      const success = await this.elasticsearchService.indexDocument(
        this.ANALYTICS_INDEX,
        searchEvent
      );

      if (success) {
        this.logger.info('Logged search event', { query: event.query });
      }

      return success;
    } catch (error) {
      this.logger.error('Error logging search event', { error, event });
      return false;
    }
  }

  async getSearchAnalytics(timeframe: 'day' | 'week' | 'month'): Promise<SearchAnalytics> {
    try {
      const dateRange = this.getDateRange(timeframe);

      const searchConfig = {
        index: this.ANALYTICS_INDEX,
        query: '*',
        size: 0,
        filters: {
          range: {
            timestamp: dateRange
          }
        },
        aggregations: {
          total_searches: {
            value_count: {
              field: 'query'
            }
          },
          avg_response_time: {
            avg: {
              field: 'responseTime'
            }
          },
          top_queries: {
            terms: {
              field: 'query',
              size: 10
            },
            aggs: {
              avg_results: {
                avg: {
                  field: 'resultCount'
                }
              }
            }
          },
          top_filters: {
            nested: {
              path: 'filters'
            },
            aggs: {
              filter_names: {
                terms: {
                  field: 'filters.name',
                  size: 10
                }
              }
            }
          },
          no_results: {
            filter: {
              term: {
                resultCount: 0
              }
            },
            aggs: {
              queries: {
                terms: {
                  field: 'query',
                  size: 10
                }
              }
            }
          },
          query_trends: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: this.getTimeframeInterval(timeframe)
            }
          }
        }
      };

      const result = await this.elasticsearchService.search(searchConfig);
      const aggs = result.aggregations || {};

      return {
        totalSearches: aggs.total_searches?.value || 0,
        averageResponseTime: aggs.avg_response_time?.value || 0,
        topQueries: (aggs.top_queries?.buckets || []).map((bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count,
          averageResults: bucket.avg_results?.value || 0
        })),
        topFilters: (aggs.top_filters?.filter_names?.buckets || []).map((bucket: any) => ({
          filter: bucket.key,
          count: bucket.doc_count
        })),
        noResultQueries: (aggs.no_results?.queries?.buckets || []).map((bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count
        })),
        queryTrends: (aggs.query_trends?.buckets || []).map((bucket: any) => ({
          date: bucket.key_as_string,
          searches: bucket.doc_count
        }))
      };
    } catch (error) {
      this.logger.error('Error getting search analytics', { error, timeframe });
      return {
        totalSearches: 0,
        averageResponseTime: 0,
        topQueries: [],
        topFilters: [],
        noResultQueries: [],
        queryTrends: []
      };
    }
  }

  async getSuggestions(prefix: string, context?: {
    category?: string;
    country?: string;
  }): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      // Get product name suggestions
      const productSuggestions = await this.elasticsearchService.suggest<any>(
        'products',
        'name.completion',
        prefix
      );

      suggestions.push(...productSuggestions.map(p => ({
        text: p.name,
        score: 1.0,
        type: 'product' as const
      })));

      // Get category suggestions
      const categoryConfig = {
        index: 'products',
        query: prefix,
        size: 0,
        aggregations: {
          categories: {
            terms: {
              field: 'category.keyword',
              include: `${prefix}.*`
            }
          }
        }
      };

      const categoryResult = await this.elasticsearchService.search(categoryConfig);
      const categories = categoryResult.aggregations?.categories?.buckets || [];

      suggestions.push(...categories.map((c: any) => ({
        text: c.key,
        score: 0.8,
        type: 'category' as const
      })));

      // Get trend suggestions
      const trendConfig = {
        index: 'products',
        query: prefix,
        size: 0,
        aggregations: {
          trends: {
            terms: {
              field: 'trends',
              include: `${prefix}.*`
            }
          }
        }
      };

      const trendResult = await this.elasticsearchService.search(trendConfig);
      const trends = trendResult.aggregations?.trends?.buckets || [];

      suggestions.push(...trends.map((t: any) => ({
        text: t.key,
        score: 0.6,
        type: 'trend' as const
      })));

      return suggestions.sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error('Error getting suggestions', { error, prefix });
      return [];
    }
  }

  private getTimeframeInterval(timeframe: string): string {
    switch (timeframe) {
      case 'day':
        return 'hour';
      case 'week':
        return 'day';
      case 'month':
        return 'day';
      default:
        return 'day';
    }
  }

  private getDateRange(timeframe: string): Record<string, string> {
    const now = new Date();
    const gte = new Date();

    switch (timeframe) {
      case 'day':
        gte.setDate(now.getDate() - 1);
        break;
      case 'week':
        gte.setDate(now.getDate() - 7);
        break;
      case 'month':
        gte.setMonth(now.getMonth() - 1);
        break;
    }

    return {
      gte: gte.toISOString(),
      lte: now.toISOString()
    };
  }
} 