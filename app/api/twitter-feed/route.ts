import { NextRequest, NextResponse } from 'next/server'
import { Rettiwt } from 'rettiwt-api'

const HANDLES = ['trendspider', 'eliteoptions2'];
// const KEYWORDS = ['tariff', 'tariffs', '#tariff', '#tariffs'];

// Helper to fetch tweets for a user using Rettiwt-API (user auth mode)
async function getTweetsForUser(handle: string): Promise<any[]> {
  try {
    const rettiwt = new Rettiwt({ apiKey: process.env.RETTIWT_API_KEY });
    // Step 1: Fetch user details to get the numeric ID
    const user = await rettiwt.user.details(handle);
    if (!user || !user.id) {
      console.error(`[twitter-feed] Could not fetch user details for @${handle}`);
      return [];
    }
    console.log(`[twitter-feed] @${handle} user ID: ${user.id}`);
    // Step 2: Fetch timeline using numeric ID
    const result = await rettiwt.user.timeline(user.id, 20);
    const tweets = result.list.map((tweet: any) => ({ ...tweet, handle }));
    console.log(`[twitter-feed] @${handle}: fetched ${tweets.length} tweets`);
    if (tweets.length > 0) {
      console.log(`[twitter-feed] @${handle} first tweet:`, JSON.stringify(tweets[0], null, 2));
    }
    return tweets;
  } catch (e: any) {
    console.error(`[twitter-feed] Error fetching tweets for @${handle}:`, e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const allTweets = await Promise.all(
      HANDLES.map(async (handle) => {
        return await getTweetsForUser(handle);
      })
    );
    const flatTweets = allTweets.flat();
    console.log(`[twitter-feed] Total tweets fetched: ${flatTweets.length}`);
    if (flatTweets.length > 0) {
      console.log(`[twitter-feed] First tweet:`, JSON.stringify(flatTweets[0], null, 2));
    }
    flatTweets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(flatTweets.slice(0, 30));
  } catch (e: any) {
    console.error('[twitter-feed] API error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch tweets' }, { status: 500 });
  }
} 