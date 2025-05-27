'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RateHistoryPoint as BaseRateHistoryPoint } from '@/lib/sanity/queries'
import { getCountryTariffHistory, getUSTariffImpactStats } from '@/lib/sanity/queries'
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis, Legend, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const countryData: { countries: Array<{ code: string; flagIconUrl: string }> } = require('@/../sanity/exports/tariff_full_dataset.json')

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

// Extend RateHistoryPoint to include isFilled for chart logic
interface RateHistoryPoint extends BaseRateHistoryPoint {
  isFilled?: boolean;
}

export default function USTariffOverview() {
  const [tariffData, setTariffData] = useState<RateHistoryPoint[]>([])
  const [stats, setStats] = useState<USTariffStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const chartRef = useRef<any>(null)
  // Track hovered flag for tooltip (must be at top level)
  const [flagTooltip, setFlagTooltip] = useState<{ code: string, x: number, y: number } | null>(null);

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

  // Build wide-format data for recharts
  // 1. Get all unique country codes
  const countryCodes = Array.from(new Set(tariffData.map(p => p.countryCode).filter(Boolean))) as string[];
  // 2. Get all unique dates, sorted
  const allDates = Array.from(new Set(tariffData.map(p => p.date)))
    .map(date => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime())
    .map(d => d.toISOString().slice(0, 10));
  // 3. Build a map of country -> sorted data points
  const countryDataMap: Record<string, RateHistoryPoint[]> = {};
  for (const code of countryCodes) {
    countryDataMap[code] = tariffData
      .filter(p => p.countryCode === code && typeof p.rate === 'number' && p.rate >= 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  // 4. Build the wide-format array
  let lastRates: Record<string, number | null> = {};
  let lastReal: Record<string, boolean> = {};
  countryCodes.forEach(code => { lastRates[code] = null; lastReal[code] = false; });
  const wideData = allDates.map(date => {
    const row: Record<string, any> = { date, real: {} };
    for (const code of countryCodes) {
      const pt = countryDataMap[code].find(p => p.date === date);
      if (pt) {
        row[code] = pt.rate;
        row.real[code] = true;
        lastRates[code] = pt.rate;
        lastReal[code] = true;
      } else if (lastRates[code] !== null) {
        row[code] = lastRates[code];
        row.real[code] = false;
      } else {
        row[code] = null;
        row.real[code] = false;
      }
    }
    return row;
  });
  // Remove countries with no data at all
  const activeCountryCodes = countryCodes.filter(code => countryDataMap[code].length > 0);
  // Map country code to flag icon
  const flagMap = (countryData.countries || []).reduce<Record<string, string>>((acc, c) => {
    acc[c.code] = c.flagIconUrl;
    return acc;
  }, {});

  // Jitter logic: for each date, if multiple countries have the same rate, offset them
  const jitteredWideData = wideData.map(row => {
    // Find all rates and their counts
    const rateCounts: Record<string, number> = {}
    activeCountryCodes.forEach(code => {
      const val = row[code]
      if (val !== null && val !== undefined) {
        const key = val.toString()
        rateCounts[key] = (rateCounts[key] || 0) + 1
      }
    })
    // For each country, apply jitter if needed
    const jitteredRow = { ...row }
    const jitterMap: Record<string, number> = {}
    Object.entries(rateCounts).forEach(([rate, count]) => {
      if (count > 1) {
        // Spread them by ±0.5% increments
        let offset = -((count - 1) / 2)
        activeCountryCodes.forEach(code => {
          if (row[code] !== null && row[code] !== undefined && row[code].toString() === rate) {
            jitterMap[code] = offset * 0.5
            offset++
          }
        })
      }
    })
    activeCountryCodes.forEach(code => {
      if (jitterMap[code]) {
        jitteredRow[code] = row[code] + jitterMap[code]
      }
    })
    return jitteredRow
  })

  // Find closest available dates for 2018, 2021, 2025
  function findClosestDate(targetYear: number) {
    let minDiff = Infinity;
    let closest = allDates[0];
    for (const d of allDates) {
      const year = new Date(d).getFullYear();
      const diff = Math.abs(year - targetYear);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }
    return closest;
  }
  const xTicks = [findClosestDate(2018), findClosestDate(2021), findClosestDate(2025)];

  // Custom dot for real data points
  const renderDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props
    const isReal = payload.real && payload.real[dataKey]
    return <circle cx={cx} cy={cy} r={5} fill="#fff" stroke="#000" strokeWidth={2} opacity={isReal ? 1 : 0} />
  }

  // Custom tooltip for wide data
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      setHoveredDate(label)
      const row = jitteredWideData.find(d => d.date === label);
      if (!row) return null;
      const realCountries = activeCountryCodes.filter(code => row.real[code]);
      if (!realCountries.length) return null;
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
          <p className="font-medium mb-1">{format(new Date(label), 'MMM d, yyyy')}</p>
          {realCountries.map((code, idx) => {
            const entry = payload.find((e: any) => e.dataKey === code);
            return (
              <div key={code} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry?.color || '#888' }} />
                {flagMap[code] && (
                  <img src={flagMap[code]} alt={code + ' flag'} className="inline-block h-4 w-6 object-contain border border-gray-200 bg-white" />
                )}
                <span className="text-sm">{code}: {row[code]}%</span>
              </div>
            );
          })}
        </div>
      );
    }
    setHoveredDate(null)
    return null;
  };

  // Dynamic flag positioning: get y-pixel for latest rate using YAxis scale
  const getFlagY = (rate: number | null | undefined, yScale: any) => {
    if (rate === null || rate === undefined || !yScale) return 0
    return yScale(rate)
  }

  // Flag overlap detection and offset (vertical only, clamp to bounds)
  const getFlagPositions = (flagData: Array<{ code: string, y: number }>, svgHeight: number) => {
    // Sort by y
    const sorted = [...flagData].sort((a, b) => a.y - b.y)
    const positions: Array<{ code: string, y: number }> = []
    let lastY = -Infinity
    sorted.forEach((item, idx) => {
      let y = item.y
      if (y - lastY < 32) {
        y = lastY + 32
      }
      // Clamp to bounds
      y = Math.max(0, Math.min(y, svgHeight - 32))
      positions.push({ code: item.code, y })
      lastY = y
    })
    return positions
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
      <div className="h-[400px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            ref={chartRef}
            data={jitteredWideData}
            margin={{ top: 10, right: 70, bottom: 30, left: 40 }}
            onMouseLeave={() => setHoveredDate(null)}
          >
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={(date) => String(new Date(date).getFullYear())}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={30}
            />
            <YAxis
              tickFormatter={(rate) => `${rate}%`}
              tick={{ fontSize: 12 }}
              width={35}
              domain={[0, 'auto']}
            />
            {/* Subtle grid lines */}
            <g>
              <line x1="0" y1="0" x2="100%" y2="0" stroke="#e5e7eb" strokeWidth="1" />
            </g>
            {/* Vertical hover line */}
            {hoveredDate && (
              <ReferenceLine x={hoveredDate} stroke="#888" strokeDasharray="3 3" />
            )}
            <Tooltip content={<CustomTooltip />} />
            {/* No <Legend /> */}
            {activeCountryCodes.map((code, idx) => (
              <Line
                key={code}
                type="monotone"
                dataKey={code}
                name={code}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={hoveredCountry === code ? 6 : 4}
                opacity={hoveredCountry && hoveredCountry !== code ? 0.2 : 1}
                dot={renderDot}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
                connectNulls
                style={hoveredCountry === code ? { filter: 'drop-shadow(0 0 6px #0003)' } : {}}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {/* Render flag icons at the y-position of the latest rate for each country, with vertical overlap avoidance */}
        <svg className="absolute top-0 right-2 h-full w-12 pointer-events-none" style={{zIndex: 2, height: '100%', minHeight: 400, padding: 8}}>
          {(() => {
            // Find y for each flag
            const yScale = chartRef.current && chartRef.current.state && chartRef.current.state.yAxisMap && chartRef.current.state.yAxisMap[0] && chartRef.current.state.yAxisMap[0].scale
            const svgHeight = 400
            const flagData = activeCountryCodes.map(code => {
              let lastIdx = -1
              for (let i = jitteredWideData.length - 1; i >= 0; i--) {
                if (jitteredWideData[i][code] !== null && jitteredWideData[i][code] !== undefined) {
                  lastIdx = i
                  break
                }
              }
              if (lastIdx === -1) return null
              const y = getFlagY(jitteredWideData[lastIdx][code], yScale)
              return { code, y, lastIdx }
            }).filter(Boolean) as Array<{ code: string, y: number, lastIdx: number }>
            const positions = getFlagPositions(flagData, svgHeight)
            return positions.map(({ code, y }, i) => (
              <foreignObject
                key={code}
                x={0}
                y={y - 16}
                width={36}
                height={32}
                style={{ pointerEvents: 'auto' }}
              >
                <div
                  onMouseEnter={e => {
                    // Get bounding rect for tooltip positioning
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setFlagTooltip({ code, x: rect.right, y: rect.top });
                    setHoveredCountry(code);
                  }}
                  onMouseLeave={() => {
                    setFlagTooltip(null);
                    setHoveredCountry(null);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 32, cursor: 'pointer', position: 'relative' }}
                >
                  <img
                    src={flagMap[code]}
                    alt={code + ' flag'}
                    className={`h-6 w-9 object-contain border border-gray-200 bg-white shadow transition-all duration-200 ${hoveredCountry === code ? 'ring-2 ring-blue-400' : ''}`}
                    style={{ background: '#fff', borderRadius: 4 }}
                  />
                </div>
              </foreignObject>
            ))
          })()}
        </svg>
        {/* Flag hover tooltip rendered outside SVG, absolutely positioned */}
        {flagTooltip && (() => {
          // Find the last non-null value for this country (un-jittered)
          let lastIdx = -1;
          for (let i = wideData.length - 1; i >= 0; i--) {
            if (wideData[i][flagTooltip.code] !== null && wideData[i][flagTooltip.code] !== undefined) {
              lastIdx = i;
              break;
            }
          }
          const rate = lastIdx !== -1 ? wideData[lastIdx][flagTooltip.code] : null;
          return (
            <div style={{ position: 'fixed', left: flagTooltip.x + 10, top: flagTooltip.y - 10, zIndex: 1000 }} className="bg-white border shadow px-3 py-2 rounded text-xs">
              <div className="font-semibold mb-1">{flagTooltip.code}</div>
              <div>Latest Rate: {rate !== null && rate !== undefined ? rate + '%' : 'N/A'}</div>
            </div>
          );
        })()}
      </div>
    </div>
  )
} 