'use client'

import { useState } from 'react'
import TariffMetric from '@/components/features/TariffMetric'

export default function TestTariffMetric() {
  const [showDetails, setShowDetails] = useState(false)

  // Test data based on real product structure
  const testTariffs = [
    {
      rate: 25,
      effectiveDate: '2024-05-01',
      countryName: 'China',
      isHighImpact: true
    },
    {
      rate: 15,
      effectiveDate: '2024-04-15',
      countryName: 'South Korea',
      isHighImpact: false
    },
    {
      rate: 30,
      effectiveDate: '2024-04-01',
      countryName: 'United States',
      isHighImpact: true
    }
  ]

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">TariffMetric Component Test</h1>
      
      <div className="space-y-4">
        {/* Loading State */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Loading State:</h2>
          <TariffMetric
            rate={0}
            effectiveDate=""
            onDetailsClick={() => {}}
            isLoading={true}
          />
        </div>

        {/* Error State */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Error State (Invalid Date):</h2>
          <TariffMetric
            rate={25}
            effectiveDate="invalid-date"
            onDetailsClick={() => {}}
          />
        </div>

        {/* Test Cases */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Live Examples:</h2>
          <div className="space-y-4">
            {testTariffs.map((tariff, index) => (
              <TariffMetric
                key={index}
                rate={tariff.rate}
                effectiveDate={tariff.effectiveDate}
                countryName={tariff.countryName}
                isHighImpact={tariff.isHighImpact}
                onDetailsClick={() => {
                  setShowDetails(true)
                  console.log(`Showing details for ${tariff.countryName} tariff`)
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* TODO: Add DrilldownTable component here when implemented */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Tariff Details</h3>
            <p className="text-gray-600">Details will be shown here once DrilldownTable is implemented.</p>
            <button
              onClick={() => setShowDetails(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 