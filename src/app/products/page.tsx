'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/client';
import { Product } from '@/types/product';
import { ProductGrid } from '@/components/products/ProductGrid';
import { FilterPanel } from '@/components/products/FilterPanel';
import { useAuth } from '@/lib/auth/AuthContext';

interface CategoryData {
  categories: {
    normalized: string[];
  };
}

interface CountryData {
  origin: {
    country: string;
  };
}

export default function ProductListingPage() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [impactLevels, setImpactLevels] = useState<('high' | 'medium' | 'low')[]>([]);

  // Available filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchFilterOptions();
    if (user) {
      fetchSavedProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('products').select('*');

      // Apply filters
      if (selectedCategories.length > 0) {
        query = query.containedBy('categories.normalized', selectedCategories);
      }
      if (selectedCountries.length > 0) {
        query = query.in('origin.country', selectedCountries);
      }
      if (priceRange.min > 0) {
        query = query.gte('current_price', priceRange.min);
      }
      if (priceRange.max < 1000) {
        query = query.lte('current_price', priceRange.max);
      }
      if (impactLevels.length > 0) {
        query = query.in('tariff_impact.level', impactLevels);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch unique categories
      const { data: categoryData } = await supabase
        .from('products')
        .select('categories')
        .not('categories', 'is', null);

      const uniqueCategories = new Set<string>();
      (categoryData as CategoryData[])?.forEach((item) => {
        item.categories.normalized.forEach((cat: string) => uniqueCategories.add(cat));
      });
      setCategories(Array.from(uniqueCategories).sort());

      // Fetch unique countries
      const { data: countryData } = await supabase
        .from('products')
        .select('origin')
        .not('origin', 'is', null);

      const uniqueCountries = new Set<string>();
      (countryData as CountryData[])?.forEach((item) => {
        uniqueCountries.add(item.origin.country);
      });
      setCountries(Array.from(uniqueCountries).sort());
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const fetchSavedProducts = async () => {
    try {
      const { data } = await supabase
        .from('saved_products')
        .select('product_id')
        .eq('user_id', user!.id);

      if (data) {
        setSavedProductIds(new Set(data.map((item: { product_id: string }) => item.product_id)));
      }
    } catch (err) {
      console.error('Failed to fetch saved products:', err);
    }
  };

  const handleSaveProduct = async (productId: string) => {
    if (!user) return;

    try {
      if (savedProductIds.has(productId)) {
        // Remove from saved products
        await supabase
          .from('saved_products')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        setSavedProductIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        // Add to saved products
        await supabase.from('saved_products').insert({
          user_id: user.id,
          product_id: productId,
        });

        setSavedProductIds((prev) => new Set([...prev, productId]));
      }
    } catch (err) {
      console.error('Failed to update saved product:', err);
    }
  };

  // Update filters and refetch products
  useEffect(() => {
    fetchProducts();
  }, [selectedCategories, selectedCountries, priceRange, impactLevels]);

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-red-600 text-lg">Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64">
          <FilterPanel
            categories={categories}
            countries={countries}
            selectedCategories={selectedCategories}
            selectedCountries={selectedCountries}
            priceRange={priceRange}
            impactLevels={impactLevels}
            onCategoryChange={setSelectedCategories}
            onCountryChange={setSelectedCountries}
            onPriceRangeChange={setPriceRange}
            onImpactLevelChange={setImpactLevels}
          />
        </div>
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading products...</p>
            </div>
          ) : (
            <ProductGrid
              products={products}
              onSaveProduct={user ? handleSaveProduct : undefined}
              savedProductIds={savedProductIds}
            />
          )}
        </div>
      </div>
    </div>
  );
} 