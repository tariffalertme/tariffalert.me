import { OpenAIService } from './OpenAIService';
import { Logger } from '../../../lib/utils/logger';
import { templates } from '../ai/templates';
import { TemplateEngine } from '../ai/templateEngine';
import { supabase } from '../supabase/client';

export interface CountryImpactData {
  countryCode: string;
  countryName: string;
  tradeVolume: {
    imports: number;
    exports: number;
    period: string;
  };
  tariffChanges: {
    oldRate: number;
    newRate: number;
    effectiveDate: string;
    productCategories: string[];
  }[];
  industryImpact: {
    industryName: string;
    impactLevel: 'low' | 'medium' | 'high';
    affectedProducts: number;
    estimatedValueChange: number;
  }[];
  historicalTrends: {
    period: string;
    averageTariffRate: number;
    tradeBalance: number;
  }[];
}

export interface ImpactAnalysis {
  summary: string;
  keyFindings: string[];
  financialImpact: {
    totalValue: number;
    breakdown: {
      category: string;
      value: number;
      change: number;
    }[];
  };
  recommendations: {
    shortTerm: string[];
    longTerm: string[];
  };
  visualizationData: {
    timeSeriesData: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
      }[];
    };
    impactDistribution: {
      labels: string[];
      values: number[];
    };
  };
  relatedCountries: {
    countryCode: string;
    relationshipType: 'competitor' | 'trading_partner';
    impactCorrelation: number;
  }[];
}

export class CountryImpactService {
  private openAIService: OpenAIService;
  private logger: Logger;
  private templateEngine: TemplateEngine;

  constructor() {
    this.openAIService = new OpenAIService();
    this.logger = new Logger('CountryImpactService');
    this.templateEngine = new TemplateEngine();
  }

  async generateCountryImpactAnalysis(
    countryCode: string,
    timeframe: { start: string; end: string }
  ): Promise<ImpactAnalysis> {
    try {
      // Fetch country data
      const countryData = await this.fetchCountryData(countryCode, timeframe);
      
      // Generate impact analysis using AI
      const template = templates['impact-assessment'];
      const templateResult = this.templateEngine.processTemplate(template, {
        eventDescription: `Analysis of tariff changes and their impact on ${countryData.countryName}'s trade and industries`,
        products: countryData.tariffChanges.map(change => ({
          categories: change.productCategories,
          priceChange: ((change.newRate - change.oldRate) / change.oldRate) * 100
        })),
        consumerSegments: await this.identifyAffectedSegments(countryData),
        timeframe: `${timeframe.start} to ${timeframe.end}`,
        geography: countryData.countryName,
        considerationPoints: [
          'economic_impact',
          'trade_relationships',
          'industry_specific_effects',
          'historical_context'
        ]
      });

      if ('error' in templateResult) {
        throw new Error(templateResult.error);
      }

      // Generate visualization data
      const visualizationData = this.generateVisualizationData(countryData);

      // Calculate financial impact
      const financialImpact = await this.calculateFinancialImpact(countryData);

      // Find related countries
      const relatedCountries = await this.findRelatedCountries(countryCode, countryData);

      // Generate the final analysis
      const analysis = await this.openAIService.generateProductContent({
        productData: {
          name: countryData.countryName,
          description: `Impact analysis for ${countryData.countryName}`,
          price: 0,
          category: 'Country Analysis'
        },
        templateId: 'impact-assessment',
        focusAreas: ['market_impact']
      });

      return {
        summary: analysis.summary,
        keyFindings: analysis.tags,
        financialImpact,
        recommendations: this.generateRecommendations(analysis.content),
        visualizationData,
        relatedCountries
      };
    } catch (error) {
      this.logger.error('Error generating country impact analysis', { error, countryCode });
      throw new Error('Failed to generate country impact analysis');
    }
  }

  private async fetchCountryData(
    countryCode: string,
    timeframe: { start: string; end: string }
  ): Promise<CountryImpactData> {
    const { data: countryInfo, error: countryError } = await supabase
      .from('countries')
      .select('*')
      .eq('code', countryCode)
      .single();

    if (countryError || !countryInfo) {
      throw new Error('Failed to fetch country information');
    }

    const { data: tariffData, error: tariffError } = await supabase
      .from('tariff_changes')
      .select('*')
      .eq('country_code', countryCode)
      .gte('effective_date', timeframe.start)
      .lte('effective_date', timeframe.end);

    if (tariffError) {
      throw new Error('Failed to fetch tariff data');
    }

    const { data: tradeData, error: tradeError } = await supabase
      .from('trade_statistics')
      .select('*')
      .eq('country_code', countryCode)
      .gte('period', timeframe.start)
      .lte('period', timeframe.end);

    if (tradeError) {
      throw new Error('Failed to fetch trade statistics');
    }

    return {
      countryCode,
      countryName: countryInfo.name,
      tradeVolume: {
        imports: this.calculateTotalTrade(tradeData, 'imports'),
        exports: this.calculateTotalTrade(tradeData, 'exports'),
        period: `${timeframe.start} to ${timeframe.end}`
      },
      tariffChanges: this.processTariffChanges(tariffData),
      industryImpact: await this.calculateIndustryImpact(countryCode, tariffData),
      historicalTrends: this.processHistoricalTrends(tradeData)
    };
  }

  private calculateTotalTrade(tradeData: any[], type: 'imports' | 'exports'): number {
    return tradeData.reduce((sum, record) => sum + (record[type] || 0), 0);
  }

