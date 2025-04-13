'use client';

import React from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../../../types/database';

interface ProductListProps {
  products: Product[];
  onSaveProduct?: (productId: string) => void;
  savedProductIds?: Set<string>;
}

export function ProductList({ 
  products, 
  onSaveProduct, 
  savedProductIds = new Set() 
}: ProductListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSaveClick={onSaveProduct ? () => onSaveProduct(product.id) : undefined}
          isSaved={savedProductIds.has(product.id)}
        />
      ))}
    </div>
  );
} 