import BannerLayout from '@/components/layout/BannerLayout'
import CountryGrid from '@/components/features/CountryGrid'
import { getAllCountries } from '@/lib/sanity/queries'
import { Suspense } from 'react'
import type { Metadata } from 'next'

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
        Unable to load country data. Please try again later.
      </p>
      <p className="text-red-600 text-sm mt-2">
        {message}
      </p>
    </div>
  )
}

export default async function CountriesPage() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    return <ErrorState message="Sanity configuration is missing" />
  }

  try {
    const countries = await getAllCountries()
    
    if (!countries || !Array.isArray(countries)) {
      return <ErrorState message="Failed to fetch countries or invalid data format" />
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
                  <h1 className="text-3xl font-bold text-gray-900">Global Trade Impact</h1>
                  <p className="text-gray-600 mt-2">
                    Monitor trade relationships and tariff impacts across countries
                  </p>
                </div>
                <Suspense fallback={<LoadingState />}>
                  {countries.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No country data available at this time.</p>
                    </div>
                  ) : (
                    <CountryGrid countries={countries} />
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
    console.error('Error fetching countries:', error)
    return <ErrorState message={(error as Error).message} />
  }
}

export const metadata: Metadata = {
  title: 'Global Trade Impact | TariffAlert.me',
  description: 'Monitor trade relationships and tariff impacts across countries. Explore country-by-country tariff rates, major exports, and more.'
} 