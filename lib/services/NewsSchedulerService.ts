import cron from 'node-cron';
import { UstrApiClient } from '../api/UstrApiClient';
import { WtoApiClient } from '../api/WtoApiClient';
import { NewsNormalizationService } from './NewsNormalizationService';
import { NewsStorageService } from './NewsStorageService';
import { Logger } from '../../src/lib/utils/logger';

export class NewsSchedulerService {
  private readonly logger: Logger;
  private readonly normalizationService: NewsNormalizationService;
  private readonly storageService: NewsStorageService;
  private readonly cronJob: cron.ScheduledTask;

  constructor() {
    this.logger = new Logger('NewsSchedulerService');

    // Initialize API clients
    const ustrClient = new UstrApiClient({
      apiKey: '',
      logger: new Logger('UstrApiClient')
    });
    const wtoClient = new WtoApiClient({
      apiKey: '',
      logger: new Logger('WtoApiClient')
    });

    // Initialize services
    this.normalizationService = new NewsNormalizationService(ustrClient, wtoClient);
    this.storageService = new NewsStorageService();

    // Schedule news aggregation
    this.cronJob = cron.schedule('0 */6 * * *', () => {
      this.aggregateNews();
    });
  }

  private async aggregateNews(): Promise<void> {
    try {
      const news = await this.normalizationService.aggregateLatestNews();
      this.logger.info(`Aggregated ${news.length} news items`);
      // TODO: Store news items in database
    } catch (error) {
      this.logger.error('Failed to aggregate news', { error: String(error) });
    }
  }

  start(): void {
    this.logger.info('Starting news scheduler');
    this.cronJob.start();
  }

  stop(): void {
    this.logger.info('Stopping news scheduler');
    this.cronJob.stop();
  }
} 