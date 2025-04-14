import { UstrApiClient } from '../api/UstrApiClient';
import { WtoApiClient } from '../api/WtoApiClient';
import { Logger } from '../utils/logger';

export interface NormalizedNewsItem {
  title: string;
  content: string;
  countries: string[];
  categories: string[];
  impactLevel: 'high' | 'medium' | 'low';
  priceImpact: {
    percentage: number;
    direction: 'increase' | 'decrease' | 'unchanged';
  };
  sourceUrls: string[];
  publishDate: Date;
}

export class NewsNormalizationService {
  private logger: Logger;
  private ustrClient: UstrApiClient;
  private wtoClient: WtoApiClient;

  constructor(ustrClient: UstrApiClient, wtoClient: WtoApiClient) {
    this.logger = new Logger('NewsNormalizationService');
    this.ustrClient = ustrClient;
    this.wtoClient = wtoClient;
  }

  private estimateImpactLevel(content: string): 'high' | 'medium' | 'low' {
    const lowImpactKeywords = ['minor', 'small', 'temporary', 'limited'];
    const highImpactKeywords = ['major', 'significant', 'substantial', 'widespread'];

    const contentLower = content.toLowerCase();
    
    if (highImpactKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'high';
    }
    if (lowImpactKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  private estimatePriceImpact(content: string): { percentage: number; direction: 'increase' | 'decrease' | 'unchanged' } {
    const contentLower = content.toLowerCase();
    
    // Default to no impact
    const defaultImpact = { percentage: 0, direction: 'unchanged' as const };

    // Look for percentage mentions
    const percentageMatch = content.match(/(\d+(?:\.\d+)?)%/);
    if (!percentageMatch) return defaultImpact;

    const percentage = parseFloat(percentageMatch[1]);
    
    // Determine direction
    if (contentLower.includes('increase') || contentLower.includes('raise')) {
      return { percentage, direction: 'increase' };
    }
    if (contentLower.includes('decrease') || contentLower.includes('reduce')) {
      return { percentage, direction: 'decrease' };
    }

    return defaultImpact;
  }

  private extractCountries(content: string, subjects: string[] = []): string[] {
    // This is a simplified implementation. In a real system, we would use
    // a more sophisticated NER (Named Entity Recognition) system
    const commonCountries = ['USA', 'China', 'EU', 'Japan', 'Mexico', 'Canada'];
    return commonCountries.filter(country => 
      content.includes(country) || subjects.includes(country)
    );
  }

  private normalizeUstrNews(ustrNews: Awaited<ReturnType<UstrApiClient['searchNews']>>): NormalizedNewsItem[] {
    return ustrNews.map(news => ({
      title: news.title,
      content: news.content,
      countries: this.extractCountries(news.content),
      categories: [news.category || 'uncategorized'],
      impactLevel: this.estimateImpactLevel(news.content),
      priceImpact: this.estimatePriceImpact(news.content),
      sourceUrls: [news.sourceUrl],
      publishDate: new Date(news.publishedDate)
    }));
  }

  private normalizeWtoNews(wtoNews: Awaited<ReturnType<WtoApiClient['searchNews']>>): NormalizedNewsItem[] {
    return wtoNews.map(news => ({
      title: news.title,
      content: news.content,
      countries: this.extractCountries(news.content),
      categories: [news.category || 'uncategorized'],
      impactLevel: this.estimateImpactLevel(news.content),
      priceImpact: this.estimatePriceImpact(news.content),
      sourceUrls: [news.sourceUrl],
      publishDate: new Date(news.publishedDate)
    }));
  }

  async aggregateLatestNews(): Promise<NormalizedNewsItem[]> {
    try {
      const [ustrNews, wtoNews] = await Promise.all([
        this.ustrClient.getLatestTariffNews(),
        this.wtoClient.getLatestTariffNews()
      ]);

      const normalizedUstrNews = this.normalizeUstrNews(ustrNews);
      const normalizedWtoNews = this.normalizeWtoNews(wtoNews);

      // Combine and sort by publish date (newest first)
      return [...normalizedUstrNews, ...normalizedWtoNews]
        .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
    } catch (error) {
      this.logger.error('Failed to aggregate news', { error: String(error) });
      return [];
    }
  }
} 