'use client'

import type { Product as SanityProduct, RateHistoryPoint } from '@/lib/sanity/queries'
import Modal from '@/components/ui/Modal'
import Image from 'next/image'
import SparklineChart from '@/components/ui/SparklineChart'
import { format as formatDate, parseISO } from 'date-fns'
import { ExternalLink, Clock, ShoppingCart } from 'lucide-react'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: SanityProduct | null
  tariffHistory: RateHistoryPoint[]
  isLoading?: boolean
  countries?: Array<{ code: string; flagIconUrl?: string; flagUrl?: string; name: string }>
}

export default function ProductModal({
  isOpen,
  onClose,
  product,
  tariffHistory,
  isLoading = false,
  countries = []
}: ProductModalProps) {
  if (!product) return null

  // Validate and filter tariff history data
  const validTariffHistory = tariffHistory.filter(point => {
    const isValid = 
      point && 
      typeof point.rate === 'number' && 
      !isNaN(point.rate) &&
      point.date && 
      new Date(point.date).toString() !== 'Invalid Date'
    
    if (!isValid) {
      console.warn('Invalid tariff history point:', point)
    }
    return isValid
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Debug log the processed data
  console.debug('Processed tariff history:', {
    originalLength: tariffHistory.length,
    validLength: validTariffHistory.length,
    firstPoint: validTariffHistory[0],
    lastPoint: validTariffHistory[validTariffHistory.length - 1]
  })

  // Find the next tariff change if any
  const futureUpdates = product.relatedTariffUpdates?.filter(update => 
    new Date(update.effectiveDate) > new Date()
  ).sort((a, b) => 
    new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
  )
  
  const nextUpdate = futureUpdates?.[0]

  // Calculate time remaining until next tariff change
  const getTimeRemaining = (effectiveDate: string) => {
    const now = new Date()
    const effective = new Date(effectiveDate)
    const days = Math.ceil((effective.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return `${days} days`
  }

  // Find the latest tariff rate and impacted country flags
  let allPoints: { date: string, rate: number, countryCode?: string, countryName?: string }[] = []
  product.relatedTariffUpdates?.forEach(update => {
    const code = update.impactedCountry?.code
    const name = update.impactedCountry?.name
    if (update.history) {
      allPoints.push(...update.history.map(h => ({ ...h, countryCode: code, countryName: name })))
    }
    if (update.effectiveDate && update.newRate !== undefined) {
      allPoints.push({ date: update.effectiveDate, rate: update.newRate, countryCode: code, countryName: name })
    }
  })
  allPoints = allPoints.filter(p => p.date && typeof p.rate === 'number').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const latest = allPoints[0]
  // Gather all unique impacted countries
  const impactedCountryCodes = Array.from(new Set(product.relatedTariffUpdates?.map(u => u.impactedCountry?.code).filter(Boolean)))
  console.debug('Modal: impactedCountryCodes', impactedCountryCodes)
  const impactedCountries = impactedCountryCodes.map(code => {
    const found = countries.find(c => c.code && code && c.code.toLowerCase() === code.toLowerCase())
    if (!found) {
      // Instead of just logging, render a fallback
      return { code, name: code, flagIconUrl: '', flagUrl: '', _id: code };
    }
    return found
  }).filter(Boolean)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Product header with image and basic info */}
          <div className="flex gap-6">
            <div className="relative w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={product.image?.asset?.url || '/images/placeholder-product.jpg'}
                alt={product.image?.alt || product.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              {/* Impact score and purchase options */}
              <div className="space-y-4">
                {product.impactScore && (
                  <div className="px-3 py-2 bg-orange-100 text-orange-800 rounded-md inline-block">
                    <span className="font-medium">Impact Score:</span> {product.impactScore}
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Purchase Options</h3>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Check Current Price on Amazon
                    </a>
                    {/* Additional retailer links can be added here */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Tariff Impact section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Latest Tariff Impact</h3>
              <div className="flex gap-2">
                {product.tags?.some(tag => tag.name.toLowerCase() === 'on sale') && (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white shadow">On Sale</span>
                )}
                {product.tags?.some(tag => tag.name.toLowerCase() === 'lowest price ever') && (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white shadow">Lowest Price Ever</span>
                )}
                {product.tags?.some(tag => tag.name.toLowerCase() === 'new tariff impact soon') && (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500 text-white shadow">New Tariff Impact Soon</span>
                )}
              </div>
            </div>
            {/* Show latest tariff update country and flag */}
            {latest && (
              <div className="mb-4 flex items-center gap-2 text-gray-700 flex-wrap">
                <span className="font-semibold">{latest.rate}% Tariff Rate</span>
                <span className="text-xs text-gray-400">(Since {formatDate(new Date(latest.date), 'MMM d, yyyy')})</span>
                {impactedCountries.length > 0 && (
                  <span className="flex items-center gap-1 ml-3">
                    {impactedCountries.map(countryObj => {
                      if (countryObj.flagIconUrl || countryObj.flagUrl) {
                        const flagUrl = countryObj.flagIconUrl || countryObj.flagUrl || ''
                        return flagUrl ? (
                          <img
                            key={countryObj.code}
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
                          <span key={countryObj.code} className="inline-block h-6 w-6 bg-red-200 border border-red-500 rounded-sm" title="No flag available" />
                        )
                      } else {
                        // Fallback for missing country
                        return <span key={countryObj.code} className="inline-block h-6 w-6 bg-yellow-200 border border-yellow-500 rounded-sm text-xs flex items-center justify-center" title="Country not found">{countryObj.code}</span>
                      }
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Next tariff change alert */}
          {nextUpdate && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <Clock className="h-5 w-5" />
                <h4 className="font-medium">Upcoming Tariff Change</h4>
              </div>
              <p className="text-yellow-800">
                New rate of {nextUpdate.newRate}% takes effect in {getTimeRemaining(nextUpdate.effectiveDate)}
              </p>
            </div>
          )}

          {/* Tariff rate chart */}
          <div className="p-4 border rounded-md bg-gray-50 max-w-md mx-auto">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Historical Tariff Rates</h4>
            <div className="w-full min-h-[200px]">
              {validTariffHistory.length > 0 ? (
                <SparklineChart 
                  data={validTariffHistory} 
                  height={200}
                  showTooltip={true}
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-500">No valid tariff history data available</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags section */}
          {product.tags && product.tags.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Product Categories</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span 
                    key={tag._id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
} 