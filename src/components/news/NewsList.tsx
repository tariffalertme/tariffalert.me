'use client';

import React from 'react';
import { NewsCard } from './NewsCard';
import type { NewsItem } from '../../../types/database';

interface NewsListProps {
  news: NewsItem[];
}

export function NewsList({ news }: NewsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map((item) => (
        <NewsCard
          key={item.id}
          id={item.id}
          title={item.title}
          content={item.content}
          publishedDate={item.published_date}
          sourceUrl={item.source_url}
          imageUrl={item.image_url}
        />
      ))}
    </div>
  );
} 