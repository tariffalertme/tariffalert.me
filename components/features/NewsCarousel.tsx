'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import NewsCard from '@/components/features/NewsCard'
import { NewsArticle } from '@/lib/sanity/queries'

interface NewsCarouselProps {
  latestNews: NewsArticle[]
  containerClassName?: string
}

export default function NewsCarousel({ latestNews, containerClassName }: NewsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ slidesToScroll: 1, containScroll: 'trimSnaps', loop: true })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      if (emblaApi) emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className={`relative ${containerClassName ?? ''}`}>
      <div className="overflow-x-auto" ref={emblaRef}>
        <div className="flex justify-start" style={{ gap: '1rem' }}>
          {latestNews.map((article, idx) => (
            <div key={article._id} className="min-w-0 flex-[0_0_100%] max-w-[100%] sm:flex-[0_0_50%] sm:max-w-[50%] lg:flex-[0_0_auto] lg:max-w-none lg:w-[320px]">
              <NewsCard article={article} priority={idx === 0} />
            </div>
          ))}
        </div>
      </div>
      {/* Carousel Controls */}
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-2 disabled:opacity-30"
        onClick={() => emblaApi && emblaApi.scrollPrev()}
        disabled={!canScrollPrev}
        aria-label="Scroll left"
      >
        &#8592;
      </button>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-2 disabled:opacity-30"
        onClick={() => emblaApi && emblaApi.scrollNext()}
        disabled={!canScrollNext}
        aria-label="Scroll right"
      >
        &#8594;
      </button>
    </div>
  )
} 