import type { NextApiRequest, NextApiResponse } from 'next'

const ACCOUNTS = [
  'WSJmarkets',
  'ReutersBiz',
  'DeItaone',
  'unusual_whales',
  'realDonaldTrump',
  'FoxNews',
  'DonaldJTrumpJr',
]
const KEYWORDS = ['Tariff', '#Tariff', '#tariffs']
const QUERY = `(${ACCOUNTS.map(a => `from:${a}`).join(' OR ')}) (${KEYWORDS.join(' OR ')})`
const MAX_RESULTS = 10
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

const MOCK_TWEETS = [
  {
    id: '1',
    text: 'Breaking: New tariffs announced on steel imports, affecting global trade relationships. #TariffAlert #GlobalTrade',
    created_at: new Date().toISOString(),
    author: {
      id: 'mock1',
      name: 'Trade Expert',
      handle: 'TradeExpert',
      image: '/placeholder-avatar.png',
      verified: true,
      badge: 'blue',
    },
    url: '#',
  },
  {
    id: '2',
    text: 'Supply chain update: Recent tariff changes impact automotive parts pricing worldwide. Analysis coming soon. #SupplyChain',
    created_at: new Date().toISOString(),
    author: {
      id: 'mock2',
      name: 'Supply Chain News',
      handle: 'SupplyChainNews',
      image: '/placeholder-avatar.png',
      verified: true,
      badge: 'blue',
    },
    url: '#',
  },
]

let cache: { tweets: any[]; timestamp: number } = { tweets: [], timestamp: 0 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Serve cache if valid
  if (cache.tweets.length && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json({ tweets: cache.tweets })
  }
  const bearer = process.env.TWITTER_BEARER_TOKEN
  if (!bearer) {
    // Serve cache if it exists, else mock data
    if (cache.tweets.length) {
      return res.status(200).json({ tweets: cache.tweets })
    }
    return res.status(200).json({ tweets: MOCK_TWEETS })
  }
  try {
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(QUERY)}&max_results=${MAX_RESULTS}&tweet.fields=created_at,author_id,text&expansions=author_id&user.fields=username,profile_image_url,verified,verified_type`
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${bearer}` },
    })
    if (!resp.ok) {
      // Serve cache if it exists, else mock data
      if (cache.tweets.length) {
        return res.status(200).json({ tweets: cache.tweets })
      }
      const err = await resp.text()
      return res.status(200).json({ tweets: MOCK_TWEETS, error: err })
    }
    const data = await resp.json()
    // Map users by id for easy lookup
    const usersById = (data.includes?.users || []).reduce((acc: any, user: any) => {
      acc[user.id] = user
      return acc
    }, {})
    // Map tweets to include user info and badge
    let tweets = (data.data || []).map((t: any) => {
      const user = usersById[t.author_id] || {}
      // Determine badge type (blue, yellow, none)
      let badge: 'blue' | 'yellow' | null = null
      if (user.verified) {
        badge = user.verified_type === 'business' ? 'yellow' : 'blue'
      }
      return {
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        author: {
          id: user.id,
          name: user.name || user.username || 'Unknown',
          handle: user.username || 'unknown',
          image: user.profile_image_url || '/placeholder-avatar.png',
          verified: !!user.verified,
          badge,
        },
        url: `https://x.com/${user.username}/status/${t.id}`,
      }
    })
    // Deduplicate by account (username), keep only the most recent tweet per account
    const seen = new Set()
    tweets = tweets.filter((tweet: any) => {
      if (seen.has(tweet.author.handle)) return false
      seen.add(tweet.author.handle)
      return true
    })
    // If no tweets, serve cache if it exists, else mock data
    if (!tweets.length) {
      if (cache.tweets.length) {
        return res.status(200).json({ tweets: cache.tweets })
      }
      return res.status(200).json({ tweets: MOCK_TWEETS })
    }
    cache = { tweets, timestamp: Date.now() }
    return res.status(200).json({ tweets })
  } catch (err) {
    // Serve cache if it exists, else mock data
    if (cache.tweets.length) {
      return res.status(200).json({ tweets: cache.tweets })
    }
    return res.status(200).json({ tweets: MOCK_TWEETS, error: (err as Error).message })
  }
} 