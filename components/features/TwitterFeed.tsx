'use client';

import { useEffect, useRef, useState } from 'react';

const mockTweets = [
  {
    id: '1',
    author: 'Trade Analyst',
    handle: '@tradeanalyst',
    avatar: '/images/placeholder-avatar.png',
    content: 'Breaking: EU announces new tariffs on steel imports. Major impact expected on global trade. #TradeWars',
    timestamp: '2h'
  },
  {
    id: '2',
    author: 'Market Watch',
    handle: '@marketwatch',
    avatar: '/images/placeholder-avatar.png',
    content: 'China responds to US tariffs with countermeasures. Markets showing volatility. #GlobalTrade',
    timestamp: '3h'
  },
  {
    id: '3',
    author: 'Trade News',
    handle: '@tradenews',
    avatar: '/images/placeholder-avatar.png',
    content: 'New trade agreement between UK and Japan goes into effect today. Reduced tariffs on automotive exports. #TradeDeals',
    timestamp: '5h'
  }
];

export default function TwitterFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const duplicatedTweets = [...mockTweets, ...mockTweets];

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || isPaused) return;

    const scrollSpeed = 1; // Pixels per frame
    let animationFrameId: number;
    let lastTimestamp: number;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      
      if (scrollElement) {
        scrollElement.scrollLeft += scrollSpeed * (delta / 16); // Normalize to 60fps

        if (scrollElement.scrollLeft >= scrollElement.scrollWidth / 2) {
          scrollElement.scrollLeft = 0;
        }
      }

      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPaused]);

  return (
    <div className="w-full bg-gray-900 py-2 border-y border-gray-800">
      <div 
        ref={scrollRef}
        className="overflow-x-hidden whitespace-nowrap"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="inline-flex gap-4 px-4">
          {duplicatedTweets.map((tweet, index) => (
            <div
              key={`${tweet.id}-${index}`}
              className="inline-block bg-gray-800 rounded-lg p-3 min-w-[280px] max-w-[280px]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <img
                  src={tweet.avatar}
                  alt={`${tweet.author}'s avatar`}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="font-semibold text-white text-sm">{tweet.author}</div>
                  <div className="text-gray-400 text-xs">{tweet.handle}</div>
                </div>
                <div className="ml-auto text-gray-400 text-xs">{tweet.timestamp}</div>
              </div>
              <p className="text-white whitespace-normal text-sm leading-snug">{tweet.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 