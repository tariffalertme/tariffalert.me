'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { getProductsByCountry, getCountryTariffHistory, Country, Product, RateHistoryPoint } from '@/lib/sanity/queries'
import CountryModal from './CountryModal'

interface CountryGridClientProps {
  countries: Country[]
  showTitle?: boolean
  limit?: number
}

export default function CountryGridClient({ countries, showTitle = true, limit }: CountryGridClientProps) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedCountryProducts, setSelectedCountryProducts] = useState<Product[]>([])
  const [selectedCountryHistory, setSelectedCountryHistory] = useState<RateHistoryPoint[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/w640/${countryCode.toLowerCase()}.png`
  }

  const handleCountryClick = async (country: Country) => {
    try {
      setModalLoading(true)
      setSelectedCountry(country)
      setIsModalOpen(true)
      const [products, historyData] = await Promise.all([
        getProductsByCountry(country.code),
        getCountryTariffHistory(country.code)
      ])
      setSelectedCountryProducts(products)
      setSelectedCountryHistory(historyData)
    } catch (err) {
      // Optionally handle error
    } finally {
      setModalLoading(false)
    }
  }

  const displayedCountries = limit ? countries.slice(0, limit) : countries

  return (
    <>
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          {showTitle && (
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Country Profiles</h2>
              {limit && (
                <button 
                  onClick={() => window.location.href = '/countries'}
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View all countries
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedCountries.map((country) => (
              <button 
                key={country._id}
                onClick={() => handleCountryClick(country)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 block text-left w-full flex flex-col h-full"
              >
                <div className="w-full h-20 md:h-36 mb-4 bg-white flex-shrink-0 flex items-start relative overflow-hidden">
                  <Image
                    src={country.code ? getFlagUrl(country.code) : '/placeholder-flag.png'}
                    alt={`${country.name} flag`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{country.name}</h3>
                  </div>
                  {country.majorExports && country.majorExports.length > 0 && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-gray-500 mb-1">Major Exports</p>
                      <div className="flex flex-wrap gap-1">
                        {country.majorExports.map((tag) => (
                          tag && (
                            <span 
                              key={tag._id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag.name}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <CountryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        country={selectedCountry}
        products={selectedCountryProducts}
        historyData={selectedCountryHistory}
        isLoading={modalLoading}
      />
    </>
  )
} 