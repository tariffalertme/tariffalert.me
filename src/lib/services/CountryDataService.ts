import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';

export interface Country {
  code: string;
  name: string;
  region: string;
}

export interface TradeStatistics {
  country_code: string;
  period: string;
  imports: number;
  exports: number;
  avg_tariff_rate: number;
}

export interface TariffChange {
  country_code: string;
  effective_date: Date;
  category: string;
  old_rate: number;
  new_rate: number;
  impact_description: string;
}

export interface ConsumerSegment {
  country_code: string;
  name: string;
  description: string;
  size_percentage: number;
}

export interface CountryRelationship {
  country_code_1: string;
  country_code_2: string;
  relationship_type: 'competitor' | 'trading_partner';
  impact_correlation: number;
}

export class CountryDataService {
  private static instance: CountryDataService;
  private supabase: SupabaseClient;
  private logger: Logger;

  private constructor() {
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    this.logger = new Logger('CountryDataService');
  }

  public static getInstance(): CountryDataService {
    if (!CountryDataService.instance) {
      CountryDataService.instance = new CountryDataService();
    }
    return CountryDataService.instance;
  }

  async upsertCountry(country: Country): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('countries')
        .upsert(country, { onConflict: 'code' });

      if (error) throw error;
    } catch (error) {
      this.logger.error('Error upserting country:', error);
      throw error;
    }
  }

  async updateTradeStatistics(stats: TradeStatistics): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('trade_statistics')
        .upsert(stats, { onConflict: 'country_code,period' });

      if (error) throw error;
    } catch (error) {
      this.logger.error('Error updating trade statistics:', error);
      throw error;
    }
  }

  async recordTariffChange(change: TariffChange): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('tariff_changes')
        .insert(change);

      if (error) throw error;
    } catch (error) {
      this.logger.error('Error recording tariff change:', error);
      throw error;
    }
  }

  async upsertConsumerSegment(segment: ConsumerSegment): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('consumer_segments')
        .upsert(segment, { onConflict: 'country_code,name' });

      if (error) throw error;
    } catch (error) {
      this.logger.error('Error upserting consumer segment:', error);
      throw error;
    }
  }

  async upsertCountryRelationship(relationship: CountryRelationship): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('country_relationships')
        .upsert(relationship, { onConflict: 'country_code_1,country_code_2' });

      if (error) throw error;
    } catch (error) {
      this.logger.error('Error upserting country relationship:', error);
      throw error;
    }
  }

  async getCountryData(countryCode: string) {
    try {
      const [
        { data: country },
        { data: tradeStats },
        { data: tariffChanges },
        { data: consumerSegments },
        { data: relationships }
      ] = await Promise.all([
        this.supabase.from('countries').select('*').eq('code', countryCode).single(),
        this.supabase.from('trade_statistics').select('*').eq('country_code', countryCode),
        this.supabase.from('tariff_changes').select('*').eq('country_code', countryCode),
        this.supabase.from('consumer_segments').select('*').eq('country_code', countryCode),
        this.supabase.from('country_relationships')
          .select('*')
          .or(`country_code_1.eq.${countryCode},country_code_2.eq.${countryCode}`)
      ]);

      return {
        country,
        tradeStats,
        tariffChanges,
        consumerSegments,
        relationships
      };
    } catch (error) {
      this.logger.error('Error fetching country data:', error);
      throw error;
    }
  }
} 