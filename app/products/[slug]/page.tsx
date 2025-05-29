import { getProductById } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import Head from 'next/head'
import SparklineChart from '@/components/ui/SparklineChart'

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

    const imageUrl = product.image ? product.image.asset.url : '/placeholder.png'
    let allPoints: { date: string, rate: number, countryCode?: string, countryName?: string }[] = []
    product.relatedTariffUpdates?.forEach(update => {
      const code = update.impactedCountry?.code || update.country?.code
      const name = update.impactedCountry?.name || update.country?.name
      if (update.history) {
        allPoints.push(...update.history.map(h => ({ ...h, countryCode: code, countryName: name })))
      }
      if (update.effectiveDate && update.newRate !== undefined) {
        allPoints.push({ date: update.effectiveDate, rate: update.newRate, countryCode: code, countryName: name })
      }
    })
    allPoints = allPoints.filter(p => p.date && typeof p.rate === 'number').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

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
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                  <p className="text-gray-600 mb-6">{product.description}</p>
                  <div className="border-t border-gray-200 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="text-xl font-bold text-gray-900">${product.currentPrice}</p>
                      </div>
                    </div>
                  </div>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag: any, index: number) => (
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
                  {allPoints.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-lg font-semibold mb-2">Tariff Rate History</h2>
                      <SparklineChart data={allPoints} width={400} height={80} showTooltip color="#2563eb" />
                    </div>
                  )}
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