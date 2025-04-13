import { OpenAIService } from './OpenAIService';
import { Logger } from '../../../lib/utils/logger';
import { templates } from '../ai/templates';
import { TemplateEngine } from '../ai/templateEngine';
import { supabase } from '../supabase/client';

export interface ProductRecommendation {
  productId: string;
  score: number;
  reasoning: string;
  priceAnalysis: {
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    explanation: string;
  };
  alternativeProducts: {
    productId: string;
    reason: string;
    tariffImpact?: {
      difference: number;
      recommendation: string;
    };
  }[];
  tags: string[];
  tariffAnalysis?: {
    currentTariff: number;
    predictedChanges: string;
    impactLevel: 'low' | 'medium' | 'high';
  };
}

export interface RecommendationContext {
  userPreferences?: {
    priceRange?: { min: number; max: number };
    categories?: string[];
    features?: string[];
    countryCode?: string;
  };
  marketTrends?: {
    category: string;
    trend: string;
    impact: string;
  }[];
  priceHistory?: {
    date: string;
    price: number;
  }[];
  tariffData?: {
    currentRate: number;
    historicalRates: { date: string; rate: number }[];
    predictedChanges?: string;
  };
}

export class ProductRecommendationService {
  private openAIService: OpenAIService;
  private logger: Logger;
  private templateEngine: TemplateEngine;

  constructor() {
    this.openAIService = new OpenAIService();
    this.logger = new Logger('ProductRecommendationService');
    this.templateEngine = new TemplateEngine();
  }

