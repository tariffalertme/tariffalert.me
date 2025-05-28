'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { Country, Product, RateHistoryPoint } from '@/lib/sanity/queries'
import SparklineChart from '@/components/ui/SparklineChart'
import CountdownTimer from '@/components/ui/CountdownTimer'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface CountryModalProps {
  isOpen: boolean
  onClose: () => void
  country: Country | null
  products: Product[]
  historyData: RateHistoryPoint[]
  isLoading?: boolean
  countryTariffUpdate?: { effectiveDate: string }
}

export default function CountryModal({
  isOpen,
  onClose,
  country,
  products,
  historyData,
  isLoading = false,
  countryTariffUpdate,
}: CountryModalProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ slidesToScroll: 1, containScroll: 'trimSnaps' })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      if (emblaApi) emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  if (!country) return null

  const isUS = country.code === 'US'
  const latestRate = historyData.length > 0 
    ? Math.max(...historyData.map(h => h.rate))
    : 0

  const uniqueImposingCountries = isUS 
    ? [...new Set(historyData.map(h => h.countryName).filter(Boolean))]
    : []

  console.log('CountryModal country:', country, 'products:', products, 'historyData:', historyData);
  if (!products || products.length === 0) {
    console.warn('CountryModal: No products found for country', country?.code);
  }
  if (!historyData || historyData.length === 0) {
    console.warn('CountryModal: No tariff history found for country', country?.code);
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                {/* Close button: always visible, top right */}
                <div className="absolute right-2 top-2 z-20">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-24 overflow-hidden rounded-lg">
                        <Image
                          src={country.flagUrl}
                          alt={`${country.name} flag`}
                          width={120}
                          height={80}
                          className="object-cover rounded"
                          style={{ aspectRatio: '3/2' }}
                        />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900">
                          {country.name}
                        </Dialog.Title>
                        {isUS ? (
                          <p className="mt-2 text-sm text-gray-500">
                            {uniqueImposingCountries.length} countries currently impose tariffs
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-gray-500">
                            Current US tariff rate: {latestRate}%
                          </p>
                        )}
                        {countryTariffUpdate && (
                          <div className="mt-2">
                            <CountdownTimer effectiveDate={countryTariffUpdate.effectiveDate} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Products Carousel Section */}
                    <div className="mt-8">
                      <h4 className="text-lg font-medium mb-4">Products Imported From This Country</h4>
                      {(!products || products.length === 0) && (
                        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 mb-4 rounded">
                          <strong>No products found for this country.</strong> Please check your data source or try again later.
                        </div>
                      )}
                      {products.length === 0 ? (
                        <div className="text-gray-500 italic">No products found for this country.</div>
                      ) : (
                        <div className="relative">
                          <div className="overflow-x-auto" ref={emblaRef}>
                            <div className="flex flex-nowrap" style={{ gap: '1rem' }}>
                              {products.map((product) => {
                                const card = (
                                  <div className="flex-shrink-0 flex flex-col items-center border rounded-lg p-4 bg-white h-full w-32 sm:w-40 overflow-hidden">
                                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 mb-2 overflow-hidden">
                                      <Image
                                        src={product.image.asset.url}
                                        alt={product.name}
                                        fill
                                        className="object-contain rounded"
                                      />
                                    </div>
                                    <h5 className="font-medium text-sm text-center line-clamp-2">{product.name}</h5>
                                    <p className="mt-1 text-xs text-gray-500 line-clamp-2 text-center">{product.description}</p>
                                  </div>
                                )
                                if (product.affiliateUrl) {
                                  return (
                                    <a
                                      key={product._id}
                                      href={product.affiliateUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 w-32 sm:w-40 p-2"
                                    >
                                      {card}
                                    </a>
                                  )
                                } else {
                                  return (
                                    <Link
                                      key={product._id}
                                      href={`/products/${product.slug.current}`}
                                      className="flex-shrink-0 w-32 sm:w-40 p-2"
                                    >
                                      {card}
                                    </Link>
                                  )
                                }
                              })}
                            </div>
                          </div>
                          {/* Carousel Controls */}
                          <button
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-2 disabled:opacity-30"
                            onClick={() => emblaApi && emblaApi.scrollPrev()}
                            disabled={!canScrollPrev}
                            aria-label="Scroll left"
                          >
                            &#8592;
                          </button>
                          <button
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full shadow p-2 disabled:opacity-30"
                            onClick={() => emblaApi && emblaApi.scrollNext()}
                            disabled={!canScrollNext}
                            aria-label="Scroll right"
                          >
                            &#8594;
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Two-column layout for Exports and Chart */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Major Exports */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Major Exports</h4>
                        {country?.majorExports && country.majorExports.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-gray-700">
                            {country.majorExports.map((exp: any) => (
                              <li key={typeof exp === 'string' ? exp : exp._id || exp.name}>
                                {typeof exp === 'string' ? exp : exp.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-gray-400 italic">No major exports listed.</div>
                        )}
                      </div>
                      {/* Tariff Rate History Chart */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Tariff Rate History</h4>
                        <div className="w-full min-h-[180px]">
                          {(!historyData || historyData.length === 0) && (
                            <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 mb-4 rounded">
                              <strong>No valid tariff history data available.</strong> Please check your data source or try again later.
                            </div>
                          )}
                          {historyData && historyData.length > 0 ? (
                            <SparklineChart data={historyData} height={180} showTooltip />
                          ) : (
                            <div className="flex items-center justify-center h-[180px] bg-gray-50 rounded-md">
                              <span className="text-sm text-gray-500">No valid tariff history data available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 