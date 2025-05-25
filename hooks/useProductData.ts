import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { 
  getAllProducts, 
  getProductById, 
  // Import other query functions as needed
  // getProductsWithTariffs, 
  // getLatestNews, 
  // getArticle, 
  // getCountryByCode 
} from '../lib/sanity/queries';
import type { Product } from '../lib/sanity/queries'; // Import types
import useSWR from 'swr'

// Define keys for react-query
const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

/**
 * Hook to fetch all products.
 * Uses react-query for caching and state management.
 */
export const useAllProducts = (): UseQueryResult<Product[], Error> => {
  return useQuery<Product[], Error>({
    queryKey: productKeys.list('all'), // Use a specific key
    queryFn: getAllProducts, // Reference the query function from queries.ts
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour cache time
  });
};

/**
 * Hook to fetch a single product by its ID.
 * Uses react-query for caching and state management.
 * 
 * @param productId The Sanity document ID of the product.
 * @param enabled Optional boolean to enable/disable the query (e.g., if ID isn't available yet).
 */
export const useProductById = (productId: string | undefined, enabled: boolean = true): UseQueryResult<Product | null, Error> => {
  return useQuery<Product | null, Error>({
    queryKey: productKeys.detail(productId || '__none__'), // Ensure key is stable even if ID is undefined initially
    queryFn: () => {
      if (!productId) {
        // Should not happen if 'enabled' is false, but good practice
        return Promise.resolve(null); 
      }
      return getProductById(productId); // Reference the query function
    },
    enabled: enabled && !!productId, // Only run the query if enabled and productId is truthy
    staleTime: 1000 * 60 * 10, // 10 minutes for individual product details
    gcTime: 1000 * 60 * 60, // 1 hour cache time
  });
};

// --- Add hooks for other query functions as needed ---
/*
export const useProductsWithTariffs = (countryCode: string): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['products', 'tariffs', countryCode],
    queryFn: () => getProductsWithTariffs(countryCode),
    enabled: !!countryCode,
    // ... cache settings
  });
};

export const useLatestNews = (): UseQueryResult<any, Error> => { ... };
export const useArticle = (slug: string): UseQueryResult<any, Error> => { ... };
export const useCountryByCode = (code: string): UseQueryResult<any, Error> => { ... };
*/ 

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    error.message = await res.text()
    throw error
  }
  return res.json()
}

interface UseProductDataOptions {
  limit?: number
  withTariffs?: boolean
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
}

interface UseProductDataReturn {
  products: Product[]
  isLoading: boolean
  isError: Error | null
  mutate: () => void
}

export function useProductData({
  limit,
  withTariffs = true,
  revalidateOnFocus = true,
  revalidateOnReconnect = true
}: UseProductDataOptions = {}): UseProductDataReturn {
  const url = `/api/products${withTariffs ? '/with-tariffs' : ''}${limit ? `?limit=${limit}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    url,
    fetcher,
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true
    }
  )

  return {
    products: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useProduct(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Product>(
    `/api/products/${id}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true
    }
  )

  return {
    product: data,
    isLoading,
    isError: error,
    mutate
  }
}

// Example usage:
/*
function ProductList() {
  const { products, isLoading, isError } = useProductData({
    limit: 10,
    withTariffs: true
  })

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {isError.message}</div>

  return (
    <ul>
      {products.map(product => (
        <li key={product._id}>{product.name}</li>
      ))}
    </ul>
  )
}
*/ 