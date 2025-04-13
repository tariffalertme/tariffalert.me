import { Client } from '@elastic/elasticsearch';
import { Logger } from '../../../lib/utils/logger';
import { SearchSuggest, SearchCompletionSuggestOption } from '@elastic/elasticsearch/lib/api/types';

interface SearchConfig {
  index: string;
  query: string;
  fields?: string[];
  from?: number;
  size?: number;
  sort?: Record<string, 'asc' | 'desc'>;
  filters?: {
    term?: Record<string, string | number | boolean>;
    range?: Record<string, { gte?: number; lte?: number }>;
    nested?: Array<{
      path: string;
      query: Record<string, any>;
    }>;
  };
  aggregations?: Record<string, {
    terms?: { field: string; size?: number };
    range?: {
      field: string;
      ranges: Array<{ from?: number; to?: number }>;
    };
    nested?: {
      path: string;
      aggs: Record<string, any>;
    };
  }>;
}

interface SearchResult<T> {
  hits: T[];
  total: number;
  took: number;
  aggregations?: Record<string, any>;
}

interface BulkOperation<T> {
  index: {
    _index: string;
    _id?: string;
  };
  doc: T;
}

export class ElasticsearchService {
  private client: Client;
  private logger: Logger;

  constructor(nodeUrl: string) {
    this.client = new Client({ node: nodeUrl });
    this.logger = new Logger('ElasticsearchService');
  }

  async createIndex(index: string, mappings: Record<string, any>): Promise<boolean> {
    try {
      const exists = await this.client.indices.exists({ index });
      if (exists) {
        this.logger.info(`Index ${index} already exists`);
        return true;
      }

      await this.client.indices.create({
        index,
        body: {
          mappings,
        },
      });

      this.logger.info(`Created index ${index}`);
      return true;
    } catch (error) {
      this.logger.error('Error creating index', { error, index });
      return false;
    }
  }

  async indexDocument<T extends Record<string, any>>(
    index: string,
    document: T,
    id?: string
  ): Promise<boolean> {
    try {
      const params = {
        index,
        body: document,
        ...(id && { id }),
      };

      await this.client.index(params);
      this.logger.info(`Indexed document in ${index}`, { id });
      return true;
    } catch (error) {
      this.logger.error('Error indexing document', { error, index, id });
      return false;
    }
  }

  async bulkIndex<T extends Record<string, any>>(
    operations: BulkOperation<T>[]
  ): Promise<boolean> {
    try {
      const body = operations.flatMap((item: BulkOperation<T>) => [
        { index: item.index },
        item.doc,
      ]);

      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        const errorItems = response.items.filter((item: any) => item.index.error);
        this.logger.error('Bulk indexing had errors', { errors: errorItems });
        return false;
      }

      this.logger.info(`Bulk indexed ${operations.length} documents`);
      return true;
    } catch (error) {
      this.logger.error('Error performing bulk index', { error });
      return false;
    }
  }

  async search<T>(config: SearchConfig): Promise<SearchResult<T>> {
    try {
      const { 
        index, 
        query, 
        fields = ['*'], 
        from = 0, 
        size = 10, 
        sort,
        filters,
        aggregations 
      } = config;

      const must = [{
        multi_match: {
          query,
          fields,
        }
      }];

      if (filters?.term) {
        Object.entries(filters.term).forEach(([field, value]) => {
          must.push({ term: { [field]: value } });
        });
      }

      if (filters?.range) {
        Object.entries(filters.range).forEach(([field, range]) => {
          must.push({ range: { [field]: range } });
        });
      }

      if (filters?.nested) {
        filters.nested.forEach(nested => {
          must.push({
            nested: {
              path: nested.path,
              query: nested.query
            }
          });
        });
      }

      const searchParams = {
        index,
        body: {
          query: {
            bool: {
              must
            }
          },
          from,
          size,
          ...(sort && { sort }),
          ...(aggregations && { aggs: aggregations })
        },
      };

      const response = await this.client.search(searchParams);
      const hits = response.hits?.hits?.map((hit: any) => hit._source as T) || [];
      
      const result: SearchResult<T> = {
        hits,
        total: (response.hits?.total as { value: number })?.value || 0,
        took: response.took || 0,
        ...(response.aggregations && { aggregations: response.aggregations })
      };

      this.logger.info(`Search completed`, {
        index,
        total: result.total,
        took: result.took,
      });

      return result;
    } catch (error) {
      this.logger.error('Error performing search', { error, config });
      return {
        hits: [],
        total: 0,
        took: 0
      };
    }
  }

  async suggest<T>(index: string, field: string, prefix: string): Promise<T[]> {
    try {
      const response = await this.client.search({
        index,
        body: {
          suggest: {
            suggestions: {
              prefix,
              completion: {
                field,
                size: 5,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      const options = response.suggest?.suggestions?.[0]?.options || [];
      const suggestions = (options as SearchCompletionSuggestOption<T>[]).map(
        (option) => option._source as T
      );

      this.logger.info(`Suggestions fetched`, {
        index,
        field,
        count: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      this.logger.error('Error fetching suggestions', { error, index, field });
      return [];
    }
  }

  async deleteIndex(index: string): Promise<boolean> {
    try {
      await this.client.indices.delete({ index });
      this.logger.info(`Deleted index ${index}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting index', { error, index });
      return false;
    }
  }

  async deleteDocument(index: string, id: string): Promise<boolean> {
    try {
      await this.client.delete({ index, id });
      this.logger.info(`Deleted document from ${index}`, { id });
      return true;
    } catch (error) {
      this.logger.error('Error deleting document', { error, index, id });
      return false;
    }
  }
} 