'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// Mock data for initial development
const mockTweets = [
  {
    id: '1',
    text: 'Breaking: New tariffs announced on steel imports, affecting global trade relationships. #TariffAlert #GlobalTrade',
    author: {
      name: 'Trade Expert',
      handle: 'TradeExpert',
      image: '/placeholder-avatar.png',
      verified: true
    },
    timestamp: '2h'
  },
  {
    id: '2',
    text: 'Supply chain update: Recent tariff changes impact automotive parts pricing worldwide. Analysis coming soon. #SupplyChain',
    author: {
      name: 'Supply Chain News',
      handle: 'SupplyChainNews',
      image: '/placeholder-avatar.png',
      verified: true
    },
    timestamp: '3h'
  },
  {
    id: '3',
    text: 'EU-US trade negotiations continue as new tariff policies are discussed. Major changes expected. #InternationalTrade',
    author: {
      name: 'EU Trade Watch',
      handle: 'EUTradeWatch',
      image: '/placeholder-avatar.png',
      verified: true
    },
    timestamp: '4h'
  },
  {
    id: '4',
    text: 'Asian markets respond to latest tariff adjustments. Key sectors showing significant price movements. #MarketUpdate',
    author: {
      name: 'Asian Markets Daily',
      handle: 'AsianMarketsDaily',
      image: '/placeholder-avatar.png',
      verified: true
    },
    timestamp: '5h'
  }
]

export default function TwitterFeed() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [tweets, setTweets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTweets() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/twitter-feed')
        if (!res.ok) throw new Error('Failed to fetch tweets')
        const data = await res.json()
        setTweets(data.length > 0 ? data : mockTweets)
      } catch (e: any) {
        setError('Could not load Twitter feed. Showing sample tweets.')
        setTweets(mockTweets)
      } finally {
        setLoading(false)
      }
    }
    fetchTweets()
  }, [])

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationFrameId: number
    let startTime: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      if (!scrollContainer || isPaused) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      const progress = timestamp - startTime
      scrollContainer.scrollLeft = (progress * 0.05) % (scrollContainer.scrollWidth / 2)

      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
        startTime = timestamp
        scrollContainer.scrollLeft = 0
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPaused, tweets])

  if (loading) {
    return (
      <div className="w-full bg-primary-50 border-y border-primary-100 overflow-hidden shadow-md sticky top-[64px] z-10 text-center py-2">
        <span className="text-gray-500 text-sm">Loading Twitter feed...</span>
      </div>
    )
  }

  return (
    <div 
      className="w-full bg-primary-50 border-y border-primary-100 overflow-hidden shadow-md sticky top-[64px] z-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {error && (
        <div className="text-red-500 text-xs text-center py-1">{error}</div>
      )}
      <div 
        ref={scrollRef}
        className="flex whitespace-nowrap py-1.5 overflow-x-hidden"
      >
        {tweets.map((tweet, index) => (
          <div
            key={`${tweet.id || tweet.created_at}-${index}`}
            className="inline-flex items-center space-x-2 px-4 min-w-max"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={tweet.author?.image || '/placeholder-avatar.png'}
                  alt={`${tweet.author?.name || tweet.handle}'s avatar`}
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="flex items-center">
                  <span className="font-bold text-gray-900 text-xs">{tweet.author?.name || tweet.handle}</span>
                  {tweet.author?.verified && (
                    <svg className="w-2.5 h-2.5 ml-0.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-500 text-xs">@{tweet.author?.handle || tweet.handle}</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-gray-500 text-xs">{tweet.timestamp || (tweet.created_at ? new Date(tweet.created_at).toLocaleString() : '')}</span>
              </div>
            </div>
            <p className="text-gray-800 text-xs">{tweet.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 