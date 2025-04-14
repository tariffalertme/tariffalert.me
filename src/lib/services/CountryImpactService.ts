import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Logger } from '@/lib/utils/logger';
import { OpenAIService } from './OpenAIService';
import { TemplateEngine } from '../ai/templateEngine';
import { PostgrestError } from '@supabase/supabase-js';

export interface TradeStatistics {
  imports: number;
  exports: number;
  averageTariffRate: number;
  period: string;
}

export interface TariffChange {
  previousRate: number;
  newRate: number;
  effectiveDate: Date;
  affectedCategories: string[];
}

export interface ConsumerSegment {
  name: string;
  description: string;
  affectedCategories: string[];
}

export interface CountryRelationship {
  sourceCountry: string;
  targetCountry: string;
  relationshipType: 'competitor' | 'trading_partner';
  impactCorrelation: number;
}

export interface CountryImpactAnalysis {
  countryCode: string;
  tradeStatistics: TradeStatistics;
  tariffChanges: TariffChange[];
  consumerSegments: ConsumerSegment[];
  relationships: CountryRelationship[];
  impactScore: number;
  recommendations: string[];
}

export class CountryImpactService {
  private readonly logger: Logger;
  private readonly openAIService: OpenAIService;
  private readonly templateEngine: TemplateEngine;

  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {
    this.logger = new Logger('CountryImpactService');
    this.openAIService = new OpenAIService();
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Get trade statistics for a specific country and period
   */
  public async getTradeStatistics(countryCode: string, period: string): Promise<TradeStatistics> {
    try {
      const { data, error } = await this.supabase
        .from('trade_statistics')
        .select('*')
        .eq('country_code', countryCode)
        .eq('period', period)
        .single();

      if (error) throw error;

      return {
        imports: data.imports,
        exports: data.exports,
        averageTariffRate: data.average_tariff_rate,
        period: data.period
      };
    } catch (error) {
      this.logger.error('Failed to fetch trade statistics:', { error, countryCode, period });
      throw error;
    }
  }

  /**
   * Get recent tariff changes for a country
   */
  public async getTariffChanges(countryCode: string, limit = 10): Promise<TariffChange[]> {
    try {
      const { data, error } = await this.supabase
        .from('tariff_changes')
        .select('*')
        .eq('country_code', countryCode)
        .order('effective_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(change => ({
        previousRate: change.previous_rate,
        newRate: change.new_rate,
        effectiveDate: new Date(change.effective_date),
        affectedCategories: change.affected_categories
      }));
    } catch (error) {
      this.logger.error('Failed to fetch tariff changes:', { error, countryCode });
      throw error;
    }
  }

  /**
   * Get consumer segments for a country
   */
  public async getConsumerSegments(countryCode: string): Promise<ConsumerSegment[]> {
    try {
      const { data, error } = await this.supabase
        .from('consumer_segments')
        .select('*')
        .eq('country_code', countryCode);

      if (error) throw error;

      return data.map(segment => ({
        name: segment.name,
        description: segment.description,
        affectedCategories: segment.affected_categories
      }));
    } catch (error) {
      this.logger.error('Failed to fetch consumer segments:', { error, countryCode });
      throw error;
    }
  }

  /**
   * Get relationships for a country
   */
  public async getCountryRelationships(countryCode: string): Promise<CountryRelationship[]> {
    try {
      const { data, error } = await this.supabase
        .from('country_relationships')
        .select('*')
        .or(`source_country.eq.${countryCode},target_country.eq.${countryCode}`);

      if (error) throw error;

      return data.map(relationship => ({
        sourceCountry: relationship.source_country,
        targetCountry: relationship.target_country,
        relationshipType: relationship.relationship_type,
        impactCorrelation: relationship.impact_correlation
      }));
    } catch (error) {
      this.logger.error('Failed to fetch country relationships:', { error, countryCode });
      throw error;
    }
  }

  /**
   * Calculate impact score based on various factors
   */
  private calculateImpactScore(
    tradeStats: TradeStatistics,
    tariffChanges: TariffChange[],
    relationships: CountryRelationship[]
  ): number {
    const tradeVolume = tradeStats.imports + tradeStats.exports;
    const recentTariffChange = tariffChanges[0]?.newRate - tariffChanges[0]?.previousRate || 0;
    const avgCorrelation = relationships.reduce((sum, rel) => sum + rel.impactCorrelation, 0) / relationships.length;

    // Weighted scoring formula
    const score = (
      (tradeVolume * 0.4) +
      (Math.abs(recentTariffChange) * 0.3) +
      (avgCorrelation * 0.3)
    );

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Generate recommendations based on analysis
   */
  private async generateRecommendations(
    analysis: Omit<CountryImpactAnalysis, 'recommendations'>
  ): Promise<string[]> {
    const prompt = this.templateEngine.generatePrompt('countryImpactRecommendations', {
      countryCode: analysis.countryCode,
      tradeStatistics: analysis.tradeStatistics,
      tariffChanges: analysis.tariffChanges,
      consumerSegments: analysis.consumerSegments,
      relationships: analysis.relationships,
      impactScore: analysis.impactScore
    });

    const recommendations = await this.openAIService.generateRecommendations(prompt);
    return recommendations;
  }

  /**
   * Get comprehensive impact analysis for a country
   */
  public async getCountryImpactAnalysis(countryCode: string): Promise<CountryImpactAnalysis> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const [
        tradeStatistics,
        tariffChanges,
        consumerSegments,
        relationships
      ] = await Promise.all([
        this.getTradeStatistics(countryCode, currentPeriod),
        this.getTariffChanges(countryCode),
        this.getConsumerSegments(countryCode),
        this.getCountryRelationships(countryCode)
      ]);

      const impactScore = this.calculateImpactScore(
        tradeStatistics,
        tariffChanges,
        relationships
      );

      const analysis: Omit<CountryImpactAnalysis, 'recommendations'> = {
        countryCode,
        tradeStatistics,
        tariffChanges,
        consumerSegments,
        relationships,
        impactScore
      };

      const recommendations = await this.generateRecommendations(analysis);

      return {
        ...analysis,
        recommendations
      };
    } catch (error) {
      this.logger.error('Failed to generate country impact analysis:', { error, countryCode });
      throw error;
    }
  }
} 