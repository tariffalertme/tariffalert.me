'use client';

import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../lib/supabase/client';
import { ProductCard } from '../products/ProductCard';
import type { Product } from '../../../types/database';

interface SavedProductResult {
  product_id: string;
  products: Product;
}

export function SavedProducts() {
  const { supabase } = useSupabase();
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedProducts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not found');
          return;
        }

        const { data, error: queryError } = await supabase
          .from('saved_products')
          .select(`
            product_id,
            products (*)
          `)
          .eq('user_id', user.id);

        if (queryError) throw queryError;

        // Extract products from the joined query
        const products = (data as SavedProductResult[])
          .map(item => item.products)
          .filter((product): product is Product => product !== null);

        setSavedProducts(products);
      } catch (err) {
        console.error('Error loading saved products:', err);
        setError('Failed to load saved products');
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedProducts();
  }, [supabase]);

  const handleUnsaveProduct = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: deleteError } = await supabase
        .from('saved_products')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      // Update local state
      setSavedProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error removing saved product:', err);
      throw new Error('Failed to remove product from saved items');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (savedProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Products</h3>
        <p className="text-gray-500">
          You haven't saved any products yet. Browse our products and click the heart icon to save them for later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Saved Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSaveClick={() => handleUnsaveProduct(product.id)}
            isSaved={true}
          />
        ))}
      </div>
    </div>
  );
} 