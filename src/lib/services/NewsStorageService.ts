import { createClient } from '@supabase/supabase-js';
import { NormalizedNewsItem } from './NewsNormalizationService';
import { Logger } from '../utils/logger';

export class NewsStorageService {
  private supabase;
  private logger: Logger;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.logger = new Logger('NewsStorageService');
  }

  async storeNewsItems(newsItems: NormalizedNewsItem[]): Promise<void> {
    try {
      // Convert normalized news items to database format
      const dbNewsItems = newsItems.map(item => ({
        title: item.title,
        content: item.content,
        countries: item.countries,
        categories: item.categories,
        impact_level: item.impactLevel,
        price_impact_percentage: item.priceImpact.percentage,
        price_impact_direction: item.priceImpact.direction,
        source_urls: item.sourceUrls,
        publish_date: item.publishDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert news items, skipping duplicates based on title and publish date
      const { error } = await this.supabase
        .from('news_items')
        .upsert(dbNewsItems, {
          onConflict: 'title, publish_date',
          ignoreDuplicates: true
        });

      if (error) {
        throw error;
      }

      this.logger.info(`Successfully stored ${newsItems.length} news items`);
    } catch (error) {
      this.logger.error('Failed to store news items', { error });
      throw error;
    }
  }

  async getLatestNews(limit: number = 20): Promise<NormalizedNewsItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('news_items')
        .select('*')
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Convert database format back to normalized format
      return data.map(item => ({
        title: item.title,
        content: item.content,
        countries: item.countries,
        categories: item.categories,
        impactLevel: item.impact_level,
        priceImpact: {
          percentage: item.price_impact_percentage,
          direction: item.price_impact_direction
        },
        sourceUrls: item.source_urls,
        publishDate: new Date(item.publish_date)
      }));
    } catch (error) {
      this.logger.error('Failed to fetch latest news', { error });
      return [];
    }
  }

  async getNewsByCountry(country: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('news_items')
        .select('*')
        .contains('countries', [country])
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data.map(item => ({
        title: item.title,
        content: item.content,
        countries: item.countries,
        categories: item.categories,
        impactLevel: item.impact_level,
        priceImpact: {
          percentage: item.price_impact_percentage,
          direction: item.price_impact_direction
        },
        sourceUrls: item.source_urls,
        publishDate: new Date(item.publish_date)
      }));
    } catch (error) {
      this.logger.error('Failed to fetch news by country', { error, country });
      return [];
    }
  }

  async getNewsByImpactLevel(level: 'high' | 'medium' | 'low', limit: number = 20): Promise<NormalizedNewsItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('news_items')
        .select('*')
        .eq('impact_level', level)
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data.map(item => ({
        title: item.title,
        content: item.content,
        countries: item.countries,
        categories: item.categories,
        impactLevel: item.impact_level,
        priceImpact: {
          percentage: item.price_impact_percentage,
          direction: item.price_impact_direction
        },
        sourceUrls: item.source_urls,
        publishDate: new Date(item.publish_date)
      }));
    } catch (error) {
      this.logger.error('Failed to fetch news by impact level', { error, level });
      return [];
    }
  }

  async archiveOldNewsItems(daysOld: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .rpc('archive_old_news_items', { days_old: daysOld });

      if (error) {
        throw error;
      }

      this.logger.info(`Successfully archived news items older than ${daysOld} days`);
    } catch (error) {
      this.logger.error('Failed to archive old news items', { error });
      throw error;
    }
  }
} 