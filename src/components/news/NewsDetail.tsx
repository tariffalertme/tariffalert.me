'use client';

import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import type { NewsItem } from '../../../types/database';

interface NewsDetailProps {
  news: NewsItem;
}

export function NewsDetail({ news }: NewsDetailProps) {
  return (
    <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      {news.image_url && (
        <div className="relative h-96 w-full">
          <Image
            src={news.image_url}
            alt={news.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {news.title}
        </h1>

        <div className="flex items-center text-gray-600 text-sm mb-8">
          <time dateTime={news.published_date}>
            {format(new Date(news.published_date), 'MMMM d, yyyy')}
          </time>
          <span className="mx-2">•</span>
          <a
            href={news.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600"
          >
            View original source
          </a>
        </div>

        {/* Article content */}
        <div className="prose prose-indigo max-w-none">
          <p className="whitespace-pre-wrap">{news.content}</p>
        </div>

        {/* Share buttons */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(news.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="text-gray-500 hover:text-gray-600"
            >
              <span className="sr-only">Share on Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </button>
            <button
              onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(news.title)}`, '_blank')}
              className="text-gray-500 hover:text-gray-600"
            >
              <span className="sr-only">Share on LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // You might want to add a toast notification here
              }}
              className="text-gray-500 hover:text-gray-600"
            >
              <span className="sr-only">Copy link</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
} 