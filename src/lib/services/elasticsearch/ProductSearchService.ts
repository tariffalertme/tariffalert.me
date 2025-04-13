import { ElasticsearchService } from '../ElasticsearchService';
import { Logger } from '../../../../lib/utils/logger';

export interface ProductSearchFilters {
  categories?: string[];
  countries?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  tariffRange?: {
    min?: number;
    max?: number;
  };
  attributes?: Array<{
    name: string;
    value: string;
  }>;
  trends?: string[];
}

export interface ProductSearchOptions {
  query: string;
  filters?: ProductSearchFilters;
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'tariffRate' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export class ProductSearchService {
  private elasticsearchService: ElasticsearchService;
  private logger: Logger;
  private readonly INDEX = 'products';

  constructor(elasticsearchService: ElasticsearchService) {
    this.elasticsearchService = elasticsearchService;
    this.logger = new Logger('ProductSearchService');
  }

  async search(options: ProductSearchOptions) {
    const {
      query,
      filters,
      page = 1,
      pageSize = 10,
      sortBy,
      sortOrder = 'asc'
    } = options;

    try {
      const searchConfig = {
        index: this.INDEX,
        query,
        fields: ['name^2', 'description', 'category'],
        from: (page - 1) * pageSize,
        size: pageSize,
        ...(sortBy && { sort: { [sortBy]: sortOrder } }),
        filters: this.buildFilters(filters),
        aggregations: {
          categories: {
            terms: { field: 'category.keyword', size: 50 }
          },
          countries: {
            terms: { field: 'country', size: 50 }
          },
          priceRanges: {
            range: {
              field: 'price',
              ranges: [
                { to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 200 },
                { from: 200 }
              ]
            }
          },
          tariffRanges: {
            range: {
              field: 'tariffRate',
              ranges: [
                { to: 5 },
                { from: 5, to: 10 },
                { from: 10, to: 20 },
                { from: 20 }
              ]
            }
          },
          attributes: {
            nested: {
              path: 'attributes',
              aggs: {
                names: {
                  terms: { field: 'attributes.name', size: 20 },
                  aggs: {
                    values: {
                      terms: { field: 'attributes.value', size: 20 }
                    }
                  }
                }
              }
            }
          },
          trends: {
            terms: { field: 'trends', size: 20 }
          }
        }
      };

      const result = await this.elasticsearchService.search(searchConfig);
      
      return {
        products: result.hits,
        total: result.total,
        facets: result.aggregations,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize)
      };
    } catch (error) {
      this.logger.error('Error searching products', { error, options });
      return {
        products: [],
        total: 0,
        facets: {},
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  private buildFilters(filters?: ProductSearchFilters) {
    if (!filters) return undefined;

    const result: any = {
      term: {},
      range: {},
      nested: []
    };

    if (filters.categories?.length) {
      result.term['category.keyword'] = filters.categories[0];
    }

    if (filters.countries?.length) {
      result.term.country = filters.countries[0];
    }

    if (filters.priceRange) {
      result.range.price = {
        ...(filters.priceRange.min !== undefined && { gte: filters.priceRange.min }),
        ...(filters.priceRange.max !== undefined && { lte: filters.priceRange.max })
      };
    }

    if (filters.tariffRange) {
      result.range.tariffRate = {
        ...(filters.tariffRange.min !== undefined && { gte: filters.tariffRange.min }),
        ...(filters.tariffRange.max !== undefined && { lte: filters.tariffRange.max })
      };
    }

    if (filters.attributes?.length) {
      result.nested.push({
        path: 'attributes',
        query: {
          bool: {
            must: filters.attributes.map(attr => ({
              bool: {
                must: [
                  { term: { 'attributes.name': attr.name } },
                  { term: { 'attributes.value': attr.value } }
                ]
              }
            }))
          }
        }
      });
    }

    if (filters.trends?.length) {
      result.term.trends = filters.trends[0];
    }

    return result;
  }
} 