  async generateRecommendations(
    productId: string,
    context: RecommendationContext
  ): Promise<ProductRecommendation> {
    try {
      // Fetch product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, product_categories(*), tariff_codes(*)')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Failed to fetch product details');
      }

      // Generate tags using AI
      const tags = await this.generateProductTags(product);

      // Fetch similar products with tariff information
      const { data: similarProducts, error: similarError } = await supabase
        .from('products')
        .select('*, product_categories(*), tariff_codes(*)')
        .eq('category', product.category)
        .neq('id', productId)
        .limit(5);

      if (similarError) {
        throw new Error('Failed to fetch similar products');
      }

      // Analyze tariff impact
      const tariffAnalysis = await this.analyzeTariffImpact(product, context.tariffData);

      // Generate recommendation using AI
      const template = templates['product-analysis'];
      const templateResult = this.templateEngine.processTemplate(template, {
        productName: product.name,
        currentPrice: product.price,
        category: product.category,
        description: product.description,
        priceHistory: context.priceHistory,
        marketContext: context.marketTrends?.map(trend => ({
          title: `${trend.category} Market Trend`,
          summary: trend.trend,
          impact: trend.impact
        })),
        focusAreas: ['price_analysis', 'market_impact', 'recommendations'],
        style: 'analytical',
        similarProducts: similarProducts?.map(p => ({
          name: p.name,
          price: p.price,
          features: p.features,
          tariffCode: p.tariff_codes?.code
        })),
        userPreferences: context.userPreferences,
        tariffData: context.tariffData
      });

      if ('error' in templateResult) {
        throw new Error(templateResult.error);
      }

      const analysis = await this.openAIService.generateProductContent({
        productData: {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          priceHistory: context.priceHistory
        },
        newsContext: context.marketTrends?.map(trend => ({
          title: `${trend.category} Market Trend`,
          summary: trend.trend,
          impact: trend.impact
        })),
        templateId: 'product-analysis',
        focusAreas: ['price_analysis', 'market_impact', 'recommendations']
      });

      // Parse the AI response and combine with tariff analysis
      const recommendation: ProductRecommendation = {
        productId,
        score: analysis.confidence,
        reasoning: analysis.summary,
        priceAnalysis: this.extractPriceAnalysis(analysis.content),
        alternativeProducts: await this.extractAlternativesWithTariffImpact(
          analysis.content,
          similarProducts || [],
          context.userPreferences?.countryCode
        ),
        tags,
        tariffAnalysis
      };

      return recommendation;
    } catch (error) {
      this.logger.error('Error generating recommendations', { error, productId, context });
      throw new Error('Failed to generate recommendations');
    }
  }

  private async generateProductTags(product: any): Promise<string[]> {
    try {
      const completion = await this.openAIService.generateProductContent({
        productData: {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category
        },
        templateId: 'product-analysis',
        focusAreas: ['categorization']
      });

      return completion.tags;
    } catch (error) {
      this.logger.error('Error generating product tags', { error, product });
      return [];
    }
  }

  private async analyzeTariffImpact(
    product: any,
    tariffData?: RecommendationContext['tariffData']
  ): Promise<ProductRecommendation['tariffAnalysis']> {
    if (!tariffData) {
      return undefined;
    }

    const tariffTrend = this.calculateTariffTrend(tariffData.historicalRates);
    const impactLevel = this.determineTariffImpact(
      tariffData.currentRate,
      product.price
    );

    return {
      currentTariff: tariffData.currentRate,
      predictedChanges: tariffData.predictedChanges || tariffTrend,
      impactLevel
    };
  }

  private calculateTariffTrend(historicalRates: { date: string; rate: number }[]): string {
    if (!historicalRates.length) return 'No historical data available';

    const sortedRates = [...historicalRates].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const rateChanges = sortedRates.map((rate, i) => 
      i > 0 ? rate.rate - sortedRates[i-1].rate : 0
    ).slice(1);

    const averageChange = rateChanges.reduce((sum, change) => sum + change, 0) / rateChanges.length;

    if (Math.abs(averageChange) < 0.5) return 'Stable tariff rates expected';
    return averageChange > 0 ? 'Increasing tariff trend' : 'Decreasing tariff trend';
  }

  private determineTariffImpact(tariffRate: number, productPrice: number): 'low' | 'medium' | 'high' {
    const impact = (tariffRate * productPrice) / 100;
    if (impact < 10) return 'low';
    if (impact < 50) return 'medium';
    return 'high';
  }

  private async extractAlternativesWithTariffImpact(
    content: string,
    similarProducts: any[],
    countryCode?: string
  ): Promise<ProductRecommendation['alternativeProducts']> {
    const alternatives = await Promise.all(
      similarProducts.map(async (product) => {
        const tariffImpact = countryCode ? await this.calculateTariffDifference(
          product,
          countryCode
        ) : undefined;

        return {
          productId: product.id,
          reason: this.extractProductMention(content, product) ||
            `Similar product in the same category with ${
              product.price < similarProducts[0].price ? 'lower' : 'competitive'
            } price point`,
          tariffImpact
        };
      })
    );

    // Sort alternatives by tariff impact if available
    return alternatives.sort((a, b) => {
      if (!a.tariffImpact || !b.tariffImpact) return 0;
      return a.tariffImpact.difference - b.tariffImpact.difference;
    });
  }

  private extractProductMention(content: string, product: any): string | null {
    const sentences = content.split(/[.!?]+/);
    const relevantSentence = sentences.find(s => 
      s.toLowerCase().includes(product.name.toLowerCase())
    );
    return relevantSentence ? relevantSentence.trim() : null;
  }

  private async calculateTariffDifference(
    product: any,
    countryCode: string
  ): Promise<{ difference: number; recommendation: string } | undefined> {
    try {
      const { data: tariffData } = await supabase
        .from('tariff_rates')
        .select('*')
        .eq('country_code', countryCode)
        .eq('tariff_code', product.tariff_codes?.code)
        .single();

      if (!tariffData) return undefined;

      const difference = tariffData.rate - product.tariff_codes?.base_rate || 0;
      const recommendation = difference > 0
        ? 'Consider alternative products with lower tariff rates'
        : 'Favorable tariff rate compared to alternatives';

      return { difference, recommendation };
    } catch (error) {
      this.logger.error('Error calculating tariff difference', { error, product, countryCode });
      return undefined;
    }
  }

  private extractPriceAnalysis(content: string): ProductRecommendation['priceAnalysis'] {
    // Default values
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let confidence = 0.5;
    let explanation = '';

    // Look for price trend indicators in the content
    if (content.toLowerCase().includes('price') && content.toLowerCase().includes('trend')) {
      if (content.toLowerCase().includes('increasing') || content.toLowerCase().includes('rising')) {
        trend = 'increasing';
      } else if (content.toLowerCase().includes('decreasing') || content.toLowerCase().includes('falling')) {
        trend = 'decreasing';
      }

      // Extract explanation using the sentence containing 'price trend'
      const sentences = content.split(/[.!?]+/);
      const trendSentence = sentences.find(s => 
        s.toLowerCase().includes('price') && 
        s.toLowerCase().includes('trend')
      );
      if (trendSentence) {
        explanation = trendSentence.trim();
      }

      // Adjust confidence based on certainty words
      const certaintyWords = ['definitely', 'certainly', 'clearly', 'likely', 'possibly', 'maybe'];
      const foundCertaintyWords = certaintyWords.filter(word => 
        content.toLowerCase().includes(word)
      );
      confidence = 0.5 + (foundCertaintyWords.length * 0.1);
      confidence = Math.min(confidence, 0.9); // Cap at 0.9
    }

    return {
      trend,
      confidence,
      explanation: explanation || 'No clear price trend identified'
    };
  }

  async getPersonalizedRecommendations(
    userId: string,
    category?: string
  ): Promise<ProductRecommendation[]> {
    try {
      // Fetch user preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (preferencesError) {
        throw new Error('Failed to fetch user preferences');
      }

      // Fetch relevant products
      const productsQuery = supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (category) {
        productsQuery.eq('category', category);
      }

      const { data: products, error: productsError } = await productsQuery;

      if (productsError || !products) {
        throw new Error('Failed to fetch products');
      }

      // Generate recommendations for each product
      const recommendations = await Promise.all(
        products.map(product =>
          this.generateRecommendations(product.id, {
            userPreferences: {
              priceRange: preferences?.price_range,
              categories: preferences?.preferred_categories,
              features: preferences?.preferred_features
            }
          })
        )
      );

      // Sort by score and return top recommendations
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error('Error getting personalized recommendations', { error, userId, category });
      throw new Error('Failed to get personalized recommendations');
    }
  }
} 