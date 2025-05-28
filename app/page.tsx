import ProductGrid from '@/components/features/ProductGrid'
import CountryGrid from '@/components/features/CountryGrid'
import BannerLayout from '@/components/layout/BannerLayout'
import { getFeaturedNews, getProducts, getAllCountries } from '@/lib/sanity/queries'
import NewsCard from '@/components/features/NewsCard'
import TariffMetric from '@/components/features/TariffMetric'
import SparklineChart from '@/components/ui/SparklineChart'
import CountryWatch from '@/components/features/CountryWatch'
import { NewsArticle } from '@/lib/sanity/queries'
import { RateHistoryPoint } from '../lib/sanity/queries'
import USTariffOverview from '@/components/features/USTariffOverview'
import NewsCarousel from '@/components/features/NewsCarousel'

export default async function Home() {
  const [featuredNews, products, countries] = await Promise.all([
    getFeaturedNews(),
    getProducts(4),
    getAllCountries()
  ])
  
  const placeholderSparklineData: RateHistoryPoint[] = []

  return (
    <main className="min-h-screen">
      {/* Responsive grid: side ads on desktop, hidden on mobile/tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-[96px_minmax(0,1fr)_96px] gap-0">
        {/* Left Ad (desktop only) */}
        <div className="hidden lg:flex items-center justify-center bg-gray-100" style={{ minHeight: '100vh' }}>
          <div className="w-24 h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">Ad Space</div>
        </div>
        {/* Main Content */}
        <div>
          <div className="mx-auto w-full px-4 pt-24">
            {/* News Section */}
            <div>
              <div className="px-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest News</h2>
              </div>
              <NewsCarousel latestNews={featuredNews} containerClassName="w-full" />
              {/* Horizontal ad for mobile/tablet */}
              <div className="block lg:hidden my-4 w-full flex justify-center">
                <div className="w-full max-w-md h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">Ad Space</div>
              </div>
            </div>
            {/* Products Section */}
            <div className="pt-8">
              <ProductGrid products={products} />
            </div>
            {/* Country Matrix Section */}
            <div className="py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Country Matrix</h2>
              <CountryGrid countries={countries} limit={4} />
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">US Tariff Impact</h3>
                  <USTariffOverview />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right Ad (desktop only) */}
        <div className="hidden lg:flex items-center justify-center bg-gray-100" style={{ minHeight: '100vh' }}>
          <div className="w-24 h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">Ad Space</div>
        </div>
      </div>
    </main>
  )
} 