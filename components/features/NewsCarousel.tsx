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
    const onSelect = () => {
      if (!emblaApi) return
      setVisibleSlides(emblaApi.slidesInView(true))
    }
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      if (emblaApi) emblaApi.off('select', onSelect)
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
                className={`relative transition-transform duration-300 ${isLatest ? 'scale-110 z-10' : 'scale-100'} ${isPartial ? 'opacity-60' : 'opacity-100'} min-w-[22%] max-w-[22%] ${isFirst ? 'ml-6' : ''} ${isLast ? 'mr-6' : ''}`}
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