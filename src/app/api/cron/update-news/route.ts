import { NextResponse } from 'next/server';
import { UstrApiClient } from '@/lib/api/UstrApiClient';
import { WtoApiClient } from '@/lib/api/WtoApiClient';
import { NewsNormalizationService } from '@/lib/services/NewsNormalizationService';
import { Logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize API clients and services
const logger = new Logger('NewsUpdateCron');
const ustrClient = new UstrApiClient({
  auth: { type: 'none' },
  logger
});

const wtoClient = new WtoApiClient({
  auth: { type: 'none' },
  logger
});

const newsService = new NewsNormalizationService(ustrClient, wtoClient);

export async function GET(request: Request) {
  try {
    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aggregate latest news
    const normalizedNews = await newsService.aggregateLatestNews();
    
    // Store news items in the database
    const { error: insertError } = await supabase
      .from('news_items')
      .insert(
        normalizedNews.map(news => ({
          title: news.title,
          content: news.content,
          countries: news.countries,
          categories: news.categories,
          impact_level: news.impactLevel,
          price_impact: news.priceImpact,
          source_urls: news.sourceUrls,
          publish_date: news.publishDate.toISOString()
        }))
      );

    if (insertError) {
      logger.error('Failed to insert news items', { error: insertError });
      return NextResponse.json({ error: 'Failed to store news items' }, { status: 500 });
    }

    // Get user notification preferences
    const { data: userPreferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('user_id, email_notifications, notification_threshold')
      .eq('email_notifications', true);

    if (prefError) {
      logger.error('Failed to fetch user preferences', { error: prefError });
      return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 });
    }

    // Filter high-impact news for notifications
    const highImpactNews = normalizedNews.filter(news => 
      news.impactLevel === 'high' || 
      Math.abs(news.priceImpact.percentage) >= 5
    );

    if (highImpactNews.length > 0 && userPreferences.length > 0) {
      // TODO: Implement email notification service
      logger.info('High impact news detected', { 
        newsCount: highImpactNews.length,
        userCount: userPreferences.length 
      });
    }

    return NextResponse.json({
      success: true,
      newsCount: normalizedNews.length,
      highImpactCount: highImpactNews.length
    });
  } catch (error) {
    logger.error('News update cron failed', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 