import { ElasticsearchService } from '../ElasticsearchService';
import { Logger } from '../../../../lib/utils/logger';

export interface NewsSearchFilters {
  sources?: string[];
  categories?: string[];
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  relatedProducts?: string[];
}

export interface NewsSearchOptions {
  query: string;
  filters?: NewsSearchFilters;
  page?: number;
  pageSize?: number;
  sortBy?: 'publishedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class NewsSearchService {
  private elasticsearchService: ElasticsearchService;
  private logger: Logger;
  private readonly INDEX = 'news';

  constructor(elasticsearchService: ElasticsearchService) {
    this.elasticsearchService = elasticsearchService;
    this.logger = new Logger('NewsSearchService');
  }

  async search(options: NewsSearchOptions) {
    const {
      query,
      filters,
      page = 1,
      pageSize = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = options;

    try {
      const searchConfig = {
        index: this.INDEX,
        query,
        fields: ['title^2', 'content', 'tags.text'],
        from: (page - 1) * pageSize,
        size: pageSize,
        sort: { [sortBy]: sortOrder },
        filters: this.buildFilters(filters),
        aggregations: {
          sources: {
            terms: { field: 'source', size: 20 }
          },
          categories: {
            terms: { field: 'category', size: 20 }
          },
          tags: {
            terms: { field: 'tags', size: 50 }
          },
          dateHistogram: {
            date_histogram: {
              field: 'publishedAt',
              calendar_interval: 'month'
            }
          },
          relatedProducts: {
            nested: {
              path: 'relatedProducts',
              aggs: {
                products: {
                  terms: { field: 'relatedProducts.name', size: 20 }
                }
              }
            }
          }
        }
      };

      const result = await this.elasticsearchService.search(searchConfig);
      
      return {
        articles: result.hits,
        total: result.total,
        facets: result.aggregations,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize)
      };
    } catch (error) {
      this.logger.error('Error searching news articles', { error, options });
      return {
        articles: [],
        total: 0,
        facets: {},
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  private buildFilters(filters?: NewsSearchFilters) {
    if (!filters) return undefined;

    const result: any = {
      term: {},
      range: {},
      nested: []
    };

    if (filters.sources?.length) {
      result.term.source = filters.sources[0];
    }

    if (filters.categories?.length) {
      result.term.category = filters.categories[0];
    }

    if (filters.tags?.length) {
      result.term.tags = filters.tags[0];
    }

    if (filters.dateRange) {
      result.range.publishedAt = {
        ...(filters.dateRange.from && { gte: filters.dateRange.from }),
        ...(filters.dateRange.to && { lte: filters.dateRange.to })
      };
    }

    if (filters.relatedProducts?.length) {
      result.nested.push({
        path: 'relatedProducts',
        query: {
          term: { 'relatedProducts.id': filters.relatedProducts[0] }
        }
      });
    }

    return result;
  }
} 