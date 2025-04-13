import OpenAI from 'openai';
import { Logger } from '../../../lib/utils/logger';
import { templates } from '../ai/templates';
import { TemplateEngine } from '../ai/templateEngine';

export interface ContentGenerationParams {
  productData: {
    name: string;
    description: string;
    price: number;
    category: string;
    priceHistory?: {
      date: string;
      price: number;
    }[];
  };
  newsContext?: {
    title: string;
    summary: string;
    impact: string;
  }[];
  targetLength?: number;
  style?: 'formal' | 'casual' | 'analytical';
  focusAreas?: ('price_analysis' | 'market_impact' | 'recommendations' | 'categorization')[];
  templateId?: string;
}

export interface GeneratedContent {
  content: string;
  summary: string;
  tags: string[];
  confidence: number;
}

export class OpenAIService {
  private openai: OpenAI;
  private logger: Logger;
  private templateEngine: TemplateEngine;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.logger = new Logger('OpenAIService');
    this.templateEngine = new TemplateEngine();
  }

  async generateProductContent(params: ContentGenerationParams): Promise<GeneratedContent> {
    try {
      const { productData, newsContext, targetLength = 500, style = 'formal', focusAreas = ['price_analysis'], templateId = 'product-analysis' } = params;

      // Get the template
      const template = templates[templateId];
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Process the template
      const templateResult = this.templateEngine.processTemplate(template, {
        productName: productData.name,
        currentPrice: productData.price,
        category: productData.category,
        description: productData.description,
        priceHistory: productData.priceHistory,
        marketContext: newsContext,
        focusAreas,
        style,
        targetLength
      });

      if ('error' in templateResult) {
        throw new Error(templateResult.error);
      }

      const { prompt, systemPrompt, params: templateParams } = templateResult;

      // Generate content using the processed template
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: templateParams.maxTokens,
        temperature: templateParams.temperature,
      });

      const generatedText = completion.choices[0]?.message?.content || '';
      
      // Generate tags using a separate API call
      const tags = await this.generateTags(generatedText);

      // Calculate confidence score based on completion metrics
      const confidence = this.calculateConfidence(completion);

      // Generate a summary
      const summary = await this.generateSummary(generatedText);

      // Validate and format the output
      const output = {
        content: generatedText,
        summary,
        tags,
        confidence,
      };

      const validation = this.templateEngine.validateOutput(output, template);
      if (!validation.isValid) {
        this.logger.warn('Generated content does not match template structure', { 
          errors: validation.errors,
          output 
        });
      }

      return output;
    } catch (error) {
      this.logger.error('Error generating product content', { error, params });
      throw new Error('Failed to generate content');
    }
  }

  private async generateTags(content: string): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Generate 5-8 relevant tags for the following content. Return only the tags as a comma-separated list."
          },
          {
            role: "user",
            content
          }
        ],
        max_tokens: 100,
        temperature: 0.5,
      });

      const tagsString = completion.choices[0]?.message?.content || '';
      return tagsString.split(',').map(tag => tag.trim());
    } catch (error) {
      this.logger.error('Error generating tags', { error });
      return [];
    }
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Generate a concise 2-3 sentence summary of the following content."
          },
          {
            role: "user",
            content
          }
        ],
        max_tokens: 150,
        temperature: 0.5,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Error generating summary', { error });
      return '';
    }
  }

  private calculateConfidence(completion: OpenAI.Chat.Completions.ChatCompletion): number {
    const factors = {
      hasContent: completion.choices[0]?.message?.content ? 0.5 : 0,
      finishReason: completion.choices[0]?.finish_reason === 'stop' ? 0.3 : 0,
      promptTokens: Math.min((completion.usage?.prompt_tokens || 0) / 1000, 0.1),
      completionTokens: Math.min((completion.usage?.completion_tokens || 0) / 1000, 0.1),
    };

    return Object.values(factors).reduce((sum, value) => sum + value, 0);
  }
} 