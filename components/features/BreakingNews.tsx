'use client'

import { useEffect, useState } from 'react'
import { NewsArticle } from '@/lib/sanity/queries'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface BreakingNewsProps {
  articles?: NewsArticle[]
}

export default function BreakingNews({ articles = [] }: BreakingNewsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!articles.length || !isAutoPlaying) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length)
    }, 5000) // Change news every 5 seconds

    return () => clearInterval(timer)
  }, [articles.length, isAutoPlaying])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? articles.length - 1 : prevIndex - 1
    )
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length)
    setIsAutoPlaying(false)
  }

  if (!articles?.length) {
    return null
  }

  const currentArticle = articles[currentIndex]
  if (!currentArticle) return null

  return (
    <div className="relative w-full bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-6">Featured News</h2>
        <div className="relative overflow-hidden rounded-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="relative h-[400px] w-full rounded-lg overflow-hidden"
            >
              <Link href={`/news/${currentArticle.slug.current}`}>
                {currentArticle.mainImage?.url && (
                  <Image
                    src={currentArticle.mainImage.url}
                    alt={currentArticle.mainImage.alt || currentArticle.title}
                    fill
                    className="object-cover opacity-40"
                    priority
                  />
                )}
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                  <h3 className="text-3xl font-bold mb-4">
                    {currentArticle.title}
                  </h3>
                  <p className="text-lg mb-6 line-clamp-2">
                    {currentArticle.excerpt}
                  </p>
                  {currentArticle.category && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-red-600 rounded-full text-sm">
                        {currentArticle.category}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/75 transition-colors"
            aria-label="Previous article"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/75 transition-colors"
            aria-label="Next article"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center mt-4 gap-2">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-red-600 w-4' : 'bg-gray-500'
              }`}
              aria-label={`Go to article ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 