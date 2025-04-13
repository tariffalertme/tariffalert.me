import { Logger } from '../../../lib/utils/logger';
import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/postgrest-js';
import { Database } from '../../../types/database';

export interface AffiliateConfig {
  amazonTag: string;
  walmartId: string;
  targetId: string;
}

export interface AffiliateClick {
  id: string;
  productId: string;
  userId?: string;
  platform: string;
  timestamp: Date;
  referrer?: string;
  deviceType: string;
  converted: boolean;
  revenue?: number;
}

export interface AffiliateStats {
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

export class AffiliateService {
  private readonly logger: Logger;
  private readonly supabase: SupabaseClient<Database>;
  private readonly config: AffiliateConfig;

  constructor(
    supabase: SupabaseClient<Database>,
    config: AffiliateConfig,
    logger: Logger
  ) {
    this.supabase = supabase;
    this.config = config;
    this.logger = logger;
  }

  async generateAffiliateLink(productId: string, platform: string, url: string): Promise<string> {
    try {
      const baseUrl = new URL(url);
      const clickId = this.generateClickId();
      
      // Add our click tracking parameter
      baseUrl.searchParams.set('taclick', clickId);

      // Add platform-specific affiliate parameters
      switch (platform.toLowerCase()) {
        case 'amazon':
          baseUrl.searchParams.set('tag', this.config.amazonTag);
          break;
        case 'walmart':
          baseUrl.searchParams.set('affId', this.config.walmartId);
          break;
        case 'target':
          baseUrl.searchParams.set('aid', this.config.targetId);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      return baseUrl.toString();
    } catch (error) {
      this.logger.error('Error generating affiliate link', {
        error,
        productId,
        platform,
        url
      });
      throw error;
    }
  }

  async trackClick(
    clickId: string,
    productId: string,
    platform: string,
    userId?: string,
    referrer?: string,
    deviceType: string = 'unknown'
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('affiliate_clicks')
        .insert({
          id: clickId,
          product_id: productId,
          user_id: userId,
          platform,
          timestamp: new Date().toISOString(),
          referrer,
          device_type: deviceType,
          converted: false
        });

      if (error) throw error;

      this.logger.info('Tracked affiliate click', {
        clickId,
        productId,
        platform,
        userId
      });
    } catch (error) {
      this.logger.error('Error tracking affiliate click', {
        error,
        clickId,
        productId,
        platform
      });
      throw error;
    }
  }

  async trackConversion(
    clickId: string,
    revenue: number
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('affiliate_clicks')
        .update({
          converted: true,
          revenue
        })
        .eq('id', clickId);

      if (error) throw error;

      this.logger.info('Tracked affiliate conversion', {
        clickId,
        revenue
      });
    } catch (error) {
      this.logger.error('Error tracking affiliate conversion', {
        error,
        clickId,
        revenue
      });
      throw error;
    }
  }

  async getStats(
    platform?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AffiliateStats> {
    try {
      let query = this.supabase
        .from('affiliate_clicks')
        .select('*');

      if (platform) {
        query = query.eq('platform', platform);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const clicks = data.length;
      const conversions = data.filter(click => click.converted).length;
      const revenue = data.reduce((sum, click) => sum + (click.revenue || 0), 0);

      return {
        clicks,
        conversions,
        revenue,
        conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
        averageOrderValue: conversions > 0 ? revenue / conversions : 0
      };
    } catch (error) {
      this.logger.error('Error getting affiliate stats', {
        error,
        platform,
        startDate,
        endDate
      });
      throw error;
    }
  }

  private generateClickId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 