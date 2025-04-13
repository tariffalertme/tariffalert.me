import { ElasticsearchService } from '../ElasticsearchService';
import { productIndexMappings, newsIndexMappings } from './mappings';
import { Logger } from '../../../../lib/utils/logger';

export class ElasticsearchInitService {
  private elasticsearchService: ElasticsearchService;
  private logger: Logger;

  constructor(elasticsearchService: ElasticsearchService) {
    this.elasticsearchService = elasticsearchService;
    this.logger = new Logger('ElasticsearchInitService');
  }

  async initializeIndices(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.initializeProductIndex(),
        this.initializeNewsIndex()
      ]);

      return results.every(result => result === true);
    } catch (error) {
      this.logger.error('Failed to initialize indices', { error });
      return false;
    }
  }

  private async initializeProductIndex(): Promise<boolean> {
    const indexName = 'products';
    const success = await this.elasticsearchService.createIndex(indexName, productIndexMappings);
    
    if (success) {
      this.logger.info(`Successfully initialized ${indexName} index`);
    } else {
      this.logger.error(`Failed to initialize ${indexName} index`);
    }

    return success;
  }

  private async initializeNewsIndex(): Promise<boolean> {
    const indexName = 'news';
    const success = await this.elasticsearchService.createIndex(indexName, newsIndexMappings);
    
    if (success) {
      this.logger.info(`Successfully initialized ${indexName} index`);
    } else {
      this.logger.error(`Failed to initialize ${indexName} index`);
    }

    return success;
  }
} 