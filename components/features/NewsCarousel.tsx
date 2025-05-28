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
  const [emblaRef, emblaApi] = useEmblaCarousel({ slidesToScroll: 1, containScroll: 'trimSnaps', align: 'start', loop: true })
  const [visibleSlides, setVisibleSlides] = useState<number[]>([])

  useEffect(() => {
    if (!emblaApi) return
    const onSlidesInView = () => {
      if (!emblaApi) return
      const inView = emblaApi.slidesInView()
      setVisibleSlides(inView.length === 0 ? [0] : inView)
    }
    emblaApi.on('slidesInView', onSlidesInView)
    // Fallback: set initial state on mount
    onSlidesInView()
    return () => {
      if (emblaApi) emblaApi.off('slidesInView', onSlidesInView)
    }
  }, [emblaApi])

  return (
    <div className={`relative ${containerClassName ?? ''}`}>
      <div className="overflow-x-auto" ref={emblaRef}>
        <div className="flex justify-start" style={{ gap: '1rem' }}>
          {latestNews.map((article, idx) => {
            const isLatest = idx === 0;
            const isPartial = !visibleSlides.includes(idx);
            const isFirst = idx === 0;
            const isLast = idx === latestNews.length - 1;
            return (
              <div
                key={article._id}
                className={`relative transition-transform duration-300 ${isLatest ? 'scale-110 z-10' : 'scale-100'} ${isPartial ? 'opacity-60' : 'opacity-100'} min-w-full max-w-full sm:min-w-[50%] sm:max-w-[50%] md:min-w-[33%] md:max-w-[33%] lg:min-w-[22%] lg:max-w-[22%] ${isFirst ? 'ml-2 sm:ml-6' : ''} ${isLast ? 'mr-2 sm:mr-6' : ''}`}
              >
                <NewsCard article={article} priority={isLatest} highlight={isLatest} showLatestLabel={isLatest} partial={isPartial} />
              </div>
            );
          })}
        </div>
      </div>
      {/* Carousel Controls */}
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-2 disabled:opacity-30"
        onClick={() => emblaApi && emblaApi.scrollPrev()}
        aria-label="Scroll left"
      >
        &#8592;
      </button>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-2 disabled:opacity-30"
        onClick={() => emblaApi && emblaApi.scrollNext()}
        aria-label="Scroll right"
      >
        &#8594;
      </button>
    </div>
  )
} 