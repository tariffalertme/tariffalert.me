'use client';

import React from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/database';

interface ProductListProps {
  products: Product[];
  onSaveProduct?: (productId: string) => void;
  savedProductIds?: Set<string>;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onSaveProduct,
  savedProductIds = new Set(),
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
}; 