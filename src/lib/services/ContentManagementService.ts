import cron from 'node-cron';
import { OpenAIService } from './OpenAIService';
import { TemplateEngine } from '../ai/templateEngine';
import { Logger } from '../../../lib/utils/logger';
import { supabase } from '../supabase/client';

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: 'blog' | 'analysis' | 'recommendation';
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected';
  scheduledPublishDate?: string;
  publishedDate?: string;
  metadata: {
    author?: string;
    source?: string;
    templateId?: string;
    qualityScore?: number;
    reviewerNotes?: string;
    analyticsData?: {
      views: number;
      engagement: number;
      shares: number;
    };
  };
}

export interface ContentValidationResult {
  isValid: boolean;
  score: number;
  issues: {
    type: 'error' | 'warning';
    message: string;
    category: 'coherence' | 'readability' | 'factual' | 'style';
  }[];
  suggestions: string[];
}

export class ContentManagementService {
  private openAIService: OpenAIService;
  private templateEngine: TemplateEngine;
  private logger: Logger;
  private scheduledJobs: Map<string, cron.ScheduledTask>;

  constructor() {
    this.openAIService = new OpenAIService();
    this.templateEngine = new TemplateEngine();
    this.logger = new Logger('ContentManagementService');
    this.scheduledJobs = new Map();
  }

  async validateContent(content: ContentItem): Promise<ContentValidationResult> {
    try {
      // Use OpenAI to validate content quality
      const completion = await this.openAIService.generateProductContent({
        productData: {
          name: content.title,
          description: content.content,
          price: 0,
          category: content.type
        },
        templateId: 'content-validation',
        focusAreas: ['market_impact', 'recommendations']
      });

      // Parse the analysis to extract issues and suggestions
      const issues = this.parseValidationIssues(completion.content);
      const suggestions = this.parseValidationSuggestions(completion.content);
      
      // Calculate quality score based on issues
      const score = this.calculateQualityScore(issues);

      return {
        isValid: score >= 0.7,
        score,
        issues,
        suggestions
      };
    } catch (error) {
      this.logger.error('Error validating content', { error, contentId: content.id });
      throw new Error('Failed to validate content');
    }
  }

  private parseValidationIssues(analysis: string): ContentValidationResult['issues'] {
    const issues: ContentValidationResult['issues'] = [];
    const categories = ['coherence', 'readability', 'factual', 'style'] as const;

    categories.forEach(category => {
      const categoryRegex = new RegExp(`${category}[:\\s]+(.*?)(?=\\n|$)`, 'gi');
      const matches = analysis.match(categoryRegex);
      
      matches?.forEach(match => {
        const severity = match.toLowerCase().includes('critical') ? 'error' : 'warning';
        issues.push({
          type: severity,
          message: match.split(':')[1].trim(),
          category
        });
      });
    });

    return issues;
  }

  private parseValidationSuggestions(analysis: string): string[] {
    const suggestions: string[] = [];
    const suggestionRegex = /suggestion[s]?[:\\s]+(.*?)(?=\\n|$)/gi;
    const matches = analysis.match(suggestionRegex);

    matches?.forEach(match => {
      suggestions.push(match.split(':')[1].trim());
    });

    return suggestions;
  }

  private calculateQualityScore(issues: ContentValidationResult['issues']): number {
    const baseScore = 1;
    const deductions = {
      error: 0.2,
      warning: 0.1
    };

    const totalDeduction = issues.reduce((sum, issue) => 
      sum + deductions[issue.type], 0
    );

    return Math.max(0, Math.min(1, baseScore - totalDeduction));
  }

  async scheduleContent(content: ContentItem): Promise<void> {
    try {
      if (!content.scheduledPublishDate) {
        throw new Error('No publish date specified');
      }

      const publishDate = new Date(content.scheduledPublishDate);
      if (publishDate <= new Date()) {
        await this.publishContent(content.id);
        return;
      }

      // Create cron schedule for the specific date
      const schedule = this.dateToCron(publishDate);
      const job = cron.schedule(schedule, async () => {
        await this.publishContent(content.id);
        job.stop();
        this.scheduledJobs.delete(content.id);
      });

      this.scheduledJobs.set(content.id, job);
      
      // Update content status
      await supabase
        .from('content')
        .update({ status: 'approved' })
        .eq('id', content.id);

      this.logger.info('Content scheduled for publication', {
        contentId: content.id,
        publishDate: content.scheduledPublishDate
      });
    } catch (error) {
      this.logger.error('Error scheduling content', { error, contentId: content.id });
      throw new Error('Failed to schedule content');
    }
  }

  private dateToCron(date: Date): string {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  async publishContent(contentId: string): Promise<void> {
    try {
      // Fetch content
      const { data: content, error: fetchError } = await supabase
        .from('content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (fetchError || !content) {
        throw new Error('Content not found');
      }

      // Validate content before publishing
      const validation = await this.validateContent(content);
      if (!validation.isValid) {
        throw new Error('Content failed validation checks');
      }

      // Update content status and publish date
      const { error: updateError } = await supabase
        .from('content')
        .update({
          status: 'published',
          publishedDate: new Date().toISOString(),
          metadata: {
            ...content.metadata,
            qualityScore: validation.score
          }
        })
        .eq('id', contentId);

      if (updateError) {
        throw updateError;
      }

      this.logger.info('Content published successfully', { contentId });
    } catch (error) {
      this.logger.error('Error publishing content', { error, contentId });
      throw new Error('Failed to publish content');
    }
  }

  async getContentAnalytics(contentId: string): Promise<ContentItem['metadata']['analyticsData']> {
    try {
      const { data, error } = await supabase
        .from('content_analytics')
        .select('views, engagement, shares')
        .eq('content_id', contentId)
        .single();

      if (error) {
        throw error;
      }

      return {
        views: data.views,
        engagement: data.engagement,
        shares: data.shares
      };
    } catch (error) {
      this.logger.error('Error fetching content analytics', { error, contentId });
      throw new Error('Failed to fetch content analytics');
    }
  }

  async updateContentAnalytics(
    contentId: string,
    metrics: Partial<ContentItem['metadata']['analyticsData']>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_analytics')
        .upsert({
          content_id: contentId,
          ...metrics,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      this.logger.info('Content analytics updated', { contentId, metrics });
    } catch (error) {
      this.logger.error('Error updating content analytics', { error, contentId });
      throw new Error('Failed to update content analytics');
    }
  }

  cleanup(): void {
    // Stop all scheduled jobs
    for (const [contentId, job] of this.scheduledJobs) {
      job.stop();
      this.scheduledJobs.delete(contentId);
    }
  }
} 