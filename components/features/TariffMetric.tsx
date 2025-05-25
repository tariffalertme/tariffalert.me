/**
 * @component TariffMetric
 * @description Displays a metric card showing tariff rate, effective date, and countdown
 * @version 1.0.0
 * 
 * @changelog
 * - 2024-03-XX v1.0.0:
 *   - Initial implementation
 *   - Added rate display with alert
 *   - Added countdown with date-fns
 *   - Added loading and error states
 *   - Added accessibility features
 * 
 * @rollback
 * To rollback:
 * 1. Remove file
 * 2. Update any parent components to remove TariffMetric usage
 * Git command: git checkout HEAD^ components/features/TariffMetric.tsx
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { differenceInDays, format, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import SparklineChart from '@/components/ui/SparklineChart'
import { RateHistoryPoint } from '@/lib/sanity/queries'

export interface TariffMetricProps {
  /** The tariff rate percentage */
  rate: number
  /** The date when the tariff becomes effective (ISO string) */
  effectiveDate: string
  /** Callback function when details button is clicked */
  onDetailsClick: () => void
  /** Whether this tariff has high impact */
  isHighImpact?: boolean
  /** Whether the component is in loading state */
  isLoading?: boolean
  /** Country name imposing the tariff */
  countryName?: string
  /** Historical rate data */
  rateHistory?: RateHistoryPoint[]
}

export default function TariffMetric({
  rate,
  effectiveDate,
  onDetailsClick,
  isHighImpact = false,
  isLoading = false,
  countryName,
  rateHistory = []
}: TariffMetricProps) {
  const [daysRemaining, setDaysRemaining] = useState<number>(0)
  const [isEffective, setIsEffective] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const now = new Date()
        const effective = new Date(effectiveDate)
        
        if (!isValid(effective)) {
          throw new Error('Invalid effective date')
        }

        const days = differenceInDays(effective, now)
        setDaysRemaining(Math.max(0, days))
        setIsEffective(now >= effective)
        setError(null)
      } catch (err) {
        setError('Error calculating countdown')
        console.error('TariffMetric error:', err)
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000 * 60 * 60) // Update every hour

    return () => clearInterval(timer)
  }, [effectiveDate])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  // Determine urgency level for visual feedback
  const isUrgent = !isEffective && daysRemaining <= 7
  const isWarning = !isEffective && daysRemaining <= 30

  // Add current rate to history for visualization
  const allRates = [...rateHistory, { date: effectiveDate, rate }]

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
      role="article"
      aria-label={`${rate}% tariff metric for ${countryName || 'unknown country'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {rate}% Tariff
              {countryName && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  from {countryName}
                </span>
              )}
            </h3>
            {isHighImpact && (
              <AlertTriangle 
                className="h-5 w-5 text-amber-500" 
                aria-label="High impact tariff"
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isEffective ? (
              'Currently in effect'
            ) : (
              <>
                Effective in{' '}
                <span className={cn(
                  "font-medium",
                  isUrgent ? "text-red-600" : "text-gray-900"
                )}>
                  {daysRemaining} days
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(effectiveDate), 'MMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={onDetailsClick}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
          aria-label={`View tariff details for ${countryName || 'this product'}`}
        >
          See details
        </button>
      </div>

      {/* Rate History Sparkline */}
      {allRates.length > 1 && (
        <div className="mt-4" aria-label="Rate history trend">
          <SparklineChart 
            data={allRates}
            width={300}
            height={40}
            showTooltip
            color={isUrgent ? '#dc2626' : isWarning ? '#d97706' : '#2563eb'}
          />
        </div>
      )}

      {!isEffective && daysRemaining <= 30 && (
        <div 
          className="mt-4" 
          role="progressbar" 
          aria-valuenow={((30 - daysRemaining) / 30) * 100} 
          aria-valuemin={0} 
          aria-valuemax={100}
          aria-label={`${daysRemaining} days until effective`}
        >
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-in-out",
                isUrgent ? "bg-red-600" : 
                isWarning ? "bg-amber-500" : 
                "bg-blue-600"
              )}
              style={{
                width: `${((30 - daysRemaining) / 30) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 