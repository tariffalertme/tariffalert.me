import { getAllProducts } from '@/lib/sanity/queries'
import ProductGrid from '@/components/features/ProductGrid'
import { Suspense } from 'react'
import BannerLayout from '@/components/layout/BannerLayout'

export const revalidate = 3600 // Revalidate every hour

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800">
        Unable to load products. Please try again later.
      </p>
      <p className="text-red-600 text-sm mt-2">
        {message}
      </p>
    </div>
  )
}

export default async function ProductsPage() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    return <ErrorState message="Sanity configuration is missing" />
  }

  try {
    const products = await getAllProducts()
    
    if (!products || !Array.isArray(products)) {
      return <ErrorState message="Failed to fetch products or invalid data format" />
    }

    return (
      <main className="min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-[64px_minmax(0,1fr)_64px] gap-0">
          {/* Left Ad (desktop only) */}
          <div className="hidden lg:block bg-gray-100 flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <div className="w-16 h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">Ad Space</div>
          </div>
          {/* Main Content */}
          <div>
            <BannerLayout>
              <div className="w-full px-4 pt-4">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
                  <p className="text-gray-600 mt-2">
                    Browse our collection of products affected by recent tariff changes
                  </p>
                </div>
                <Suspense fallback={<LoadingState />}>
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No products available at this time.</p>
                    </div>
                  ) : (
                    <ProductGrid products={products} showViewAll={false} />
                  )}
                </Suspense>
                {/* Horizontal ad for mobile/tablet */}
                <div className="block lg:hidden my-4 w-full flex justify-center">
                  <div className="w-full max-w-md h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">Ad Space</div>
                </div>
              </div>
            </BannerLayout>
          </div>
          {/* Right Ad (desktop only) */}
          <div className="hidden lg:block bg-gray-100 flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <div className="w-16 h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">Ad Space</div>
          </div>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Error fetching products:', error)
    return <ErrorState message={(error as Error).message} />
  }
} 