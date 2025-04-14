import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || '');

const TRACKED_ACCOUNTS = [
  'AP',
  'nytimes',
  'SenateGOP',
  'elonmusk',
  'KamalaHarris',
  'AOC',
  'realDonaldTrump'
];

const SEARCH_KEYWORDS = ['tariff', '#tariffs'];

export async function GET() {
  try {
    // Create search query for tracked accounts and keywords
    const query = `(${SEARCH_KEYWORDS.join(' OR ')}) (from:${TRACKED_ACCOUNTS.join(' OR from:')})`;
    
    const tweets = await client.v2.search({
      query,
      'tweet.fields': ['created_at', 'author_id'],
      'user.fields': ['username'],
      max_results: 10,
    });

    const formattedTweets = tweets.data?.data?.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      author: tweet.author_id,
      created_at: tweet.created_at,
    })) || [];

    return NextResponse.json(formattedTweets);
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return NextResponse.json({ error: 'Failed to fetch tweets' }, { status: 500 });
  }
} 