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
}

const NewsCard: React.FC<NewsCardProps> = ({ article, highestRate, effectiveDate, priority }) => {
  const imageUrl = article.mainImage?.url || '/images/placeholder-news.jpg';
  const imageAlt = article.mainImage?.alt || article.title;

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col">
      {article.mainImage?.url && (
        <Link href={`/news/${article.slug.current}`} className="block aspect-video relative">
          <Image src={imageUrl} alt={imageAlt} layout="fill" objectFit="cover" priority={priority} />
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