  private processTariffChanges(tariffData: any[]): CountryImpactData['tariffChanges'] {
    return tariffData.map(change => ({
      oldRate: change.previous_rate,
      newRate: change.new_rate,
      effectiveDate: change.effective_date,
      productCategories: change.affected_categories
    }));
  }

  private async calculateIndustryImpact(
    countryCode: string,
    tariffChanges: any[]
  ): Promise<CountryImpactData['industryImpact']> {
    const { data: industries, error } = await supabase
      .from('industry_statistics')
      .select('*')
      .eq('country_code', countryCode);

    if (error) {
      throw new Error('Failed to fetch industry statistics');
    }

    return industries.map(industry => {
      const affectedProducts = tariffChanges.filter(change => 
        change.affected_categories.includes(industry.category)
      ).length;

      const valueChange = this.calculateIndustryValueChange(industry, tariffChanges);
      
      return {
        industryName: industry.name,
        impactLevel: this.determineImpactLevel(valueChange),
        affectedProducts,
        estimatedValueChange: valueChange
      };
    });
  }

  private calculateIndustryValueChange(industry: any, tariffChanges: any[]): number {
    const relevantChanges = tariffChanges.filter(change => 
      change.affected_categories.includes(industry.category)
    );

    return relevantChanges.reduce((total, change) => {
      const rateChange = change.new_rate - change.previous_rate;
      return total + (industry.trade_volume * (rateChange / 100));
    }, 0);
  }

  private determineImpactLevel(valueChange: number): 'low' | 'medium' | 'high' {
    const absoluteChange = Math.abs(valueChange);
    if (absoluteChange < 1000000) return 'low';
    if (absoluteChange < 10000000) return 'medium';
    return 'high';
  }

  private processHistoricalTrends(tradeData: any[]): CountryImpactData['historicalTrends'] {
    return tradeData.map(record => ({
      period: record.period,
      averageTariffRate: record.average_tariff_rate,
      tradeBalance: record.exports - record.imports
    }));
  }

  private async identifyAffectedSegments(countryData: CountryImpactData): Promise<any[]> {
    const { data: segments, error } = await supabase
      .from('consumer_segments')
      .select('*')
      .eq('country_code', countryData.countryCode);

    if (error) {
      throw new Error('Failed to fetch consumer segments');
    }

    return segments.map(segment => ({
      segment: segment.name,
      characteristics: segment.description,
      impactLevel: this.calculateSegmentImpact(segment, countryData.tariffChanges)
    }));
  }

  private calculateSegmentImpact(segment: any, tariffChanges: any[]): string {
    const relevantChanges = tariffChanges.filter(change => 
      change.productCategories.some((category: string) => 
        segment.affected_categories.includes(category)
      )
    );

    const averageChange = relevantChanges.reduce((sum, change) => 
      sum + (change.newRate - change.oldRate), 0
    ) / (relevantChanges.length || 1);

    return `Average tariff change of ${averageChange.toFixed(2)}% affecting ${
      relevantChanges.length
    } product categories`;
  }

  private generateVisualizationData(
    countryData: CountryImpactData
  ): ImpactAnalysis['visualizationData'] {
    const timeSeriesData = {
      labels: countryData.historicalTrends.map(trend => trend.period),
      datasets: [
        {
          label: 'Average Tariff Rate',
          data: countryData.historicalTrends.map(trend => trend.averageTariffRate)
        },
        {
          label: 'Trade Balance',
          data: countryData.historicalTrends.map(trend => trend.tradeBalance)
        }
      ]
    };

    const impactDistribution = {
      labels: countryData.industryImpact.map(impact => impact.industryName),
      values: countryData.industryImpact.map(impact => impact.estimatedValueChange)
    };

    return { timeSeriesData, impactDistribution };
  }

  private async calculateFinancialImpact(
    countryData: CountryImpactData
  ): Promise<ImpactAnalysis['financialImpact']> {
    const totalValue = countryData.industryImpact.reduce(
      (sum, industry) => sum + industry.estimatedValueChange,
      0
    );

    const breakdown = countryData.industryImpact.map(industry => ({
      category: industry.industryName,
      value: industry.estimatedValueChange,
      change: (industry.estimatedValueChange / totalValue) * 100
    }));

    return { totalValue, breakdown };
  }

  private async findRelatedCountries(
    countryCode: string,
    countryData: CountryImpactData
  ): Promise<ImpactAnalysis['relatedCountries']> {
    const { data: relationships, error } = await supabase
      .from('country_relationships')
      .select('*')
      .eq('source_country', countryCode);

    if (error) {
      throw new Error('Failed to fetch country relationships');
    }

    return relationships.map(rel => ({
      countryCode: rel.target_country,
      relationshipType: rel.relationship_type,
      impactCorrelation: rel.impact_correlation
    }));
  }

  private generateRecommendations(content: string): ImpactAnalysis['recommendations'] {
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Extract recommendations from the content
    const recommendationSection = content.split('Recommendations:')[1];
    if (recommendationSection) {
      const recommendations = recommendationSection.split('\n').filter(line => 
        line.trim().startsWith('-') || line.trim().startsWith('•')
      );

      recommendations.forEach(rec => {
        const recommendation = rec.replace(/^[-•]\s*/, '').trim();
        if (recommendation.toLowerCase().includes('immediate') || 
            recommendation.toLowerCase().includes('short-term')) {
          shortTerm.push(recommendation);
        } else {
          longTerm.push(recommendation);
        }
      });
    }

    return {
      shortTerm: shortTerm.length > 0 ? shortTerm : ['No short-term recommendations available'],
      longTerm: longTerm.length > 0 ? longTerm : ['No long-term recommendations available']
    };
  }
} 