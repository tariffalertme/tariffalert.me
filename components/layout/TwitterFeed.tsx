'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'

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
        const newTweets = data.tweets && data.tweets.length > 0 ? data.tweets : mockTweets
        // Merge with localStorage tweets, dedupe by id, keep 15 most recent
        let cached = []
        try {
          cached = JSON.parse(localStorage.getItem('twitterFeedCache') || '[]')
        } catch {}
        const allTweets = [...newTweets, ...cached]
        const seen = new Set()
        const deduped = []
        for (const t of allTweets) {
          if (!seen.has(t.id)) {
            deduped.push(t)
            seen.add(t.id)
          }
          if (deduped.length >= 15) break
        }
        localStorage.setItem('twitterFeedCache', JSON.stringify(deduped))
        setTweets(deduped)
      } catch (e: any) {
        setError('Could not load Twitter feed. Showing sample tweets.')
        // Try to load from cache
        let cached = []
        try {
          cached = JSON.parse(localStorage.getItem('twitterFeedCache') || '[]')
        } catch {}
        setTweets(cached.length ? cached : mockTweets)
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
    let lastTimestamp: number | null = null
    let lastScrollLeft: number = scrollContainer.scrollLeft
    const scrollSpeed = 0.075 // px per ms (50% slower)

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp
      if (!scrollContainer) return
      if (isPaused) {
        lastTimestamp = timestamp
        lastScrollLeft = scrollContainer.scrollLeft
        animationFrameId = requestAnimationFrame(animate)
        return
      }
      const delta = timestamp - lastTimestamp
      lastTimestamp = timestamp
      scrollContainer.scrollLeft += scrollSpeed * delta
      // Infinite loop: if we've scrolled past the full set, reset to 0
      const listWidth = scrollContainer.scrollWidth / 2
      if (scrollContainer.scrollLeft >= listWidth) {
        scrollContainer.scrollLeft = 0
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPaused, tweets])

  // --- Drag and wheel scroll logic ---
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartScroll = useRef(0)

  // Mouse events
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartScroll.current = scrollRef.current?.scrollLeft || 0
    setIsPaused(true)
    document.body.style.cursor = 'grabbing'
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return
    const dx = e.clientX - dragStartX.current
    scrollRef.current.scrollLeft = dragStartScroll.current - dx
  }
  const onMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false
      setIsPaused(false)
      document.body.style.cursor = ''
    }
  }
  const onMouseLeave = () => {
    if (isDragging.current) {
      isDragging.current = false
      setIsPaused(false)
      document.body.style.cursor = ''
    }
  }
  // Wheel event for horizontal scroll
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        scrollRef.current.scrollLeft += e.deltaX
      } else if (e.shiftKey) {
        scrollRef.current.scrollLeft += e.deltaY
      }
    }
  }
  // Attach mouseup to window for drag end outside
  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mouseleave', onMouseLeave)
    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

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
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: isDragging.current ? 'none' : 'auto' }}
      >
        {/* Duplicate the tweet list for seamless looping */}
        {[...tweets, ...tweets].map((tweet, index) => {
          // Compute relative time
          let relTime = ''
          if (tweet.created_at) {
            try {
              relTime = formatDistanceToNowStrict(parseISO(tweet.created_at), { addSuffix: true })
            } catch {}
          }
          // Badge icon
          let badgeIcon = null
          if (tweet.author?.badge === 'blue') {
            badgeIcon = (
              <svg className="w-3 h-3 ml-1 text-blue-500 inline" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M10.5 15.5l-3-3 1.4-1.4 1.6 1.6 3.6-3.6 1.4 1.4z"/></svg>
            )
          } else if (tweet.author?.badge === 'yellow') {
            badgeIcon = (
              <svg className="w-3 h-3 ml-1 text-yellow-400 inline" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path fill="#fff" d="M10.5 15.5l-3-3 1.4-1.4 1.6 1.6 3.6-3.6 1.4 1.4z"/></svg>
            )
          }
          return (
            <a
              key={`${tweet.id || tweet.created_at}-${index}`}
              href={tweet.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start space-x-2 px-4 min-w-[380px] max-w-sm py-2 bg-white rounded-lg shadow border border-gray-100 mx-2 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ height: 'auto', alignSelf: 'flex-start', textDecoration: 'none' }}
              aria-label={`View tweet by @${tweet.author?.handle}`}
            >
              <div className="flex flex-col items-center pt-1">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={tweet.author?.image || '/placeholder-avatar.png'}
                    alt={`${tweet.author?.name || tweet.handle}'s avatar`}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <span className="font-bold text-gray-900 text-xs truncate">{tweet.author?.name || tweet.handle}</span>
                  {badgeIcon}
                  <span className="text-gray-500 text-xs truncate">@{tweet.author?.handle || tweet.handle}</span>
                  <span className="text-gray-400 text-xs">·</span>
                  <span className="text-gray-500 text-xs truncate">{relTime || tweet.timestamp || (tweet.created_at ? new Date(tweet.created_at).toLocaleString() : '')}</span>
                </div>
                <p className="text-gray-800 text-sm whitespace-pre-line break-words leading-snug line-clamp-3" style={{ wordBreak: 'break-word' }}>{tweet.text}</p>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
} 