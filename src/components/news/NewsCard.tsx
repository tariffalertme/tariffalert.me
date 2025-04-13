'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface NewsCardProps {
  id: string;
  title: string;
  content: string;
  publishedDate: string;
  sourceUrl: string;
  imageUrl?: string;
}

export function NewsCard({
  id,
  title,
  content,
  publishedDate,
  sourceUrl,
  imageUrl
}: NewsCardProps) {
  const truncatedContent = content.length > 150 
    ? `${content.substring(0, 150)}...` 
    : content;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          <Link href={`/news/${id}`} className="hover:text-indigo-600">
            {title}
          </Link>
        </h3>
        
        <p className="text-gray-600 text-sm mb-4">
          {formatDistanceToNow(new Date(publishedDate), { addSuffix: true })}
        </p>

        <p className="text-gray-500 mb-4">
          {truncatedContent}
        </p>

        <div className="flex justify-between items-center">
          <Link
            href={`/news/${id}`}
            className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
          >
            Read more
          </Link>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-600 text-sm"
          >
            View source
          </a>
        </div>
      </div>
    </div>
  );
} 