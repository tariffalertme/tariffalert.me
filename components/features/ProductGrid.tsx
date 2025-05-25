'use client'

import React, { useState, useMemo, ChangeEvent, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {format} from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { RateHistoryPoint, getAllCountries, Country } from '@/lib/sanity/queries'
import type { Product as SanityProduct } from '@/lib/sanity/queries'
import TariffMetric from './TariffMetric'
import ProductModal from './ProductModal'

interface Tag {
  _id: string
  name: string
}

interface TariffUpdate {
  _id: string
  country: {
    name: string
    code: string
    flagIconUrl: string
  }
  effectiveDate: string
  rate: number
  productCategory: {
    _id: string
    name: string
  }
}

interface ProductGridProps {
  products: SanityProduct[]
  showViewAll?: boolean
}

const PLACEHOLDER_IMAGE = '/images/placeholder-product.jpg'

type SortOption = 'name-asc' | 'tariff-desc' | 'impact-desc' | 'date-desc';

export default function ProductGrid({ products: initialProducts, showViewAll = true }: ProductGridProps) {
  const [sortOption, setSortOption] = useState<SortOption>('date-desc')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAttribute, setSelectedAttribute] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SanityProduct | null>(null)
  const [selectedProductHistory, setSelectedProductHistory] = useState<RateHistoryPoint[]>([])
  const [countries, setCountries] = useState<Country[]>([])

  // Memoize calculations for filter options and getting latest tariff
  const { availableCountries, availableCategories } = useMemo(() => {
    const countries = new Set<string>()
    const categories = new Set<string>()
    initialProducts.forEach(product => {
      product.tags?.forEach(tag => {
        categories.add(tag.name)
      })
      product.relatedTariffUpdates?.forEach(update => {
        if (update.country?.name) countries.add(update.country.name)
      })
    })
    return {
      availableCountries: Array.from(countries).sort(),
      availableCategories: Array.from(categories).sort()
    }
  }, [initialProducts])

  const getLatestTariffRate = useMemo(() => (product: SanityProduct): number => {
    if (!product.relatedTariffUpdates?.length) return 0
    const latestUpdate = product.relatedTariffUpdates.reduce((latest, current) => 
      new Date(current.effectiveDate) > new Date(latest.effectiveDate) ? current : latest
    )
    return latestUpdate?.newRate || 0
  }, [])

  const handleProductClick = (product: SanityProduct) => {
    setSelectedProduct(product)
    
    // Combine all tariff history points from related updates
    const allHistoryPoints: RateHistoryPoint[] = []
    product.relatedTariffUpdates?.forEach(update => {
      if (update.history) {
        allHistoryPoints.push(...update.history)
      }
      // Add the current rate point
      if (update.effectiveDate && update.newRate) {
        allHistoryPoints.push({
          date: update.effectiveDate,
          rate: update.newRate
        })
      }
    })

    // Sort by date and remove duplicates
    const uniqueHistory = allHistoryPoints
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter((point, index, self) => 
        index === self.findIndex(p => p.date === point.date)
      )

    setSelectedProductHistory(uniqueHistory)
    setIsModalOpen(true)
  }

  // Apply filtering and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let processedProducts = [...initialProducts]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      processedProducts = processedProducts.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(t => t.name.toLowerCase().includes(query))
      )
    }

    // Apply country filter
    if (selectedCountry !== 'all') {
      processedProducts = processedProducts.filter(p => 
        p.relatedTariffUpdates?.some(u => u.impactedCountry?.code === selectedCountry)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      processedProducts = processedProducts.filter(p => 
        p.tags?.some(t => t.name === selectedCategory)
      )
    }

    // Apply attribute filter
    if (selectedAttribute !== 'all') {
      processedProducts = processedProducts.filter(p => 
        p.tags?.some(t => t.name === selectedAttribute)
      )
    }

    // Apply sorting
    processedProducts.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'tariff-desc':
          return getLatestTariffRate(b) - getLatestTariffRate(a)
        case 'date-desc':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        default:
          return 0
      }
    })

    return processedProducts
  }, [initialProducts, sortOption, selectedCountry, selectedCategory, selectedAttribute, searchQuery, getLatestTariffRate])

  const getImageUrl = (product: SanityProduct): string => {
    try {
      return product.image?.asset?.url || PLACEHOLDER_IMAGE
    } catch (error) {
      console.error('Error getting image URL:', error)
      return PLACEHOLDER_IMAGE
    }
  }

  const getImageAlt = (product: SanityProduct): string => {
    try {
      return product.image?.alt || product.name
    } catch (error) {
      return product.name
    }
  }

  useEffect(() => {
    getAllCountries().then(setCountries)
  }, [])

  // Helper to get country by code
  const getCountryByCode = (code: string) => countries.find(c => c.code === code)

  if (!Array.isArray(initialProducts)) {
    console.error('Products is not an array:', initialProducts)
    return null
  }

  const selectClasses = "w-full sm:w-[180px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"

  return (
    <>
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          {showViewAll && (
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Products</h2>
              <Link 
                href="/products" 
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View all products
                <span className="inline-block ml-1">→</span>
              </Link>
            </div>
          )}

          <div className="mb-8 space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <select 
                value={sortOption} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortOption(e.target.value as SortOption)}
                className={selectClasses}
              >
                <option value="date-desc">Sort: Newest First</option>
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="tariff-desc">Sort: Highest Tariff</option>
              </select>

              <select 
                id="country-select"
                value={selectedCountry} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCountry(e.target.value)}
                className={selectClasses}
              >
                <option value="all">All Countries</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>

              <select 
                value={selectedCategory} 
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                className={selectClasses + ' min-w-[180px] w-auto'}
              >
                <option value="all">All Categories</option>
                {Array.from(new Set(initialProducts.flatMap(p => p.tags || []).filter(tag => tag && tag.type === 'product_category').map(tag => tag!.name))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedAttribute}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAttribute(e.target.value)}
                className={selectClasses}
              >
                <option value="all">All Attributes</option>
                {Array.from(new Set(initialProducts.flatMap(p => p.tags || []).filter(tag => tag && tag.type === 'attribute').map(tag => tag!.name))).map(attribute => (
                  <option key={attribute} value={attribute}>{attribute}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.map((product) => {
                // Tag overlays
                const hasOnSale = product.tags?.some(tag => tag.name.toLowerCase() === 'on sale');
                const hasLowestPrice = product.tags?.some(tag => tag.name.toLowerCase() === 'lowest price ever');
                const hasNewTariff = product.tags?.some(tag => tag.name.toLowerCase() === 'new tariff impact soon');

                return (
                  <div key={product._id} className="group">
                    <button
                      onClick={() => handleProductClick(product)}
                      className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-lg"
                    >
                      <div className="relative h-48 w-full bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                        {/* Overlay badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                          {hasOnSale && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white shadow whitespace-nowrap">🏷️ On Sale</span>
                          )}
                          {hasLowestPrice && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white shadow whitespace-nowrap">🚨 Lowest Price Ever</span>
                          )}
                          {hasNewTariff && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-red-500 text-white shadow whitespace-nowrap">⚠️ New Tariff Impact Soon</span>
                          )}
                        </div>
                        <Image
                          src={getImageUrl(product)}
                          alt={getImageAlt(product)}
                          fill
                          className="object-contain"
                        />
                      </div>

                      <div className="mt-4">
                        <h3 className="text-sm text-gray-700">{product.name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {product.tags?.map((tag) => {
                            const tagName = tag.name.toLowerCase();
                            if (tagName === 'on sale' || tagName === 'lowest price ever' || tagName === 'new tariff impact soon') {
                              return null; // Don't render these as tags below the image
                            }
                            return (
                              <span key={tag._id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{tag.name}</span>
                            );
                          })}
                        </div>
                        {/* Show only the latest tariff update, no mini chart */}
                        {product.relatedTariffUpdates && product.relatedTariffUpdates.length > 0 && (() => {
                          // Gather all history points and update points
                          let allPoints: { date: string, rate: number, countryCode?: string, countryName?: string }[] = []
                          product.relatedTariffUpdates.forEach(update => {
                            if (update.history) {
                              allPoints.push(...update.history.map(h => ({ ...h, countryCode: update.impactedCountry?.code, countryName: update.impactedCountry?.name })))
                            }
                            if (update.effectiveDate && update.newRate !== undefined) {
                              allPoints.push({ date: update.effectiveDate, rate: update.newRate, countryCode: update.impactedCountry?.code, countryName: update.impactedCountry?.name })
                            }
                          })
                          // Sort by date descending
                          allPoints = allPoints.filter(p => p.date && typeof p.rate === 'number').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          const latest = allPoints[0]
                          // Gather all unique impacted countries
                          const impactedCountryCodes = Array.from(new Set(product.relatedTariffUpdates.map(u => u.impactedCountry?.code).filter(Boolean)))
                          console.debug('Grid: countries array', countries)
                          console.debug('Grid: impactedCountryCodes', impactedCountryCodes)
                          const impactedCountries = impactedCountryCodes.map(code => {
                            if (!code) return undefined; // skip undefined codes
                            const found = countries.find(c => c.code.toLowerCase() === code.toLowerCase())
                            if (!found) {
                              console.warn('Grid: No country found for code', code, 'Available codes:', countries.map(c => c.code))
                            }
                            return found
                          }).filter(Boolean)
                          return latest ? (
                            <div className="mt-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-semibold">{latest.rate}% Tariff Rate</span>
                                <span className="text-xs text-gray-400">(Since {format(new Date(latest.date), 'MMM d, yyyy')})</span>
                                {/* Show all impacted country flags */}
                                {impactedCountries.length > 0 && (
                                  <span className="flex items-center gap-1 ml-2">
                                    {impactedCountries.map(countryObj => {
                                      if (countryObj) {
                                        const flagUrl = countryObj.flagIconUrl || countryObj.flagUrl || ''
                                        console.debug('Grid: Rendering flag', {
                                          code: countryObj.code,
                                          name: countryObj.name,
                                          flagUrl
                                        })
                                        return flagUrl ? (
                                          <img
                                            key={countryObj.code || Math.random()}
                                            src={flagUrl}
                                            alt={countryObj.name + ' flag'}
                                            className="object-contain h-6 w-auto align-middle border border-blue-500 bg-white"
                                            title={countryObj.name}
                                            onError={e => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = '/images/placeholder-flag.png';
                                              e.currentTarget.className += ' border-red-500';
                                            }}
                                          />
                                        ) : (
                                          <span key={countryObj.code || Math.random()} className="inline-block h-6 w-6 bg-red-200 border border-red-500 rounded-sm" title="No flag available" />
                                        )
                                      } else {
                                        return <span key={Math.random()} className="inline-block h-6 w-6 bg-gray-200 border border-gray-400 rounded-sm" title="No flag available" />
                                      }
                                    })}
                                  </span>
                                )}
                                {/* Fallback for missing flags */}
                                {impactedCountries.length === 0 && (
                                  <span className="ml-2 text-xs text-gray-400">No country flag</span>
                                )}
                              </div>
                            </div>
                          ) : null
                        })()}
                      </div>
                    </button>
                  </div>
                )
              })
            ) : (
              <p className="col-span-full text-center text-gray-500 py-8">
                No products match your search criteria
              </p>
            )}
          </div>
        </div>
      </section>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        tariffHistory={selectedProductHistory}
        countries={countries}
      />
    </>
  )
} 