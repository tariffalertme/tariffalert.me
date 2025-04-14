import { OpenAI } from 'openai';
import { Logger } from '@/lib/utils/logger';

export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger: Logger;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.logger = new Logger('OpenAIService');
  }

  public async generateProductContent(params: {
    productData: any;
    templateId: string;
    focusAreas: string[];
  }): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional product content writer.'
          },
          {
            role: 'user',
            content: `Generate content for product: ${JSON.stringify(params.productData)}`
          }
        ]
      });

      return completion.choices[0].message.content;
    } catch (error) {
      this.logger.error('Error generating product content:', { error });
      throw error;
    }
  }

  public async generateRecommendations(prompt: string): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in international trade and tariff analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No recommendations generated');
      }

      // Parse the recommendations from the content
      // Assuming the model returns recommendations in a list format
      const recommendations = content
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());

      return recommendations.length > 0 ? recommendations : ['No specific recommendations available'];
    } catch (error) {
      this.logger.error('Error generating recommendations:', { error });
      throw error;
    }
  }
} 