import { getProductById } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import Head from 'next/head'

export const revalidate = 3600 // Revalidate every hour

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  if (!slug) {
    return notFound();
  }

  try {
    const product = await getProductById(slug)

    if (!product) {
      return notFound()
    }

    const imageUrl = product.image ? urlForImage(product.image).url() : '/placeholder.png'
    const riskLevel = getRiskLevel(product.impactScore)
    const priceChange = calculatePriceChange(product.priceHistory)

    const productJsonLd = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      image: [imageUrl],
      description: product.description,
      sku: product._id,
      brand: {
        "@type": "Brand",
        name: product.category?.name || "Unknown"
      },
      offers: {
        "@type": "Offer",
        url: `https://yourdomain.com/products/${slug}`,
        priceCurrency: "USD",
        price: product.currentPrice,
        availability: "https://schema.org/InStock"
      }
    }

    return (
      <>
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
          />
        </Head>
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="relative h-96">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(riskLevel)}`}>
                      {riskLevel} Risk
                    </span>
                    {product.category && (
                      <span className="ml-4 text-gray-500">{product.category.name}</span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                  <p className="text-gray-600 mb-6">{product.description}</p>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="text-xl font-bold text-gray-900">${product.currentPrice}</p>
                      </div>
                      {priceChange && (
                        <div>
                          <p className="text-sm text-gray-500">Price Change</p>
                          <p className={`text-xl font-bold ${getPriceChangeColor(priceChange)}`}>
                            {priceChange > 0 ? '+' : ''}{priceChange}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 text-sm text-gray-500">
                    Added on {formatDate(product.dateAdded)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error('Error fetching product:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">An error occurred while loading the product.</p>
      </div>
    )
  }
}

function getRiskLevel(impactScore: number): string {
  if (impactScore >= 8) return 'High'
  if (impactScore >= 4) return 'Medium'
  return 'Low'
}

function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'High':
      return 'bg-red-100 text-red-800'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'Low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-red-600'
  if (change < 0) return 'text-green-600'
  return 'text-gray-900'
}

function calculatePriceChange(priceHistory?: { price: number, date: string }[]): number | null {
  if (!priceHistory || priceHistory.length < 2) return null
  
  const oldestPrice = priceHistory[0].price
  const newestPrice = priceHistory[priceHistory.length - 1].price
  
  return Number((((newestPrice - oldestPrice) / oldestPrice) * 100).toFixed(1))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const product = await getProductById(slug);
  if (!product) {
    return {
      title: 'Product Not Found | TariffAlert.me',
      description: 'This product could not be found.',
      alternates: {
        canonical: `https://yourdomain.com/products/${slug}`
      }
    }
  }
  const imageUrl = product.image ? urlForImage(product.image).url() : '/placeholder.png'
  return {
    title: `${product.name} | TariffAlert.me`,
    description: product.description,
    alternates: {
      canonical: `https://yourdomain.com/products/${slug}`
    },
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name
        }
      ],
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [imageUrl]
    }
  }
} 