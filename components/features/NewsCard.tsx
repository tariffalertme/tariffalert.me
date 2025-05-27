'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsArticle } from '@/lib/sanity/queries';
import TariffMetric from './TariffMetric';
import { format } from 'date-fns';

interface NewsCardProps {
  article: NewsArticle;
  highestRate?: number;
  effectiveDate?: string;
  priority?: boolean;
  highlight?: boolean;
  showLatestLabel?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, highestRate, effectiveDate, priority, highlight, showLatestLabel }) => {
  const imageUrl = article.mainImage?.url || '/images/placeholder-news.jpg';
  const imageAlt = article.mainImage?.alt || article.title;

  return (
    <article className={`bg-white rounded-lg shadow-md overflow-hidden border flex flex-col ${highlight ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
      {article.mainImage?.url && (
        <Link href={`/news/${article.slug.current}`} className="block aspect-video relative">
          <Image src={imageUrl} alt={imageAlt} fill priority={priority} style={{ objectFit: 'cover' }} />
          {showLatestLabel && (
            <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow">Latest Post</span>
          )}
        </Link>
      )}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {format(new Date(article.publishedAt), 'MMM d, yyyy')}
          </p>
          <h3 className="text-lg font-semibold mb-2 hover:text-blue-700">
            <Link href={`/news/${article.slug.current}`}>{article.title}</Link>
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        </div>
        {highestRate !== undefined && effectiveDate && (
          <div className="mt-auto pt-4 border-t border-gray-100">
            <TariffMetric 
              rate={highestRate} 
              effectiveDate={effectiveDate}
              onDetailsClick={() => {
                window.location.href = `/news/${article.slug.current}`;
              }}
            />
          </div>
        )}
      </div>
    </article>
  );
};

export default NewsCard; 