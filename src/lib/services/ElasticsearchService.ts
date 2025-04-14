import { Client, type estypes } from '@elastic/elasticsearch';
import { Logger } from '@/lib/utils/logger';
import { createSpan, addSpanAttribute } from '@/lib/telemetry/tracer';

interface SearchConfig {
  query: string;
  fields?: string[];
  from?: number;
  size?: number;
}

interface SearchResult<T> {
  hits: T[];
  total: number;
  took: number;
}

interface BulkOperation {
  index: string;
  id: string;
  document: Record<string, any>;
}

interface ElasticsearchError {
  meta?: {
    body?: {
      error?: {
        type?: string;
        reason?: string;
      };
    };
  };
  message?: string;
}

export class ElasticsearchService {
  private client: Client;
  private logger: Logger;

  constructor(nodeUrl: string, apiKey: string) {
    this.client = new Client({
      node: nodeUrl,
      auth: {
        apiKey: apiKey
      }
    });
    this.logger = new Logger('ElasticsearchService');
  }

  private async handleError(error: unknown, operation: string): Promise<never> {
    const esError = error as ElasticsearchError;
    const errorMessage = esError.meta?.body?.error?.reason || esError.message || 'Unknown error';
    const errorType = esError.meta?.body?.error?.type || 'UnknownError';
    
    this.logger.error(`Error during ${operation}: ${errorType} - ${errorMessage}`);
    throw new Error(`Elasticsearch error during ${operation}: ${errorType} - ${errorMessage}`);
  }

  async createIndex(index: string): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index });
      
      if (!exists) {
        await this.client.indices.create({
          index,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text' },
              description: { type: 'text' },
              price: { type: 'float' },
              currency: { type: 'keyword' },
              category: { type: 'keyword' },
              brand: { type: 'keyword' },
              url: { type: 'keyword' },
              imageUrl: { type: 'keyword' },
              source: { type: 'keyword' },
              timestamp: { type: 'date' },
              // Add completion suggester for autocomplete
              suggest: {
                type: 'completion',
                analyzer: 'simple',
                preserve_separators: true,
                preserve_position_increments: true,
                max_input_length: 50
              }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            'index.mapping.total_fields.limit': 2000
          }
        });
        this.logger.info(`Created index: ${index}`);
      }
    } catch (error) {
      await this.handleError(error, `creating index ${index}`);
    }
  }

  async indexDocument<T extends Record<string, any>>(index: string, id: string, document: T): Promise<void> {
    try {
      await this.createIndex(index);
      await this.client.index({
        index,
        id,
        document: {
          ...document,
          timestamp: new Date().toISOString()
        }
      });
      this.logger.debug(`Indexed document ${id} in ${index}`);
    } catch (error) {
      await this.handleError(error, `indexing document ${id}`);
    }
  }

  async bulkIndex(operations: BulkOperation[]): Promise<void> {
    try {
      // Ensure all indices exist
      const uniqueIndices = [...new Set(operations.map(op => op.index))];
      await Promise.all(uniqueIndices.map(index => this.createIndex(index)));

      const body = operations.flatMap(op => [
        { index: { _index: op.index, _id: op.id } },
        { ...op.document, timestamp: new Date().toISOString() }
      ]);

      const { items } = await this.client.bulk({ body });
      
      // Log any errors that occurred during bulk indexing
      items.forEach((item, i) => {
        const operation = item.index || item.create || item.update || item.delete;
        if (operation?.error) {
          this.logger.error(`Error in bulk operation ${i}: ${operation.error.reason}`);
        }
      });

      this.logger.info(`Bulk indexed ${operations.length} documents`);
    } catch (error) {
      await this.handleError(error, 'bulk indexing');
    }
  }

  async search<T>(config: SearchConfig): Promise<SearchResult<T>> {
    try {
      const { 
        query, 
        fields = ['*'], 
        from = 0, 
        size = 10 
      } = config;

      const response = await this.client.search({
        index: 'your_index_name',
        body: {
          query: {
            multi_match: {
              query,
              fields,
            }
          },
          from,
          size,
        },
      });
      const hits = response.hits?.hits?.map((hit: any) => hit._source as T) || [];
      
      const result: SearchResult<T> = {
        hits,
        total: (response.hits?.total as { value: number })?.value || 0,
        took: response.took || 0,
      };

      this.logger.info(`Search completed`, {
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
    return createSpan('elasticsearch.suggest', async () => {
      try {
        addSpanAttribute('elasticsearch.index', index);
        addSpanAttribute('elasticsearch.field', field);
        addSpanAttribute('elasticsearch.prefix', prefix);

        interface SuggestResponse extends estypes.SearchResponse<T> {
          suggest?: {
            suggestions?: Array<{
              options?: Array<{
                _source: T;
              }>;
            }>;
          };
        }

        const response = await this.client.search<SuggestResponse>({
          index,
          body: {
            suggest: {
              suggestions: {
                prefix,
                completion: {
                  field,
                  size: 10,
                  skip_duplicates: true,
                  fuzzy: {
                    fuzziness: 'AUTO'
                  }
                }
              }
            }
          }
        });

        const suggestions = response.suggest?.suggestions?.[0]?.options || [];
        addSpanAttribute('elasticsearch.suggestions.count', suggestions.length);
        return suggestions.map(option => option._source);
      } catch (error) {
        await this.handleError(error, `getting suggestions for ${prefix}`);
        return [];
      }
    });
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