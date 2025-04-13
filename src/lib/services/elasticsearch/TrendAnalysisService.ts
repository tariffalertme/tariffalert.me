import { ElasticsearchService } from '../ElasticsearchService';
import { Logger } from '../../../../lib/utils/logger';

export interface TrendAnalysisOptions {
  timeframe: 'day' | 'week' | 'month' | 'year';
  category?: string;
  country?: string;
  minOccurrences?: number;
}

export interface TrendMetrics {
  trend: string;
  occurrences: number;
  averageTariffRate: number;
  priceImpact: number;
  relatedProducts: number;
  newsCount: number;
}

export class TrendAnalysisService {
  private elasticsearchService: ElasticsearchService;
  private logger: Logger;
  private readonly PRODUCTS_INDEX = 'products';
  private readonly NEWS_INDEX = 'news';

  constructor(elasticsearchService: ElasticsearchService) {
    this.elasticsearchService = elasticsearchService;
    this.logger = new Logger('TrendAnalysisService');
  }

  async analyzeTrends(options: TrendAnalysisOptions): Promise<TrendMetrics[]> {
    try {
      const { timeframe, category, country, minOccurrences = 5 } = options;

      const interval = this.getTimeframeInterval(timeframe);
      const dateRange = this.getDateRange(timeframe);

      const searchConfig = {
        index: this.PRODUCTS_INDEX,
        query: '*',
        size: 0,
        filters: {
          ...(category && { term: { 'category.keyword': category } }),
          ...(country && { term: { country } }),
          range: {
            updatedAt: dateRange
          }
        },
        aggregations: {
          trends: {
            terms: {
              field: 'trends',
              size: 20,
              min_doc_count: minOccurrences
            },
            aggs: {
              tariffStats: {
                stats: { field: 'tariffRate' }
              },
              priceStats: {
                stats: { field: 'price' }
              },
              timeAnalysis: {
                date_histogram: {
                  field: 'updatedAt',
                  calendar_interval: interval
                }
              }
            }
          }
        }
      };

      const result = await this.elasticsearchService.search(searchConfig);
      const trends = result.aggregations?.trends?.buckets || [];

      // Get news counts for each trend
      const trendNewsCount = await this.getNewsCountByTrends(
        trends.map((t: any) => t.key),
        dateRange
      );

      return trends.map((trend: any) => ({
        trend: trend.key,
        occurrences: trend.doc_count,
        averageTariffRate: trend.tariffStats.avg,
        priceImpact: trend.priceStats.avg,
        relatedProducts: trend.doc_count,
        newsCount: trendNewsCount[trend.key] || 0
      }));
    } catch (error) {
      this.logger.error('Error analyzing trends', { error, options });
      return [];
    }
  }

  private async getNewsCountByTrends(
    trends: string[],
    dateRange: Record<string, string>
  ): Promise<Record<string, number>> {
    try {
      const searchConfig = {
        index: this.NEWS_INDEX,
        query: '*',
        size: 0,
        filters: {
          range: {
            publishedAt: dateRange
          }
        },
        aggregations: {
          trendCounts: {
            terms: {
              field: 'tags',
              include: trends
            }
          }
        }
      };

      const result = await this.elasticsearchService.search(searchConfig);
      const counts: Record<string, number> = {};
      
      result.aggregations?.trendCounts?.buckets?.forEach((bucket: any) => {
        counts[bucket.key] = bucket.doc_count;
      });

      return counts;
    } catch (error) {
      this.logger.error('Error getting news counts by trends', { error, trends });
      return {};
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
      case 'year':
        return 'month';
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
      case 'year':
        gte.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      gte: gte.toISOString(),
      lte: now.toISOString()
    };
  }
} 