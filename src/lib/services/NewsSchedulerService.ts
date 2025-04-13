import cron from 'node-cron';
import { NewsAggregatorService } from './NewsAggregatorService';
import type { NormalizedNewsItem } from '@/types/api';
import { Logger } from '../../../lib/utils/logger';

export interface NewsFilter {
  id: string;
  name: string;
  keywords: string[];
  categories?: string[];
  minImpactLevel?: 'low' | 'medium' | 'high';
  sources?: string[];
  enabled: boolean;
}

export class NewsSchedulerService {
  private readonly aggregator: NewsAggregatorService;
  private readonly logger: Logger;
  private filters: NewsFilter[] = [];
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(aggregator: NewsAggregatorService) {
    this.aggregator = aggregator;
    this.logger = new Logger('NewsSchedulerService');
  }

  /**
   * Add a news filter
   */
  public addFilter(filter: NewsFilter): void {
    this.filters.push(filter);
  }

  /**
   * Remove a news filter
   */
  public removeFilter(filterId: string): void {
    this.filters = this.filters.filter(f => f.id !== filterId);
  }

  /**
   * Enable or disable a filter
   */
  public setFilterEnabled(filterId: string, enabled: boolean): void {
    const filter = this.filters.find(f => f.id === filterId);
    if (filter) {
      filter.enabled = enabled;
    }
  }

  /**
   * Schedule regular news fetching
   */
  public scheduleNewsFetching(cronExpression: string, jobId: string): void {
    if (this.jobs.has(jobId)) {
      this.logger.warn(`Job ${jobId} already exists. Stopping existing job.`);
      this.stopJob(jobId);
    }

    const job = cron.schedule(cronExpression, async () => {
      try {
        this.logger.info(`Starting scheduled news fetch: ${jobId}`);
        const news = await this.aggregator.getLatestNews(50);
        const filteredNews = await this.applyFilters(news);
        
        // Here you would typically:
        // 1. Store the filtered news in the database
        // 2. Send notifications if configured
        // 3. Update any real-time feeds
        
        this.logger.info(`Completed scheduled news fetch: ${jobId}`, {
          total: news.length,
          filtered: filteredNews.length
        });
      } catch (error) {
        this.logger.error(`Failed to fetch news for job: ${jobId}`, { error });
      }
    });

    this.jobs.set(jobId, job);
    this.logger.info(`Scheduled new job: ${jobId} with cron: ${cronExpression}`);
  }

  /**
   * Stop a scheduled job
   */
  public stopJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.stop();
      this.jobs.delete(jobId);
      this.logger.info(`Stopped job: ${jobId}`);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  public stopAllJobs(): void {
    for (const [jobId, job] of this.jobs) {
      job.stop();
      this.logger.info(`Stopped job: ${jobId}`);
    }
    this.jobs.clear();
  }

  /**
   * Apply filters to news items
   */
  private async applyFilters(news: NormalizedNewsItem[]): Promise<NormalizedNewsItem[]> {
    const enabledFilters = this.filters.filter(f => f.enabled);
    if (enabledFilters.length === 0) return news;

    return news.filter(item => {
      return enabledFilters.some(filter => {
        // Check keywords
        const textToSearch = [
          item.title.toLowerCase(),
          item.content.toLowerCase()
        ].join(' ');
        const hasKeyword = filter.keywords.some(keyword => 
          textToSearch.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;

        // Check categories
        if (filter.categories && filter.categories.length > 0) {
          const hasCategory = item.categories.some(category =>
            filter.categories!.includes(category)
          );
          if (!hasCategory) return false;
        }

        // Check impact level
        if (filter.minImpactLevel && item.impact) {
          const impactLevels = { low: 0, medium: 1, high: 2 };
          if (impactLevels[item.impact.level] < impactLevels[filter.minImpactLevel]) {
            return false;
          }
        }

        // Check sources
        if (filter.sources && filter.sources.length > 0) {
          if (!filter.sources.includes(item.source)) {
            return false;
          }
        }

        return true;
      });
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopAllJobs();
  }
} 