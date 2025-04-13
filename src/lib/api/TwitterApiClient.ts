import { BaseNewsApiClient, type NewsApiConfig } from './BaseNewsApiClient';
import type { NormalizedNewsItem } from '@/types/api';
import { Logger } from '../../../lib/utils/logger';

interface TwitterApiConfig extends Omit<NewsApiConfig, 'sourceId' | 'sourceName' | 'sourceType'> {
  bearerToken: string;
  apiKey: string;
  apiKeySecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    urls?: Array<{ expanded_url: string }>;
  };
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  context_annotations?: Array<{
    domain: { id: string; name: string; description?: string };
    entity: { id: string; name: string; description?: string };
  }>;
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  verified: boolean;
}

interface TwitterSearchResponse {
  data: Tweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
    next_token?: string;
  };
}

export class TwitterApiClient extends BaseNewsApiClient {
  private readonly bearerToken: string;
  private readonly apiKey: string;
  private readonly apiKeySecret: string;
  private readonly accessToken?: string;
  private readonly accessTokenSecret?: string;
  private readonly logger: Logger;

  // List of accounts to monitor for tariff-related news
  private readonly tariffAccounts = [
    'USTR',
    'WTO',
    'Trade_EU',
    'USTradeRep',
    'CommerceGov',
    'tradegovukCIT'
  ];

  // List of hashtags to monitor
  private readonly tariffHashtags = [
    'tariffs',
    'tradepolicy',
    'tradewar',
    'globaltrade',
    'WTO',
    'USTR'
  ];

  constructor(config: TwitterApiConfig) {
    super({
      ...config,
      sourceId: 'twitter',
      sourceName: 'Twitter',
      sourceType: 'social',
      baseUrl: 'https://api.twitter.com/2',
      auth: {
        type: 'apiKey',
        apiKey: config.bearerToken
      },
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`
      }
    });

    this.bearerToken = config.bearerToken;
    this.apiKey = config.apiKey;
    this.apiKeySecret = config.apiKeySecret;
    this.accessToken = config.accessToken;
    this.accessTokenSecret = config.accessTokenSecret;
    this.logger = new Logger('TwitterApiClient');
  }

  protected normalizeNewsItem(tweet: Tweet, user?: TwitterUser): NormalizedNewsItem {
    const categories = [
      ...(tweet.entities?.hashtags?.map(h => h.tag) || []),
      ...(tweet.context_annotations?.map(c => c.domain.name) || [])
    ];

    const normalizedItem: NormalizedNewsItem = {
      title: tweet.text.split('\n')[0], // First line as title
      content: tweet.text,
      publishedDate: new Date(tweet.created_at),
      sourceUrl: `https://twitter.com/${user?.username || tweet.author_id}/status/${tweet.id}`,
      source: this.sourceName,
      categories,
      metadata: {
        authorId: tweet.author_id,
        authorName: user?.name,
        authorUsername: user?.username,
        metrics: tweet.public_metrics,
        verified: user?.verified
      }
    };

    // Add impact analysis if it's tariff related
    if (this.isTariffRelated(normalizedItem)) {
      normalizedItem.impact = {
        level: this.analyzeImpactLevel(normalizedItem),
        description: this.generateImpactDescription(tweet, user)
      };
    }

    return normalizedItem;
  }

  private generateImpactDescription(tweet: Tweet, user?: TwitterUser): string {
    const authorInfo = user?.verified ? 
      `verified account ${user.name} (@${user.username})` : 
      `account @${user?.username || tweet.author_id}`;
    
    const metrics = tweet.public_metrics;
    const engagement = metrics ? 
      `with ${metrics.retweet_count} retweets and ${metrics.like_count} likes` :
      '';

    return `Trade policy update from ${authorInfo} ${engagement}`;
  }

  public async getLatestNews(limit: number = 20): Promise<NormalizedNewsItem[]> {
    const query = this.buildTariffQuery();
    return this.searchNews(query, limit);
  }

  public async searchNews(query: string, limit: number = 20): Promise<NormalizedNewsItem[]> {
    try {
      const response = await this.request<TwitterSearchResponse>({
        method: 'GET',
        url: '/tweets/search/recent',
        params: {
          query,
          max_results: limit,
          'tweet.fields': 'created_at,entities,public_metrics,context_annotations',
          'expansions': 'author_id',
          'user.fields': 'name,username,description,verified'
        }
      });

      if (!response.data) {
        return [];
      }

      const userMap = new Map<string, TwitterUser>();
      if (response.includes?.users) {
        for (const user of response.includes.users) {
          userMap.set(user.id, user);
        }
      }

      return response.data.map(tweet => 
        this.normalizeNewsItem(tweet, userMap.get(tweet.author_id))
      );
    } catch (error) {
      this.logger.error('Failed to search Twitter', { error, query });
      return [];
    }
  }

  public async getNewsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<NormalizedNewsItem[]> {
    // Twitter API v2 only allows searching tweets from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (startDate < sevenDaysAgo) {
      startDate = sevenDaysAgo;
      this.logger.warn('Twitter API only allows searching tweets from the last 7 days. Adjusting start date.');
    }

    const query = `${this.buildTariffQuery()} -is:retweet`;
    return this.searchNews(query, limit);
  }

  private buildTariffQuery(): string {
    const accountQueries = this.tariffAccounts.map(account => `from:${account}`);
    const hashtagQueries = this.tariffHashtags.map(tag => `#${tag}`);
    
    const keywordQueries = [
      'tariff',
      'trade policy',
      'trade war',
      'import duty',
      'export duty',
      'customs duty',
      'trade restriction',
      'trade barrier'
    ];

    return [
      ...accountQueries,
      ...hashtagQueries,
      ...keywordQueries
    ].join(' OR ');
  }

  /**
   * Stream real-time tweets matching our tariff criteria
   * @param callback Function to be called for each matching tweet
   */
  public async streamTariffTweets(
    callback: (tweet: NormalizedNewsItem) => Promise<void>
  ): Promise<void> {
    try {
      const rules = await this.setStreamRules();
      
      const response = await this.request<Response>({
        method: 'GET',
        url: '/tweets/search/stream',
        params: {
          'tweet.fields': 'created_at,entities,public_metrics,context_annotations',
          'expansions': 'author_id',
          'user.fields': 'name,username,description,verified'
        },
        responseType: 'stream'
      });

      if (!response.body) {
        throw new Error('No response body received from stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        try {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const data = JSON.parse(line);
            if (data.data) {
              const tweet = data.data;
              const user = data.includes?.users?.[0];
              const normalizedTweet = this.normalizeNewsItem(tweet, user);
              await callback(normalizedTweet);
            }
          }
        } catch (error: unknown) {
          this.logger.error('Error processing stream data', { error });
        }
      }
    } catch (error: unknown) {
      this.logger.error('Failed to initialize tweet stream', { error });
      throw error;
    }
  }

  private async setStreamRules(): Promise<void> {
    // First, delete all existing rules
    const currentRules = await this.request<{ data?: Array<{ id: string }> }>({
      method: 'GET',
      url: '/tweets/search/stream/rules'
    });

    if (currentRules.data?.length) {
      await this.request({
        method: 'POST',
        url: '/tweets/search/stream/rules',
        data: {
          delete: { ids: currentRules.data.map(rule => rule.id) }
        }
      });
    }

    // Add our tariff-related rules
    await this.request({
      method: 'POST',
      url: '/tweets/search/stream/rules',
      data: {
        add: [
          { value: this.buildTariffQuery(), tag: 'tariff-related' }
        ]
      }
    });
  }
} 