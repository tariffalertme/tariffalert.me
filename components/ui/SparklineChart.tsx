'use client'

import { RateHistoryPoint } from '@/lib/sanity/queries'
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis, Legend } from 'recharts'
import { format as formatDate, parseISO } from 'date-fns'

interface SparklineChartProps {
  data: RateHistoryPoint[]
  width?: number
  height?: number
  color?: string
  showTooltip?: boolean
  showLegend?: boolean
  isMultiLine?: boolean
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

export default function SparklineChart({
  data,
  width = 200,
  height = 50,
  color = '#2563eb', // blue-600
  showTooltip = false,
  showLegend = false,
  isMultiLine = false
}: SparklineChartProps) {
  // Sort data by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  if (!data.length) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded"
        style={{ width: '100%', height: height || 200 }}
      >
        <span className="text-sm text-gray-400">No data available</span>
      </div>
    )
  }

  // Group data by country if multi-line
  const countryGroups = isMultiLine ? data.reduce((acc, point) => {
    if (!point.countryCode) return acc
    if (!acc[point.countryCode]) {
      acc[point.countryCode] = {
        name: point.countryName || point.countryCode,
        data: []
      }
    }
    acc[point.countryCode].data.push(point)
    return acc
  }, {} as Record<string, { name: string; data: RateHistoryPoint[] }>) : null

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
          <p className="font-medium mb-1">{label.slice(0, 10)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              {isMultiLine && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="text-sm">
                {isMultiLine ? `${entry.name}: ` : ''}{entry.value}%
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Format date for X-axis (show only year)
  const formatXAxis = (date: string) => {
    try {
      return formatDate(parseISO(date), 'yyyy')
    } catch {
      return date.slice(0, 4)
    }
  }

  // Get unique years from data
  const years = Array.from(new Set(sortedData.map(d => formatXAxis(d.date)))).map(Number)
  const xTicks = years.includes(2018) && years.includes(2025) ? [2018, 2025] : years.length > 1 ? [years[0], years[years.length - 1]] : years

  // Get max rate for y-axis
  const maxRate = Math.max(...sortedData.map(d => d.rate), 0)
  const yTicks = [0, maxRate]

  // Format rate for Y-axis
  const formatYAxis = (rate: number) => {
    return `${rate}%`
  }

  return (
    <div style={{ width: '100%', height: height || 200 }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={sortedData} 
          margin={{ 
            top: 10, 
            right: showLegend ? 50 : 30, 
            bottom: 30, 
            left: 40 
          }}
        >
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={30}
            ticks={xTicks}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12 }}
            width={35}
            ticks={yTicks}
          />
          {isMultiLine ? (
            // Multi-line chart for US data
            Object.entries(countryGroups || {}).map(([code, group], index) => (
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
            ))
          ) : (
            // Single line for other countries
            <Line
              type="monotone"
              dataKey="rate"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          )}
          {showTooltip && (
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
              wrapperStyle={{ outline: 'none' }}
            />
          )}
          {showLegend && isMultiLine && <Legend />}
        </LineChart>
      </ResponsiveContainer>
      {!showTooltip && !isMultiLine && data.length > 0 && (
        <div className="absolute top-0 right-0 bg-white px-2 py-1 text-xs rounded shadow-sm">
          {data[data.length - 1].rate}%
        </div>
      )}
    </div>
  )
} 