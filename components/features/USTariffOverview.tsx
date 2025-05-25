'use client'

import { useState, useEffect } from 'react'
import { RateHistoryPoint } from '@/lib/sanity/queries'
import { getCountryTariffHistory, getUSTariffImpactStats } from '@/lib/sanity/queries'
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis, Legend } from 'recharts'
import { format } from 'date-fns'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

interface USTariffStats {
  totalCountries: number
  averageRate: number
  maxRate: number
  recentChanges: Array<{
    countryName: string
    rateDelta: number
    date: string
  }>
}

const CHART_COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
  '#be123c', // rose-600
]

export default function USTariffOverview() {
  const [tariffData, setTariffData] = useState<RateHistoryPoint[]>([])
  const [stats, setStats] = useState<USTariffStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [historyData, statsData] = await Promise.all([
          getCountryTariffHistory('US'),
          getUSTariffImpactStats()
        ])
        setTariffData(historyData)
        setStats(statsData)
      } catch (err) {
        setError('Failed to load tariff data')
        console.error('Error fetching US tariff data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-6 min-h-[400px]">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    )
  }

  // Group data by country
  const countryGroups = tariffData.reduce((acc, point) => {
    if (!point.countryCode) return acc
    if (!acc[point.countryCode]) {
      acc[point.countryCode] = {
        name: point.countryName || point.countryCode,
        data: []
      }
    }
    acc[point.countryCode].data.push(point)
    return acc
  }, {} as Record<string, { name: string; data: RateHistoryPoint[] }>)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
          <p className="font-medium mb-1">{format(new Date(label), 'MMM d, yyyy')}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">{entry.name}: {entry.value}%</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-4">US Tariff Impact Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Countries Imposing Tariffs</p>
          <p className="text-2xl font-bold">{stats?.totalCountries || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Average Tariff Rate</p>
          <p className="text-2xl font-bold">{stats?.averageRate.toFixed(1)}%</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Highest Tariff Rate</p>
          <p className="text-2xl font-bold">{stats?.maxRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Recent Changes */}
      {stats?.recentChanges.length ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Recent Changes</h3>
          <div className="space-y-2">
            {stats.recentChanges.map((change, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {change.rateDelta > 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
                )}
                <span>
                  <span className="font-medium">{change.countryName}</span> {' '}
                  {change.rateDelta > 0 ? 'increased' : 'decreased'} tariffs by{' '}
                  <span className="font-medium">
                    {Math.abs(change.rateDelta).toFixed(1)}%
                  </span>
                  {' '}on {format(new Date(change.date), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Multi-line Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={tariffData}
            margin={{ top: 10, right: 30, bottom: 30, left: 40 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM yyyy')}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={30}
            />
            <YAxis
              tickFormatter={(rate) => `${rate}%`}
              tick={{ fontSize: 12 }}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {Object.entries(countryGroups).map(([code, group], index) => (
              <Line
                key={code}
                type="monotone"
                data={group.data}
                name={group.name}
                dataKey="rate"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 