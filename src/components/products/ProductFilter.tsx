'use client';

import React from 'react';
import type { Category } from '../../../types/database';

interface ProductFilterProps {
  categories: Category[];
  selectedCategory?: string;
  priceRange: [number, number];
  maxPrice: number;
  onCategoryChange: (categoryId: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onSortChange: (sort: string) => void;
  selectedSort: string;
}

export function ProductFilter({
  categories,
  selectedCategory,
  priceRange,
  maxPrice,
  onCategoryChange,
  onPriceRangeChange,
  onSortChange,
  selectedSort
}: ProductFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
        <div className="space-y-2">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-indigo-600"
              name="category"
              value=""
              checked={!selectedCategory}
              onChange={() => onCategoryChange('')}
            />
            <span className="ml-2 text-gray-700">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-indigo-600"
                name="category"
                value={category.id}
                checked={selectedCategory === category.id}
                onChange={() => onCategoryChange(category.id)}
              />
              <span className="ml-2 text-gray-700">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Price Range</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
          <div className="flex gap-4">
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={priceRange[0]}
              onChange={(e) => onPriceRangeChange([parseInt(e.target.value), priceRange[1]])}
              className="w-full"
            />
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sort By</h3>
        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Active Filters */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <button
              onClick={() => onCategoryChange('')}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700"
            >
              {categories.find(c => c.id === selectedCategory)?.name}
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <button
              onClick={() => onPriceRangeChange([0, maxPrice])}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700"
            >
              ${priceRange[0]} - ${priceRange[1]}
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 