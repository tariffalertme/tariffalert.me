'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '../../lib/utils/formatters';
import type { Product } from '../../../types/database';

interface ProductCardProps {
  product: Product;
  onSaveClick?: () => void;
  isSaved?: boolean;
}

export function ProductCard({ product, onSaveClick, isSaved = false }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48 w-full">
        <Image
          src={product.image_url || '/images/placeholder-product.png'}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          <Link href={`/products/${product.id}`} className="hover:text-indigo-600">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(product.current_price)}
          </span>
          <button
            onClick={onSaveClick}
            className={`${
              isSaved
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-gray-500'
            } focus:outline-none`}
          >
            <span className="sr-only">{isSaved ? 'Remove from saved' : 'Save product'}</span>
            <svg
              className="h-6 w-6"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <Link
            href={`/products/${product.id}`}
            className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
          >
            View details
          </Link>
          <span className="text-sm text-gray-500">
            Category: {product.category_id}
          </span>
        </div>
      </div>
    </div>
  );
} 